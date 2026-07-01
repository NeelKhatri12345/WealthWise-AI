# 01 — Data Preparation

## Purpose
Cleans and validates raw financial data (bank statements, transaction records) — handles missing values, deduplication, type coercion, and date normalization to produce a clean dataset ready for feature engineering.

## Inputs
| File | Source |
|------|--------|
| Raw bank statements / CSVs | `analytics/data/raw/` |

## Outputs
| File | Destination |
|------|-------------|
| Cleaned transaction data | `analytics/data/cleaned/` |

## Generated Artifacts
- Cleaned and validated transaction dataset
- Data quality reports (null counts, duplicate rates, type mismatches)
- Exploratory data analysis visualizations
