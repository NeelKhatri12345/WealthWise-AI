# 03 — Risk Profile Modeling

## Purpose
Trains a classification model to predict user financial risk profiles (Conservative, Moderate, Aggressive) based on engineered features from transaction data.

## Inputs
| File | Source |
|------|--------|
| `features_dataset.csv` | `analytics/data/exports/features/` |

## Outputs
| File | Destination |
|------|-------------|
| `risk_profile_predictions.csv` | `analytics/data/exports/risk_profile/` |
| `risk_profile_model.pkl` | `analytics/models/risk_profile/` |
| `risk_label_encoder.pkl` | `analytics/models/risk_profile/` |

## Generated Artifacts
- Trained risk classification model (scikit-learn)
- Label encoder for risk categories
- Prediction results with confidence scores
- Model evaluation metrics (accuracy, precision, recall, F1)
