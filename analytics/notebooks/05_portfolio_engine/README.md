# 05 — Portfolio Recommendation Engine

## Purpose
Generates personalized asset allocation recommendations based on the user's risk profile, financial health score, and investment goals.

## Inputs
| File | Source |
|------|--------|
| `features_dataset.csv` | `analytics/data/exports/features/` |
| `risk_profile_predictions.csv` | `analytics/data/exports/risk_profile/` |
| `health_score_dataset.csv` | `analytics/data/exports/health_score/` |

## Outputs
| File | Destination |
|------|-------------|
| `portfolio_recommendation_dataset.csv` | `analytics/data/exports/portfolio/` |

## Generated Artifacts
- Portfolio allocation recommendations per risk tier
- Asset class distribution matrices
- Expected return vs. risk visualizations
