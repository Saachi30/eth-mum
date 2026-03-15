import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["*"],
        "allow_headers": ["*"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "X-CSRFToken"],
        "max_age": 3600
    }
})

class ModelManager:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_initialized = False
        self.initialize()
    
    def create_sample_data(self):
        """Create synthetic data for model training"""
        np.random.seed(42)
        n_samples = 1000
        
        return pd.DataFrame({
            'Energy_Produced_kWh': np.random.uniform(10, 1000, n_samples),
            'Energy_Sold_kWh': np.random.uniform(10, 1000, n_samples),
            'Price_per_kWh': np.random.uniform(0.05, 0.5, n_samples),
            'Total_Amount': np.random.uniform(100, 10000, n_samples),
            'Energy_Consumption_Deviation': np.random.uniform(-20, 20, n_samples),
            'Producer_Type': np.random.choice(['solar', 'wind', 'hydro'], n_samples),
            'Grid_Connection_Type': np.random.choice(['direct', 'indirect'], n_samples),
            'Location_Type': np.random.choice(['urban', 'rural'], n_samples),
            'Weather_Conditions': np.random.choice(['normal', 'extreme'], n_samples),
            'fraud': np.random.choice([0, 1], n_samples, p=[0.9, 0.1])
        })

    def train_model(self):
        """Train new model and scaler"""
        logger.info("Training new model...")
        
        # Create and prepare training data
        df = self.create_sample_data()
        
        # Initialize and fit scaler
        self.scaler = StandardScaler()
        numerical_cols = [
            'Energy_Produced_kWh', 
            'Energy_Sold_kWh',
            'Price_per_kWh', 
            'Total_Amount', 
            'Energy_Consumption_Deviation'
        ]
        
        # Fit scaler on numerical columns
        self.scaler.fit(df[numerical_cols])
        
        # Prepare features for training
        X = pd.DataFrame(self.scaler.transform(df[numerical_cols]), columns=numerical_cols)
        X = pd.concat([
            X,
            pd.get_dummies(df['Producer_Type']),
            pd.get_dummies(df['Grid_Connection_Type']),
            pd.get_dummies(df['Location_Type']),
            pd.get_dummies(df['Weather_Conditions'])
        ], axis=1)
        
        # Initialize and train model
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=20,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42
        )
        
        self.model.fit(X, df['fraud'])
        logger.info("Model training completed")
        
        # Save model and scaler
        self.save_model()
    
    def save_model(self):
        """Save model and scaler to disk"""
        try:
            joblib.dump(self.model, 'model.pkl')
            joblib.dump(self.scaler, 'scaler.pkl')
            logger.info("Model and scaler saved successfully")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
    
    def load_model(self):
        """Load model and scaler from disk"""
        try:
            self.model = joblib.load('model.pkl')
            self.scaler = joblib.load('scaler.pkl')
            logger.info("Model and scaler loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False
    
    def initialize(self):
        """Initialize model and scaler"""
    if not self.is_initialized:
        try:
            if not self.load_model():
                self.train_model()
            
            # Verify scaler and model are properly loaded
            if self.scaler is None or self.model is None:
                logger.error("Failed to initialize model or scaler")
                self.train_model()
                
            self.is_initialized = True
        except Exception as e:
            logger.error(f"Error during initialization: {str(e)}")
            self.train_model()
            self.is_initialized = True
    
    def preprocess_data(self, data):
        """Preprocess input data"""
        if not self.is_initialized:
            self.initialize()
        
        numerical_cols = [
            'Energy_Produced_kWh', 
            'Energy_Sold_kWh',
            'Price_per_kWh', 
            'Total_Amount', 
            'Energy_Consumption_Deviation'
        ]
        
        if isinstance(data, dict):
            data = pd.DataFrame([data])
        
        # Scale numerical features
        scaled_numerical = pd.DataFrame(
            self.scaler.transform(data[numerical_cols]),
            columns=numerical_cols
        )
        
        # Create dummy variables
        categorical_data = pd.concat([
            pd.get_dummies(data['Producer_Type']),
            pd.get_dummies(data['Grid_Connection_Type']),
            pd.get_dummies(data['Location_Type']),
            pd.get_dummies(data['Weather_Conditions'])
        ], axis=1)
        
        return pd.concat([scaled_numerical, categorical_data], axis=1)
    
    def predict(self, data):
        """Make predictions using the model"""
        if not self.is_initialized:
            self.initialize()
        
        processed_data = self.preprocess_data(data)
        prediction = self.model.predict(processed_data)[0]
        probability = self.model.predict_proba(processed_data)[0][1]
        
        return prediction, probability

# Initialize model manager
model_manager = ModelManager()

@app.route('/predict_fraud', methods=['POST'])
def predict_fraud():
    try:
        input_data = request.get_json()
        logger.info(f"Received prediction request: {input_data}")
        
        # Validate required fields
        required_fields = [
            'Energy_Produced_kWh', 
            'Energy_Sold_kWh',
            'Price_per_kWh', 
            'Total_Amount', 
            'Energy_Consumption_Deviation',
            'Producer_Type',
            'Grid_Connection_Type',
            'Location_Type',
            'Weather_Conditions'
        ]
        
        for field in required_fields:
            if field not in input_data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Make prediction
        prediction, probability = model_manager.predict(input_data)
        
        response = {
            'fraud_prediction': bool(prediction),
            'fraud_probability': float(probability),
            'threshold': 0.5,
            'input_data': input_data
        }
        
        logger.info(f"Prediction response: {response}")
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error in predict_fraud: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    if not model_manager.is_initialized:
        return jsonify({
            'error': 'Model not initialized'
        }), 500
        
    return jsonify({
        'model_type': 'Random Forest Classifier',
        'features': [
            'Energy_Produced_kWh', 
            'Energy_Sold_kWh',
            'Price_per_kWh', 
            'Total_Amount', 
            'Energy_Consumption_Deviation',
            'Producer_Type',
            'Grid_Connection_Type',
            'Location_Type',
            'Weather_Conditions'
        ],
        'parameters': {
            'n_estimators': model_manager.model.n_estimators,
            'max_depth': model_manager.model.max_depth,
            'min_samples_split': model_manager.model.min_samples_split,
            'min_samples_leaf': model_manager.model.min_samples_leaf
        }
    })

if __name__ == '__main__':
    app.run(debug=True)