"""
ML Training Script for Duration Prediction
Trains a Random Forest model on historical project data.
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os
from pathlib import Path


def load_historical_data(filepath: str = None) -> pd.DataFrame:
    """
    Load historical project data.
    If no file exists, generate synthetic training data.
    
    Args:
        filepath: Path to CSV file with historical data
        
    Returns:
        DataFrame with training data
    """
    if filepath and os.path.exists(filepath):
        return pd.read_csv(filepath)
    
    # Generate synthetic training data
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'task_type': np.random.choice(['dev', 'test', 'deploy', 'design'], n_samples),
        'complexity': np.random.randint(1, 10, n_samples),
        'team_size': np.random.randint(1, 5, n_samples),
        'resource_cpu': np.random.uniform(0.5, 4.0, n_samples),
        'resource_person': np.random.uniform(0.5, 4.0, n_samples),
        'has_dependencies': np.random.choice([0, 1], n_samples),
        'estimated_duration': np.random.uniform(10, 200, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Create realistic actual duration with some noise
    df['actual_duration'] = (
        df['estimated_duration'] * 
        (1 + 0.1 * df['complexity']) * 
        (1 + 0.05 * df['team_size']) *
        (1 + np.random.normal(0, 0.2, n_samples))
    ).clip(lower=5)
    
    return df


def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract and encode features for training.
    
    Args:
        df: Raw data DataFrame
        
    Returns:
        DataFrame with encoded features
    """
    # One-hot encode task_type
    df_encoded = pd.get_dummies(df, columns=['task_type'], prefix='type')
    
    # Select feature columns
    feature_cols = [col for col in df_encoded.columns 
                    if col not in ['actual_duration']]
    
    return df_encoded[feature_cols]


def train_model(data: pd.DataFrame = None, save_path: str = None) -> RandomForestRegressor:
    """
    Train Random Forest model for duration prediction.
    
    Args:
        data: Training data DataFrame (if None, loads/generates data)
        save_path: Path to save the trained model
        
    Returns:
        Trained RandomForestRegressor
    """
    # Load data
    if data is None:
        data = load_historical_data()
    
    # Prepare features and target
    X = extract_features(data.drop('actual_duration', axis=1))
    y = data['actual_duration']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Train model
    print("Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Performance:")
    print(f"  MAE: {mae:.2f} minutes")
    print(f"  R²: {r2:.3f}")
    
    # Save model
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        joblib.dump({
            'model': model,
            'feature_names': list(X.columns)
        }, save_path)
        print(f"Model saved to {save_path}")
    
    return model


def main():
    """Main training entry point."""
    # Default paths
    data_path = "ml-data/raw/history.csv"
    model_path = "ml-data/models/duration_predictor.pkl"
    
    # Check for data file
    if os.path.exists(data_path):
        print(f"Loading data from {data_path}")
        data = pd.read_csv(data_path)
    else:
        print("No historical data found, generating synthetic data...")
        data = None
    
    # Train and save
    train_model(data, save_path=model_path)


if __name__ == "__main__":
    main()
