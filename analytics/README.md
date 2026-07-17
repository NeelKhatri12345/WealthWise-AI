# WealthWise AI — Analytics

Machine learning pipeline for financial health scoring, risk profiling, portfolio recommendations, and AI coaching.

## Directory Structure

```
analytics/
├── configs/          # Model hyperparameters and data path configs
├── data/
│   ├── raw/          # Original bank statements and raw imports
│   ├── cleaned/      # Validated and cleaned datasets
│   ├── processed/    # Intermediate processing artifacts
│   └── exports/      # Final pipeline outputs (CSVs)
│       ├── features/
│       ├── risk_profile/
│       ├── health_score/
│       ├── portfolio/
│       └── ai_coach/
├── models/           # Trained model artifacts (.pkl)
│   ├── risk_profile/
│   ├── health_score/
│   ├── portfolio/
│   └── ai_coach/
├── notebooks/        # Jupyter notebooks by pipeline stage
│   ├── 01_data_preparation/
│   ├── 02_feature_engineering/
│   ├── 03_risk_modeling/
│   ├── 04_health_scoring/
│   ├── 05_portfolio_engine/
│   └── 06_ai_coach/
├── pipelines/        # Automated ML pipeline scripts
├── reports/          # Generated analysis and evaluation reports
├── README.md
└── requirements.txt
```

## Pipeline Execution Order

```
01_data_preparation → 02_feature_engineering → 03_risk_modeling
                                             → 04_health_scoring
                                                     ↓
                                             05_portfolio_engine
                                                     ↓
                                             06_ai_coach
```

## Setup

```bash
cd analytics
python -m venv .venv
source .venv/bin/activate    # Linux/Mac
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
jupyter notebook
```

## Notes

- Model artifacts (`.pkl`) are excluded from git via `.gitignore`. Use a model registry (MLflow, DVC) for production model versioning.
- Large datasets in `data/raw/` should also be managed with DVC or stored in cloud storage.
