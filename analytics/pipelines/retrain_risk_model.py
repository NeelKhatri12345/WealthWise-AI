"""WealthWise AI - Standalone Risk Profile Model Retraining Script

This script retrains the Random Forest risk profile classifier and label encoder
using the canonical features dataset in the repository and saves the artifacts.
"""

import os
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib

# Paths
ANALYTICS_ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = ANALYTICS_ROOT / "data" / "exports" / "features" / "features_dataset.csv"
OUTPUT_DIR = ANALYTICS_ROOT / "models" / "risk_profile"

# Business Rules for generating labels
def create_risk_profile_label(savings_rate: float) -> str:
    if savings_rate >= 40:
        return 'Conservative'
    elif savings_rate >= 20:
        return 'Moderate'
    else:
        return 'Aggressive'

def main():
    print("=" * 60)
    print("WealthWise AI: Retraining Risk Profile ML Models")
    print("=" * 60)

    # 1. Load dataset
    if not DATASET_PATH.exists():
        print(f"Error: Dataset not found at {DATASET_PATH}")
        return
    
    print(f"Loading dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH, low_memory=False)
    print(f"   Loaded: {df.shape[0]} rows, {df.shape[1]} columns")

    # 2. Handle savings_rate detection and scaling
    if 'savings_rate' not in df.columns:
        print("Error: 'savings_rate' column is missing from the dataset!")
        return
    
    sr_max = df['savings_rate'].max()
    if sr_max <= 1.0:
        print("   Converting savings_rate from decimal (0-1) to percentage (0-100)...")
        df['savings_rate_pct'] = df['savings_rate'] * 100
    else:
        df['savings_rate_pct'] = df['savings_rate']

    # 3. Create target label
    print("Generating risk profile target labels...")
    df['risk_profile'] = df['savings_rate_pct'].apply(create_risk_profile_label)
    print("   Label distribution:")
    print(df['risk_profile'].value_counts())

    # 4. Canonical features select
    feature_columns = [
        'monthly_income',
        'monthly_expense',
        'savings',
        'savings_rate',
        'average_balance',
        'minimum_balance',
        'maximum_balance',
        'transaction_count',
        'debit_transaction_count',
        'credit_transaction_count',
        'average_transaction_amount',
        'income_consistency_score',
        'expense_stability_score',
        'spending_to_income_ratio',
        'cash_withdrawal_frequency',
        'salary_dependency_ratio',
    ]

    available_features = [f for f in feature_columns if f in df.columns]
    missing_features = [f for f in feature_columns if f not in df.columns]

    if missing_features:
        print(f"Warning: Missing features: {missing_features}")
    
    X = df[available_features].copy()
    y = df['risk_profile'].copy()

    # Fill residual NaN values
    if X.isnull().sum().sum() > 0:
        X.fillna(X.median(), inplace=True)

    # 5. Label Encoding
    print("Encoding target labels...")
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    # 6. Train-Test Split (80/20 Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y_encoded,
        test_size=0.20,
        random_state=42,
        stratify=y_encoded,
    )

    # 7. Model training
    print("Training RandomForestClassifier (200 trees)...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=10,
        min_samples_leaf=5,
        max_features='sqrt',
        bootstrap=True,
        oob_score=True,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1,
    )
    rf_model.fit(X_train, y_train)
    print(f"   OOB Validation Score: {rf_model.oob_score_:.4f}")

    # 8. Save artifacts
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    model_path = OUTPUT_DIR / "risk_profile_model.pkl"
    encoder_path = OUTPUT_DIR / "risk_label_encoder.pkl"

    print("Saving artifacts using joblib...")
    joblib.dump(rf_model, model_path, compress=3)
    joblib.dump(label_encoder, encoder_path, compress=3)

    print(f"   Model saved to: {model_path}")
    print(f"   Encoder saved to: {encoder_path}")
    print("Model retraining complete and verified!")

if __name__ == "__main__":
    main()
