# Machine Learning Platform User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Model Management](#model-management)
5. [Making Predictions](#making-predictions)
6. [Feature Importance Analysis](#feature-importance-analysis)
7. [Performance Tracking](#performance-tracking)
8. [AutoML](#automl)
9. [User Preferences](#user-preferences)
10. [Troubleshooting](#troubleshooting)

## Introduction

Welcome to the Machine Learning Platform for the Hedge Fund Trading Application. This platform provides a comprehensive set of tools for managing machine learning models, making predictions, analyzing feature importance, tracking model performance, and automating model training.

### Key Features
- **Model Management**: Create, deploy, and manage ML models
- **Predictions**: Make predictions and visualize results
- **Feature Importance**: Understand which features drive your model's decisions
- **Performance Tracking**: Monitor and compare model performance
- **AutoML**: Automate model training and selection
- **Customization**: Personalize your experience with user preferences

## Getting Started

### Accessing the ML Platform
1. Log in to the Hedge Fund Trading Application
2. Navigate to the ML Platform using one of these methods:
   - Click on "ML Platform" in the main navigation menu
   - Select "ML Platform" from the dashboard quick links
   - Use the direct URL: `/ml-unified`

### Navigation
The ML Platform uses a sidebar navigation system with the following sections:
- **Dashboard**: Overview of ML activities and key metrics
- **Models**: Model management and lifecycle
- **Predictions**: Make and visualize predictions
- **Feature Importance**: Analyze feature contributions
- **Performance**: Track and compare model performance
- **AutoML**: Automated model training and optimization

### User Interface
The ML Platform supports both light and dark modes, as well as responsive design for different screen sizes. You can customize your experience through the Settings panel.

## Dashboard Overview

The Dashboard provides a high-level overview of your ML activities and key metrics.

### Key Components
1. **Model Statistics**: Count of models by status (deployed, training, failed)
2. **Prediction Activity**: Number of predictions made and accuracy metrics
3. **Performance Trends**: Model performance over time
4. **Recent Activity**: Latest ML-related activities
5. **Quick Actions**: Shortcuts to common tasks

### Using the Dashboard
- **View Model Details**: Click on any model card to view detailed information
- **Make Predictions**: Use the "Make Predictions" button to quickly start a prediction
- **Monitor Performance**: Track performance metrics across all models
- **Check Recent Activity**: Stay updated on recent ML activities

## Model Management

The Model Management section allows you to create, deploy, and manage ML models.

### Creating a New Model
1. Click the "New Model" button in the top-right corner
2. Fill in the required information:
   - **Name**: A descriptive name for your model
   - **Type**: Select the model type (Regression, Classification, etc.)
   - **Description**: Provide details about the model's purpose
3. Click "Create" to create the model

### Model Lifecycle
Models go through several stages in their lifecycle:
1. **Draft**: Initial creation stage
2. **Training**: Model is being trained on data
3. **Ready**: Model is trained and ready for deployment
4. **Deployed**: Model is actively serving predictions
5. **Failed**: Training or deployment failed
6. **Archived**: Model is no longer active

### Deploying a Model
1. Select a model from the list
2. Click the "Deploy" button
3. Confirm the deployment in the dialog
4. Wait for the deployment to complete

### Model Versions
Each model can have multiple versions:
1. Click on a model to view its details
2. Navigate to the "Versions" tab
3. View all versions of the model
4. Compare versions or deploy a specific version

### Model Details
The model details page shows comprehensive information about a model:
- **Overview**: Basic information and status
- **Metrics**: Performance metrics
- **Versions**: Version history
- **Features**: Feature importance
- **Predictions**: Recent predictions
- **Logs**: Model logs

## Making Predictions

The Predictions section allows you to make predictions using deployed models and visualize the results.

### Making a Single Prediction
1. Select a model from the dropdown
2. Enter input values for each required field
3. Configure prediction options:
   - **Return Probabilities**: Include class probabilities (for classification)
   - **Include Feature Contributions**: Show how each feature contributes
   - **Confidence Threshold**: Set minimum confidence level
4. Click "Run Prediction" to generate a prediction

### Viewing Prediction Results
The prediction results include:
- **Prediction Value**: The model's prediction
- **Confidence**: Confidence level (for classification)
- **Probabilities**: Class probabilities (for classification)
- **Feature Contributions**: How each feature contributed
- **Input Data**: The data used for the prediction

### Prediction History
View the history of predictions made with a model:
1. Navigate to the "History" tab
2. Filter by time range or search for specific predictions
3. View details of past predictions
4. Compare predicted vs. actual values

### Batch Predictions
For multiple predictions at once:
1. Set the batch size in the prediction options
2. Upload a CSV file with input data
3. Run the batch prediction
4. Download the results as a CSV file

## Feature Importance Analysis

The Feature Importance section helps you understand which features drive your model's decisions.

### Global Feature Importance
View the overall importance of features across all predictions:
1. Select a model to analyze
2. View the feature importance chart
3. Sort features by importance
4. Filter features by name or importance threshold

### Local Feature Explanations
Understand how features contribute to individual predictions:
1. Enter input data for a specific prediction
2. View the feature contributions chart
3. See how each feature positively or negatively impacts the prediction

### Feature Correlations
Analyze relationships between features:
1. Navigate to the "Feature Correlations" tab
2. View the correlation matrix
3. Identify strongly correlated features
4. Use this information to improve feature selection

### Partial Dependence Plots
Understand how a feature affects predictions across its range:
1. Select a feature to analyze
2. View the partial dependence plot
3. See how the prediction changes as the feature value changes

## Performance Tracking

The Performance section allows you to monitor and compare model performance.

### Performance Overview
View key performance metrics for a model:
1. Select a model to analyze
2. View performance metrics over time
3. Compare against target metrics
4. Identify performance trends

### Detailed Metrics
Analyze specific performance metrics:
1. Navigate to the "Detailed Metrics" tab
2. View metrics like accuracy, precision, recall, F1 score
3. Analyze error distributions
4. Identify areas for improvement

### Model Comparison
Compare performance across different models:
1. Navigate to the "Comparison" tab
2. Select models to compare
3. View side-by-side performance metrics
4. Identify the best-performing model

### Class Performance
For classification models, analyze performance by class:
1. View precision, recall, and F1 score for each class
2. Identify classes with poor performance
3. Use this information to improve class-specific performance

## AutoML

The AutoML section automates the process of training and selecting the best model.

### Starting an AutoML Process
1. Click "Start AutoML" to begin
2. Follow the step-by-step wizard:
   - **Dataset Selection**: Choose a dataset and target column
   - **Model Configuration**: Select model types and optimization metric
   - **Training Settings**: Set time limit and resource allocation
   - **Review & Run**: Review settings and start the process

### Dataset Selection
1. Choose a dataset from the available options
2. Select a target column to predict
3. Review dataset information and preview

### Model Configuration
1. Select model types to include (Regression, Classification, etc.)
2. Choose an optimization metric (Accuracy, F1 Score, etc.)
3. Configure validation strategy (Cross-validation, Train-test split, etc.)

### Training Settings
1. Set a time limit for the AutoML process
2. Specify the maximum number of models to train
3. Configure advanced settings like feature engineering and hyperparameter tuning

### Monitoring AutoML Progress
1. View the progress bar and status updates
2. See which models are being trained
3. Monitor intermediate results

### Reviewing AutoML Results
1. View the leaderboard of trained models
2. Compare performance metrics across models
3. Analyze the best model's details
4. Deploy the selected model

## User Preferences

Customize your ML Platform experience through user preferences.

### Accessing Settings
1. Click the gear icon in the top-right corner
2. Or click "Settings" in the sidebar

### Appearance Settings
1. **Dark Mode**: Toggle between light and dark themes
2. **Compact View**: Use a more compact layout for dense information
3. **Sidebar**: Choose to keep the sidebar open or collapsed

### Data Display Settings
1. **Default View**: Set your preferred default tab
2. **Data Format**: Choose table, card, or chart view for data
3. **Chart Theme**: Select your preferred chart color scheme

### Refresh Settings
1. **Auto Refresh**: Enable automatic data refreshing
2. **Refresh Interval**: Set how often data should refresh

### Saving Preferences
1. Make your desired changes
2. Click "Save" to apply and persist your preferences
3. Preferences will be remembered across sessions

## Troubleshooting

### Common Issues and Solutions

#### Model Training Failures
- **Issue**: Model training fails to complete
- **Solution**: Check the model logs for specific error messages. Common causes include insufficient data, invalid parameters, or resource constraints.

#### Prediction Errors
- **Issue**: Unable to make predictions
- **Solution**: Ensure the model is deployed and that input data matches the expected format. Check for missing required fields.

#### Performance Discrepancies
- **Issue**: Model performs differently in production vs. training
- **Solution**: Check for data drift, ensure production data matches training data distribution, and monitor for concept drift over time.

#### AutoML Timeouts
- **Issue**: AutoML process times out before completion
- **Solution**: Increase the time limit, reduce the scope (fewer model types), or use a smaller dataset for initial exploration.

### Getting Help
- Click the "Help" button in the sidebar for context-specific guidance
- Refer to this user guide for detailed instructions
- Contact support for technical assistance

### Feedback and Suggestions
We're constantly improving the ML Platform. To provide feedback:
1. Click the "Feedback" button in the footer
2. Fill out the feedback form
3. Submit your suggestions or report issues

---

Thank you for using the Machine Learning Platform. This guide will be updated as new features are added.