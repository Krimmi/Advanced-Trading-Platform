import * as tf from '@tensorflow/tfjs';
import { TimeSeriesModel, TimeSeriesModelConfig } from './TimeSeriesModel';

/**
 * LSTM-based model for time series forecasting
 */
export class LSTMTimeSeriesModel extends TimeSeriesModel {
  private lstmLayers: number[];
  private denseLayers: number[];
  private dropout: number;

  /**
   * Constructor for LSTMTimeSeriesModel
   * @param config Model configuration
   * @param lstmLayers Array of LSTM layer sizes
   * @param denseLayers Array of dense layer sizes
   * @param dropout Dropout rate
   */
  constructor(
    config: TimeSeriesModelConfig,
    lstmLayers: number[] = [128, 64],
    denseLayers: number[] = [32],
    dropout: number = 0.2
  ) {
    super(config);
    this.lstmLayers = lstmLayers;
    this.denseLayers = denseLayers;
    this.dropout = dropout;
  }

  /**
   * Build the LSTM model architecture
   * @returns TensorFlow.js model
   */
  buildModel(): tf.LayersModel {
    const model = tf.sequential();

    // Add first LSTM layer with input shape
    model.add(tf.layers.lstm({
      units: this.lstmLayers[0],
      returnSequences: this.lstmLayers.length > 1,
      inputShape: [this.config.lookbackWindow, this.config.inputFeatures],
      activation: 'tanh',
      recurrentActivation: 'sigmoid',
      recurrentDropout: this.dropout / 2
    }));

    model.add(tf.layers.dropout({ rate: this.dropout }));

    // Add remaining LSTM layers
    for (let i = 1; i < this.lstmLayers.length; i++) {
      model.add(tf.layers.lstm({
        units: this.lstmLayers[i],
        returnSequences: i < this.lstmLayers.length - 1,
        activation: 'tanh',
        recurrentActivation: 'sigmoid',
        recurrentDropout: this.dropout / 2
      }));
      model.add(tf.layers.dropout({ rate: this.dropout }));
    }

    // Add dense layers
    for (const units of this.denseLayers) {
      model.add(tf.layers.dense({
        units,
        activation: 'relu'
      }));
      model.add(tf.layers.dropout({ rate: this.dropout / 2 }));
    }

    // Output layer
    model.add(tf.layers.dense({
      units: this.config.forecastHorizon * this.config.outputFeatures,
      activation: 'linear'
    }));

    // Reshape output to match expected dimensions
    model.add(tf.layers.reshape({
      targetShape: [this.config.forecastHorizon, this.config.outputFeatures]
    }));

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mse', 'mae']
    });

    return model;
  }

  /**
   * Get the LSTM layer configuration
   * @returns LSTM layer sizes
   */
  getLSTMLayers(): number[] {
    return this.lstmLayers;
  }

  /**
   * Get the dense layer configuration
   * @returns Dense layer sizes
   */
  getDenseLayers(): number[] {
    return this.denseLayers;
  }

  /**
   * Get the dropout rate
   * @returns Dropout rate
   */
  getDropout(): number {
    return this.dropout;
  }
}