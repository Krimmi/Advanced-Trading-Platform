/**
 * Strategy Parameters Type Definitions
 * 
 * These types define the structure of parameters used to configure trading strategies.
 */

export interface BaseStrategyParam {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object' | 'enum';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface NumberParam extends BaseStrategyParam {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface StringParam extends BaseStrategyParam {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  defaultValue?: string;
}

export interface BooleanParam extends BaseStrategyParam {
  type: 'boolean';
  defaultValue?: boolean;
}

export interface ArrayParam extends BaseStrategyParam {
  type: 'array';
  itemType: 'number' | 'string' | 'boolean' | 'object';
  minItems?: number;
  maxItems?: number;
  defaultValue?: any[];
}

export interface EnumParam extends BaseStrategyParam {
  type: 'enum';
  options: string[] | number[];
  defaultValue?: string | number;
}

export interface ObjectParam extends BaseStrategyParam {
  type: 'object';
  properties: {
    [key: string]: BaseStrategyParam;
  };
  defaultValue?: object;
}

export type StrategyParamDefinition = 
  | NumberParam 
  | StringParam 
  | BooleanParam 
  | ArrayParam 
  | EnumParam 
  | ObjectParam;

export interface StrategyParams {
  [key: string]: any;
  
  // Common parameters that most strategies will use
  symbols?: string[];
  timeframe?: '1min' | '5min' | '15min' | '30min' | '1hour' | '1day' | '1week' | '1month';
  riskPercentPerTrade?: number;
  maxPositions?: number;
  maxRiskPercentTotal?: number;
}

export interface StrategyParamMetadata {
  [key: string]: StrategyParamDefinition;
}