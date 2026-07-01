# WealthWise AI — OCR & AI Integration Architecture

---

## 1. OCR Processing Pipeline

### Overview

The OCR pipeline converts uploaded bank statements (PDF/CSV) into structured transaction data using a two-stage process: text extraction then AI parsing.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      OCR PROCESSING PIPELINE                        │
└─────────────────────────────────────────────────────────────────────┘

STAGE 1: File Ingestion
┌─────────────────┐
│  Upload Handler │
│  statement_     │
│  routes.py      │
└────────┬────────┘
         │ multipart/form-data
         ▼
┌─────────────────┐     ┌──────────────────┐
│  File Validator │────►│  S3 Client       │
│  utils/         │     │  Upload raw file │
│  file_utils.py  │     │  to S3 bucket    │
│  • type check   │     └──────────────────┘
│  • size check   │              │
│  • MIME verify  │              │ s3_key
└────────┬────────┘              ▼
         │              ┌──────────────────┐
         │              │  Statement DB    │
         │              │  Record created  │
         │              │  status=PENDING  │
         │              └──────────────────┘

STAGE 2: Text Extraction
┌─────────────────────────────────────────────────────────────┐
│                    OCR Client (ocr_client.py)                │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  File Type   │    │  PDF Path    │    │  Image Path   │  │
│  │  Detection   │    │  (pdfplumber │    │  (pillow)     │  │
│  └──────┬───────┘    │  → images)  │    │               │  │
│         │            └──────┬───────┘    └───────┬───────┘  │
│         │                   │                    │           │
│         │                   └──────────┬─────────┘           │
│         │                             │                      │
│         ▼                             ▼                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Engine Selection                        │   │
│  │                                                       │   │
│  │  CSV  ──────────────────────────► pandas.read_csv()  │   │
│  │                                                       │   │
│  │  PDF (text-based) ─────────────► pdfplumber.extract  │   │
│  │                                                       │   │
│  │  PDF (scanned/image) ──────────► EasyOCR             │   │
│  │         ├─ confidence < 0.7 ──► PaddleOCR (fallback) │   │
│  │         └─ confidence >= 0.7 ─► Accept result        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│              raw_text: str, confidence: float                │
└───────────────────────────┬─────────────────────────────────┘
                            │

STAGE 3: AI Parsing (Gemini)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Gemini Client                             │
│                                                             │
│  System Prompt:                                             │
│  "You are a financial data extraction AI. Parse the         │
│  following bank statement text into structured JSON..."     │
│                                                             │
│  User Prompt: raw_text                                      │
│                                                             │
│  Output Schema:                                             │
│  {                                                          │
│    "bank_name": string,                                     │
│    "account_holder": string,                                │
│    "period_start": "YYYY-MM-DD",                           │
│    "period_end": "YYYY-MM-DD",                             │
│    "currency": "INR",                                       │
│    "transactions": [                                        │
│      {                                                      │
│        "date": "YYYY-MM-DD",                               │
│        "description": string,                               │
│        "amount": float,                                     │
│        "transaction_type": "CREDIT|DEBIT",                 │
│        "category": string,                                  │
│        "merchant_name": string,                             │
│        "balance_after": float                               │
│      }                                                      │
│    ]                                                        │
│  }                                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
STAGE 4: Persistence
┌─────────────────────────────────────────────────────────────┐
│  TransactionRepository.bulk_create()                        │
│  StatementRepository.update(status=COMPLETED)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. OCR Engine Decision Matrix

| Condition | Engine | Rationale |
|-----------|--------|-----------|
| File is CSV | pandas | Native columnar parse, no OCR needed |
| PDF has extractable text | pdfplumber | Fast, high accuracy, no GPU needed |
| PDF is scanned (image-based) | EasyOCR primary | Supports 40+ languages, handles Hindi/Devanagari |
| EasyOCR confidence < 70% | PaddleOCR fallback | Better accuracy on rotated/noisy images |
| Both engines fail | Store error | Set `status=FAILED`, notify user |

---

## 3. Gemini Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GEMINI CLIENT (gemini_client.py)                  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    GeminiClient Class                         │
│                                                              │
│  Initialization:                                             │
│   • google.genai.Client(api_key=settings.GEMINI_API_KEY)     │
│   • Model: gemini-2.5-flash                                  │
│   • Configures generation config (temp, max_tokens)          │
│                                                              │
│  Methods:                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ parse_statement(raw_text) → dict                    │    │
│  │  ├─ Structured output schema enforcement            │    │
│  │  ├─ JSON mode enabled                               │    │
│  │  └─ Retry on rate limit (exp. backoff)              │    │
│  │                                                     │    │
│  │ explain_health_score(score_data) → str              │    │
│  │  └─ Returns markdown-formatted explanation          │    │
│  │                                                     │    │
│  │ explain_risk_profile(profile_data) → dict           │    │
│  │  └─ Returns explanation + recommendations           │    │
│  │                                                     │    │
│  │ generate_portfolio(risk_profile) → dict             │    │
│  │  └─ Returns allocation + fund recommendations       │    │
│  │                                                     │    │
│  │ coach_chat(messages, financial_context) → str       │    │
│  │  ├─ Maintains conversation history                  │    │
│  │  ├─ Injects user financial context as system msg   │    │
│  │  └─ Returns coaching response                       │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. AI Coach Conversation Flow

```
User Message
     │
     ▼
ai_coach_routes.py
     │
     ├─► Load conversation history from DB (last N messages)
     │
     ├─► Build financial context:
     │     • Latest health score
     │     • Latest risk profile
     │     • Recent transaction summary (30 days)
     │     • Portfolio allocation
     │
     ▼
GeminiClient.coach_chat(
  messages=[
    {"role": "system", "content": COACH_SYSTEM_PROMPT + financial_context},
    {"role": "user", "content": "...prior messages..."},
    {"role": "user", "content": current_message},
  ]
)
     │
     ▼
Save response to ai_conversations (JSONB messages array)
     │
     ▼
Return response to client

─────────────────────────────────
COACH SYSTEM PROMPT TEMPLATE:
─────────────────────────────────
"You are WealthWise AI, an expert personal finance coach. 
You have access to the user's financial data:

Financial Summary:
- Monthly Income: ₹{income}
- Monthly Expenses: ₹{expenses}
- Savings Rate: {savings_rate}%
- Health Score: {score}/100 ({grade})
- Risk Profile: {profile}
- Top Expense Categories: {categories}

Provide personalized, actionable financial advice. 
Be empathetic, specific, and data-driven. 
Always cite the user's actual numbers when relevant.
Do not provide specific stock tips."
```

---

## 5. Gemini Error Handling & Retry Strategy

```python
# Pattern in gemini_client.py

MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]  # Exponential backoff in seconds

async def _call_with_retry(self, prompt: str) -> str:
    for attempt, delay in enumerate(RETRY_DELAYS):
        try:
            response = await self.client.aio.models.generate_content(...)
            return response.text
        except google.api_core.exceptions.ResourceExhausted:
            # Rate limited — wait and retry
            await asyncio.sleep(delay)
        except google.api_core.exceptions.ServiceUnavailable:
            # Gemini unavailable
            await asyncio.sleep(delay)
        except Exception as exc:
            raise GeminiServiceException(str(exc))
    raise GeminiServiceException("Max retries exceeded")
```

---

## 6. Prompt Engineering Guidelines

| Use Case | Temperature | Max Tokens | Strategy |
|----------|-------------|------------|----------|
| Statement parsing | 0.1 | 4096 | Structured JSON output, low creativity |
| Health score explanation | 0.5 | 1024 | Balanced, factual but readable |
| Risk profile explanation | 0.5 | 1024 | Balanced |
| Portfolio recommendation | 0.3 | 2048 | Low creativity, rules-based feel |
| AI Coach chat | 0.7 | 2048 | Conversational, empathetic |

---

## 7. Token Management

```
Strategy: Rolling Context Window

• Each session stores messages in JSONB array
• When token count approaches limit (6000/8192):
  ├─ Summarize oldest messages using Gemini
  ├─ Store summary as context_summary in DB
  └─ Replace old messages with summary + recent N messages

Token Accounting:
• total_tokens_used tracked per conversation
• Platform-level monitoring in admin dashboard
• Alert if single user exceeds 50k tokens/day
```

---

## 8. VLM (Visual Language Model) Support

Optional enhancement for future versions:

```
When enabled (VLM_ENABLED=true in settings):
  ├─ Skip EasyOCR/PaddleOCR entirely
  ├─ Send PDF pages as images directly to Gemini
  ├─ Use gemini-2.5-flash vision capabilities
  └─ One-step: image → structured transactions

Benefits:
  • Higher accuracy on complex layouts
  • Handles tables, colored headers, logos
  • No OCR engine maintenance

Trade-offs:
  • Higher API cost per statement
  • Slower (image upload + processing)
  • Dependency on Gemini availability
```
