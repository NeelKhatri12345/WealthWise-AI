# 04 — Financial Health Scoring

## Purpose
Computes a composite financial health score (0–100) for each user based on weighted factors: savings rate, debt-to-income ratio, expense volatility, and investment diversity.

## Inputs
| File | Source |
|------|--------|
| `features_dataset.csv` | `analytics/data/exports/features/` |

## Outputs
| File | Destination |
|------|-------------|
| `health_score_dataset.csv` | `analytics/data/exports/health_score/` |

## Generated Artifacts
- Health score dataset with per-factor breakdowns
- Score distribution analysis
- Factor contribution visualizations
