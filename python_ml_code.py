import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pickle

# 1. Dataset Generation (Realistic Synthetic)
def generate_data():
    date_rng = pd.date_range(start='2023-01-01', end='2024-12-31', freq='D')
    df = pd.DataFrame(date_rng, columns=['Date'])
    df['Store_ID'] = 1
    df['Product_ID'] = 101
    
    # Seasonality and Features
    df['Day'] = df['Date'].dt.day
    df['Month'] = df['Date'].dt.month
    df['Year'] = df['Date'].dt.year
    df['DayOfWeek'] = df['Date'].dt.dayofweek
    
    df['Promotion'] = np.random.choice([0, 1], size=len(df), p=[0.8, 0.2])
    df['Holiday'] = df['Month'].apply(lambda x: 1 if x in [12, 1, 7] else 0)
    df['Temperature'] = 20 + 15 * np.sin(2 * np.pi * (df.index / 365))
    df['Fuel_Price'] = 3.5 + 0.5 * np.sin(2 * np.pi * (df.index / 500))
    df['CPI'] = 250 + 0.05 * df.index
    df['Unemployment'] = 7.5 - 0.002 * df.index
    
    # Target Variable: Sales
    base_sales = 1000
    df['Sales'] = base_sales + (df['DayOfWeek'] > 4) * 300 + df['Promotion'] * 500 + df['Holiday'] * 800 + np.random.normal(0, 100, len(df))
    return df

# 2. Preprocessing
def preprocess_data(df):
    # Lag features
    df['Lag_1'] = df['Sales'].shift(1)
    df['Lag_7'] = df['Sales'].shift(7)
    df['Rolling_Mean_7'] = df['Sales'].rolling(window=7).mean()
    df.dropna(inplace=True)
    
    X = df[['Month', 'DayOfWeek', 'Promotion', 'Holiday', 'Temperature', 'Lag_1', 'Lag_7', 'Rolling_Mean_7']]
    y = df['Sales']
    return X, y

# 3. Model Training & Evaluation with Hyperparameter Tuning
def train_and_evaluate(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Define Hyperparameter grid for XGBoost
    xgb_param_grid = {
        'n_estimators': [100, 200, 300],
        'max_depth': [3, 5, 7],
        'learning_rate': [0.01, 0.05, 0.1],
        'subsample': [0.8, 1.0]
    }
    
    print("Starting Hyperparameter Tuning for XGBoost...")
    grid_search = GridSearchCV(
        estimator=XGBRegressor(objective='reg:squarederror', random_state=42),
        param_grid=xgb_param_grid,
        cv=3,
        scoring='neg_mean_absolute_error',
        verbose=1,
        n_jobs=-1
    )
    
    grid_search.fit(X_train, y_train)
    best_xgb = grid_search.best_estimator_
    print(f"Best Parameters found: {grid_search.best_params_}")

    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
        "XGBoost (Tuned)": best_xgb
    }
    
    results = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        results[name] = {
            "MAE": round(mean_absolute_error(y_test, preds), 2),
            "RMSE": round(np.sqrt(mean_squared_error(y_test, preds)), 2),
            "R2": round(r2_score(y_test, preds), 4)
        }
        
    return results, models

# Execute
if __name__ == "__main__":
    df = generate_data()
    X, y = preprocess_data(df)
    results, models = train_and_evaluate(X, y)
    
    print("\nModel Evaluation Results:")
    for model, metrics in results.items():
        print(f"{model}: {metrics}")

    # Save best tuned model
    model_filename = 'tuned_xgb_model.pkl'
    with open(model_filename, 'wb') as f:
        pickle.dump(models['XGBoost (Tuned)'], f)
    print(f"\nSaved tuned XGBoost model to {model_filename}")
