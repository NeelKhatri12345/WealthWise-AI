# ML Pipelines

Automated pipeline scripts for data processing, model training, and evaluation.

## Scripts

- `data_pipeline.py` - Data ingestion, cleaning, and feature engineering
- `training_pipeline.py` - Model training with configurable hyperparameters
- `evaluation_pipeline.py` - Model evaluation, metrics, and reporting

## Usage

```bash
# Run the data pipeline
python -m pipelines.data_pipeline --config configs/data_config.yaml

# Train models
python -m pipelines.training_pipeline --config configs/model_config.yaml

# Evaluate models
python -m pipelines.evaluation_pipeline --model risk_profile
```

## Configuration

Pipeline settings are defined in `analytics/configs/`:
- `data_config.yaml` - Data paths and processing parameters
- `model_config.yaml` - Model hyperparameters and training settings
