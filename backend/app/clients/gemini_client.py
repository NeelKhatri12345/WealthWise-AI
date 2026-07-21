# """
# WealthWise AI - Gemini API Client

# Wraps google-genai SDK with retry logic, token tracking,
# and structured prompt building.
# """

# from app.core.config import get_settings
# from app.core.logger import logger
# from app.exceptions.custom_exceptions import ServiceUnavailableException

# settings = get_settings()


# class GeminiClient:

#     def __init__(self, _settings=None) -> None:
#         cfg = _settings or settings
#         try:
#             from google import genai
#             from google.genai import types

#             self._client = genai.Client(api_key=cfg.GEMINI_API_KEY)
#             self._model = cfg.GEMINI_MODEL
#             self._max_tokens = cfg.GEMINI_MAX_TOKENS
#             self._temperature = cfg.GEMINI_TEMPERATURE
#             self._types = types
#         except ImportError:
#             raise RuntimeError(
#                 "google-genai package not installed. Run: pip install google-genai"
#             )

#     async def generate(
#         self,
#         system_prompt: str,
#         history: list[dict],
#         user_message: str,
#     ) -> tuple[str, int]:
#         """
#         Send a chat completion request to Gemini.

#         Args:
#             system_prompt: System instruction context
#             history: Previous conversation turns [{"role": ..., "parts": [...]}]
#             user_message: Current user input

#         Returns:
#             Tuple of (response_text, tokens_used)

#         Raises:
#             ServiceUnavailableException: On API error
#         """
#         try:
#             # Build contents list from history + new message
#             contents = []
#             for turn in history:
#                 contents.append(
#                     self._types.Content(
#                         role=turn["role"],
#                         parts=[
#                             self._types.Part.from_text(text=p["text"])
#                             for p in turn["parts"]
#                         ],
#                     )
#                 )
#             contents.append(
#                 self._types.Content(
#                     role="user",
#                     parts=[self._types.Part.from_text(text=user_message)],
#                 )
#             )

#             config = self._types.GenerateContentConfig(
#                 system_instruction=system_prompt,
#                 max_output_tokens=self._max_tokens,
#                 temperature=self._temperature,
#             )

#             response = self._client.models.generate_content(
#                 model=self._model,
#                 contents=contents,
#                 config=config,
#             )

#             text = response.text or ""
#             tokens_used = (
#                 response.usage_metadata.total_token_count
#                 if response.usage_metadata
#                 else 0
#             )

#             logger.info(
#                 "Gemini API call completed",
#                 extra={"model": self._model, "tokens": tokens_used},
#             )
#             return text, tokens_used

#         except Exception as exc:
#             logger.error("Gemini API error", exc_info=exc)
#             except Exception as exc:
#     import traceback

#     print("\n========== GEMINI ERROR ==========")
#     traceback.print_exc()
#     print("==================================\n")

#     raise
#     async def health_check(self) -> bool:
#         """Simple connectivity check — returns True if API is reachable."""
#         try:
#             await self.generate(
#                 system_prompt="You are a test assistant.",
#                 history=[],
#                 user_message="Say 'OK' in one word.",
#             )
#             return True
#         except Exception:
#             return False
import asyncio
import httpx
from google.genai.errors import APIError
from app.exceptions.custom_exceptions import ServiceUnavailableException
from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()


class GeminiClient:
    def __init__(self, _settings=None) -> None:
        cfg = _settings or settings

        try:
            from google import genai
            from google.genai import types

            self._client = genai.Client(api_key=cfg.GEMINI_API_KEY)
            self._model = cfg.GEMINI_MODEL
            self._max_tokens = cfg.GEMINI_MAX_TOKENS
            self._temperature = cfg.GEMINI_TEMPERATURE
            self._types = types

            # ===== DEBUG =====
            print("\n========== GEMINI CONFIG ==========")
            print(f"Model       : {self._model}")
            print(f"Key Prefix  : {cfg.GEMINI_API_KEY[:12]}...")
            print(f"Max Tokens  : {self._max_tokens}")
            print(f"Temperature : {self._temperature}")
            print("===================================\n")

        except ImportError:
            raise RuntimeError(
                "google-genai package not installed. Run: pip install google-genai"
            )

    async def generate(
        self,
        system_prompt: str,
        history: list[dict],
        user_message: str,
    ) -> tuple[str, int]:
        """
        Send a chat completion request to Gemini with retry logic and exponential backoff.
        """

        # Build conversation history
        contents = []

        for turn in history:
            contents.append(
                self._types.Content(
                    role=turn["role"],
                    parts=[
                        self._types.Part.from_text(text=p["text"])
                        for p in turn["parts"]
                    ],
                )
            )

        contents.append(
            self._types.Content(
                role="user",
                parts=[
                    self._types.Part.from_text(text=user_message)
                ],
            )
        )

        config = self._types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=self._max_tokens,
            temperature=self._temperature,
        )

        max_retries = 3
        backoffs = [1, 2, 4]
        last_exc = None

        for attempt in range(max_retries + 1):
            try:
                print(f"\n========== GEMINI REQUEST (Attempt {attempt + 1}) ==========")
                print("Model:", self._model)
                print("History Turns:", len(history))
                print("User Message:", user_message)
                print("====================================\n")

                response = self._client.models.generate_content(
                    model=self._model,
                    contents=contents,
                    config=config,
                )

                print(f"\n========== GEMINI RESPONSE (Attempt {attempt + 1}) ==========")
                print(response)
                print("=====================================\n")

                text = response.text or ""

                tokens_used = (
                    response.usage_metadata.total_token_count
                    if response.usage_metadata
                    else 0
                )

                logger.info(
                    "Gemini API call completed",
                    extra={
                        "model": self._model,
                        "tokens": tokens_used,
                        "attempts": attempt + 1,
                    },
                )

                return text, tokens_used

            except (APIError, httpx.HTTPError, asyncio.TimeoutError, TimeoutError, Exception) as exc:
                last_exc = exc
                logger.warning(
                    f"Gemini API attempt {attempt + 1} failed: {exc}",
                    exc_info=True
                )
                if attempt < max_retries:
                    sleep_time = backoffs[attempt]
                    logger.info(f"Retrying Gemini in {sleep_time} seconds...")
                    await asyncio.sleep(sleep_time)
                else:
                    break

        # Log the original exception for debugging before raising the friendly exception
        logger.error("Gemini API call failed after all retries", exc_info=last_exc)
        raise ServiceUnavailableException(
            message="AI Coach is currently experiencing high demand. Please try again in a few moments."
        )

    async def health_check(self) -> bool:
        """Simple connectivity check."""

        try:
            await self.generate(
                system_prompt="You are a test assistant.",
                history=[],
                user_message="Say 'OK' in one word.",
            )
            return True
        except Exception:
            return False