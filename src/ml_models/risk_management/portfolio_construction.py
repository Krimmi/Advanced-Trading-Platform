"""
Portfolio construction module.
This module provides classes and functions for portfolio construction.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union, Callable
import logging
import sys
import os
import datetime

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
from src.ml_models.risk_management.risk_metrics import RiskMetrics
from src.ml_models.risk_management.portfolio_optimization import PortfolioOptimizer
from src.ml_models.risk_management.stress_testing import StressTester
from src.ml_models.risk_management.transaction_costs import (
    TransactionCostModel, FixedRateModel, VariableRateModel, 
    MarketImpactModel, ComprehensiveModel, create_transaction_cost_model
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("portfolio_construction")

class PortfolioConstructor:
    """
    Class for portfolio construction.
    """
    def __init__(self, returns_data: pd.DataFrame, risk_free_rate: float = 0.0):
        """
        Initialize the portfolio constructor.
        
        Args:
            returns_data: DataFrame of asset returns with DatetimeIndex
            risk_free_rate: Annualized risk-free rate (default: 0.0)
        """
        self.returns = returns_data
        self.risk_free_rate = risk_free_rate
        self.assets = list(returns_data.columns)
        self.num_assets = len(self.assets)
        
        # Create risk metrics calculator
        self.risk_metrics = RiskMetrics(returns_data, risk_free_rate)
        
        # Create portfolio optimizer
        self.optimizer = PortfolioOptimizer(returns_data, risk_free_rate)
        
        self.logger = logger
    
    def construct_portfolio(self, 
                           strategy: str = 'maximum_sharpe',
                           constraints: Dict[str, Any] = None,
                           target_return: Optional[float] = None,
                           target_volatility: Optional[float] = None,
                           target_risk_contribution: Optional[Dict[str, float]] = None,
                           factor_views: Optional[Dict[str, float]] = None,
                           factor_confidences: Optional[Dict[str, float]] = None,
                           run_stress_test: bool = True) -> Dict[str, Any]:
        """
        Construct a portfolio using the specified strategy and constraints.
        
        Args:
            strategy: Portfolio construction strategy
            constraints: Dictionary of constraints
            target_return: Target portfolio return (for minimum volatility with target return)
            target_volatility: Target portfolio volatility (for maximum return with target volatility)
            target_risk_contribution: Dictionary of target risk contributions (for risk parity)
            factor_views: Dictionary of views on factors (for Black-Litterman)
            factor_confidences: Dictionary of confidence levels for factor views (for Black-Litterman)
            run_stress_test: Whether to run stress tests on the constructed portfolio
            
        Returns:
            Dictionary containing portfolio weights and analysis
        """
        # Process constraints
        bounds = (0, 1)  # Default bounds (long-only)
        opt_constraints = []
        
        if constraints:
            # Process bounds
            if 'bounds' in constraints:
                bounds = constraints['bounds']
            
            # Process weight constraints
            if 'weight_constraints' in constraints:
                for asset, (min_weight, max_weight) in constraints['weight_constraints'].items():
                    if asset in self.assets:
                        asset_idx = self.assets.index(asset)
                        
                        # Minimum weight constraint
                        if min_weight is not None:
                            min_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, idx=asset_idx, min_w=min_weight: weights[idx] - min_w
                            }
                            opt_constraints.append(min_constraint)
                        
                        # Maximum weight constraint
                        if max_weight is not None:
                            max_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, idx=asset_idx, max_w=max_weight: max_w - weights[idx]
                            }
                            opt_constraints.append(max_constraint)
            
            # Process group constraints
            if 'group_constraints' in constraints:
                for group_name, group_info in constraints['group_constraints'].items():
                    group_assets = group_info['assets']
                    min_weight = group_info.get('min_weight')
                    max_weight = group_info.get('max_weight')
                    
                    # Get indices of assets in the group
                    group_indices = [self.assets.index(asset) for asset in group_assets if asset in self.assets]
                    
                    if group_indices:
                        # Minimum group weight constraint
                        if min_weight is not None:
                            min_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, indices=group_indices, min_w=min_weight: sum(weights[i] for i in indices) - min_w
                            }
                            opt_constraints.append(min_constraint)
                        
                        # Maximum group weight constraint
                        if max_weight is not None:
                            max_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, indices=group_indices, max_w=max_weight: max_w - sum(weights[i] for i in indices)
                            }
                            opt_constraints.append(max_constraint)
        
        # Construct portfolio based on strategy
        if strategy == 'maximum_sharpe':
            result = self.optimizer.optimize_sharpe_ratio(bounds, opt_constraints)
        
        elif strategy == 'minimum_volatility':
            if target_return is not None:
                # Add target return constraint
                return_constraint = {
                    'type': 'eq',
                    'fun': lambda weights: self.risk_metrics.calculate_portfolio_return(weights) - target_return
                }
                opt_constraints.append(return_constraint)
            
            result = self.optimizer.optimize_minimum_volatility(bounds, opt_constraints)
        
        elif strategy == 'maximum_return':
            if target_volatility is not None:
                result = self.optimizer.optimize_maximum_return(target_volatility, bounds, opt_constraints)
            else:
                result = self.optimizer.optimize_maximum_return(bounds=bounds, constraints=opt_constraints)
        
        elif strategy == 'risk_parity':
            if target_risk_contribution:
                # Convert target risk contribution to array
                risk_budget = np.zeros(self.num_assets)
                for asset, contribution in target_risk_contribution.items():
                    if asset in self.assets:
                        asset_idx = self.assets.index(asset)
                        risk_budget[asset_idx] = contribution
            else:
                risk_budget = None
            
            result = self.optimizer.optimize_risk_parity(risk_budget, bounds)
        
        elif strategy == 'maximum_diversification':
            result = self.optimizer.optimize_maximum_diversification(bounds, opt_constraints)
        
        elif strategy == 'minimum_cvar':
            result = self.optimizer.optimize_minimum_cvar(bounds=bounds, constraints=opt_constraints)
        
        elif strategy == 'hierarchical_risk_parity':
            result = self.optimizer.optimize_hierarchical_risk_parity()
        
        elif strategy == 'black_litterman':
            if not factor_views or not factor_confidences:
                raise ValueError("factor_views and factor_confidences are required for Black-Litterman model")
            
            # Use equal weights as market weights if not provided
            market_weights = np.ones(self.num_assets) / self.num_assets
            
            result = self.optimizer.optimize_black_litterman(
                market_weights,
                factor_views,
                factor_confidences,
                bounds=bounds,
                constraints=opt_constraints
            )
        
        elif strategy == 'equal_weight':
            result = self.optimizer.optimize_equal_weight()
        
        elif strategy == 'inverse_volatility':
            result = self.optimizer.optimize_inverse_volatility()
        
        else:
            raise ValueError(f"Unknown strategy: {strategy}")
        
        # Run stress tests if requested
        if run_stress_test:
            stress_tester = StressTester(self.returns, result['weights'])
            stress_test_results = stress_tester.run_comprehensive_stress_test()
            result['stress_test'] = stress_test_results
        
        # Add strategy and constraints to result
        result['strategy'] = strategy
        result['constraints'] = constraints
        
        # Add timestamp
        result['timestamp'] = datetime.datetime.now().isoformat()
        
        return result
    
    def rebalance_portfolio(self,
                           current_weights: pd.Series,
                           strategy: str = 'maximum_sharpe',
                           constraints: Dict[str, Any] = None,
                           target_return: Optional[float] = None,
                           target_volatility: Optional[float] = None,
                           target_risk_contribution: Optional[Dict[str, float]] = None,
                           factor_views: Optional[Dict[str, float]] = None,
                           factor_confidences: Optional[Dict[str, float]] = None,
                           transaction_costs: Optional[Dict[str, float]] = None,
                           max_turnover: Optional[float] = None,
                           transaction_cost_model: Optional[str] = 'fixed',
                           market_impact_factor: Optional[float] = 0.1) -> Dict[str, Any]:
        """
        Rebalance an existing portfolio.
        
        Args:
            current_weights: Series of current portfolio weights
            strategy: Portfolio construction strategy
            constraints: Dictionary of constraints
            target_return: Target portfolio return (for minimum volatility with target return)
            target_volatility: Target portfolio volatility (for maximum return with target volatility)
            target_risk_contribution: Dictionary of target risk contributions (for risk parity)
            factor_views: Dictionary of views on factors (for Black-Litterman)
            factor_confidences: Dictionary of confidence levels for factor views (for Black-Litterman)
            transaction_costs: Dictionary of transaction costs for each asset
            max_turnover: Maximum allowed portfolio turnover
            transaction_cost_model: Type of transaction cost model to use ('fixed', 'variable', 'market_impact', 'comprehensive')
            market_impact_factor: Factor for market impact calculation (used in 'market_impact' and 'comprehensive' models)
            
        Returns:
            Dictionary containing rebalanced portfolio weights and analysis
        """
        # Ensure current weights are aligned with returns data
        current_weights = current_weights.reindex(self.assets).fillna(0)
        
        # Process constraints
        bounds = (0, 1)  # Default bounds (long-only)
        opt_constraints = []
        
        if constraints:
            # Process bounds
            if 'bounds' in constraints:
                bounds = constraints['bounds']
            
            # Process weight constraints
            if 'weight_constraints' in constraints:
                for asset, (min_weight, max_weight) in constraints['weight_constraints'].items():
                    if asset in self.assets:
                        asset_idx = self.assets.index(asset)
                        
                        # Minimum weight constraint
                        if min_weight is not None:
                            min_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, idx=asset_idx, min_w=min_weight: weights[idx] - min_w
                            }
                            opt_constraints.append(min_constraint)
                        
                        # Maximum weight constraint
                        if max_weight is not None:
                            max_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, idx=asset_idx, max_w=max_weight: max_w - weights[idx]
                            }
                            opt_constraints.append(max_constraint)
            
            # Process group constraints
            if 'group_constraints' in constraints:
                for group_name, group_info in constraints['group_constraints'].items():
                    group_assets = group_info['assets']
                    min_weight = group_info.get('min_weight')
                    max_weight = group_info.get('max_weight')
                    
                    # Get indices of assets in the group
                    group_indices = [self.assets.index(asset) for asset in group_assets if asset in self.assets]
                    
                    if group_indices:
                        # Minimum group weight constraint
                        if min_weight is not None:
                            min_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, indices=group_indices, min_w=min_weight: sum(weights[i] for i in indices) - min_w
                            }
                            opt_constraints.append(min_constraint)
                        
                        # Maximum group weight constraint
                        if max_weight is not None:
                            max_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, indices=group_indices, max_w=max_weight: max_w - sum(weights[i] for i in indices)
                            }
                            opt_constraints.append(max_constraint)
        
        # Add turnover constraint if specified
        if max_turnover is not None:
            turnover_constraint = {
                'type': 'ineq',
                'fun': lambda weights: max_turnover - np.sum(np.abs(weights - current_weights.values))
            }
            opt_constraints.append(turnover_constraint)
        
        # Construct target portfolio
        target_portfolio = self.construct_portfolio(
            strategy=strategy,
            constraints=constraints,
            target_return=target_return,
            target_volatility=target_volatility,
            target_risk_contribution=target_risk_contribution,
            factor_views=factor_views,
            factor_confidences=factor_confidences,
            run_stress_test=False
        )
        
        # Calculate trades
        target_weights = target_portfolio['weights']
        trades = target_weights - current_weights
        
        # Calculate turnover
        turnover = np.sum(np.abs(trades))
        
        # Calculate transaction costs using the specified model
        # Create prices series (in a real implementation, this would use actual prices)
        prices = pd.Series(1.0, index=self.assets)
        
        # Create transaction cost model
        if transaction_cost_model == 'fixed':
            # Use fixed rate model
            if transaction_costs:
                default_rate = transaction_costs.get('default', 0.001)
                cost_model = FixedRateModel(rate=default_rate)
            else:
                cost_model = FixedRateModel(rate=0.001)  # Default 0.1% cost
                
        elif transaction_cost_model == 'variable':
            # Use variable rate model
            if transaction_costs:
                cost_model = VariableRateModel(rates=transaction_costs, default_rate=0.001)
            else:
                cost_model = VariableRateModel(rates={}, default_rate=0.001)
                
        elif transaction_cost_model == 'market_impact':
            # Use market impact model
            cost_model = MarketImpactModel(impact_factor=market_impact_factor, fixed_rate=0.0005)
            
        elif transaction_cost_model == 'comprehensive':
            # Use comprehensive model
            if transaction_costs:
                cost_model = ComprehensiveModel(
                    fixed_rate=0.0005,
                    asset_rates=transaction_costs,
                    impact_factor=market_impact_factor,
                    spread_factor=0.0001
                )
            else:
                cost_model = ComprehensiveModel(
                    fixed_rate=0.0005,
                    impact_factor=market_impact_factor,
                    spread_factor=0.0001
                )
        else:
            # Default to fixed rate model
            cost_model = FixedRateModel(rate=0.001)
        
        # Estimate transaction costs
        trade_costs = cost_model.estimate_costs(trades, prices)
        total_cost = trade_costs.sum()
        
        # Create rebalance result
        rebalance_result = {
            'current_weights': current_weights,
            'target_weights': target_weights,
            'trades': trades,
            'turnover': turnover,
            'trade_costs': trade_costs,
            'total_cost': total_cost,
            'strategy': strategy,
            'constraints': constraints,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        # Add metrics from target portfolio
        rebalance_result['expected_return'] = target_portfolio['expected_return']
        rebalance_result['volatility'] = target_portfolio['volatility']
        rebalance_result['sharpe_ratio'] = target_portfolio['sharpe_ratio']
        
        # Add additional metrics if available
        for key in ['metrics', 'risk_contribution', 'diversification_ratio']:
            if key in target_portfolio:
                rebalance_result[key] = target_portfolio[key]
        
        return rebalance_result
    
    def construct_multi_strategy_portfolio(self,
                                         strategies: List[str],
                                         weights: List[float],
                                         constraints: Optional[Dict[str, Any]] = None,
                                         run_stress_test: bool = True) -> Dict[str, Any]:
        """
        Construct a portfolio using multiple strategies.
        
        Args:
            strategies: List of portfolio construction strategies
            weights: List of weights for each strategy
            constraints: Dictionary of constraints
            run_stress_test: Whether to run stress tests on the constructed portfolio
            
        Returns:
            Dictionary containing portfolio weights and analysis
        """
        if len(strategies) != len(weights):
            raise ValueError("Number of strategies must match number of weights")
        
        if abs(sum(weights) - 1.0) > 1e-6:
            raise ValueError("Strategy weights must sum to 1.0")
        
        # Construct portfolio for each strategy
        strategy_portfolios = []
        for strategy in strategies:
            portfolio = self.construct_portfolio(
                strategy=strategy,
                constraints=constraints,
                run_stress_test=False
            )
            strategy_portfolios.append(portfolio)
        
        # Combine portfolios
        combined_weights = pd.Series(0.0, index=self.assets)
        for portfolio, weight in zip(strategy_portfolios, weights):
            combined_weights += portfolio['weights'] * weight
        
        # Calculate metrics for combined portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(combined_weights.values)
        
        # Create result
        result = {
            'weights': combined_weights,
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'metrics': metrics,
            'strategy': 'multi_strategy',
            'sub_strategies': strategies,
            'strategy_weights': weights,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        # Run stress tests if requested
        if run_stress_test:
            stress_tester = StressTester(self.returns, combined_weights)
            stress_test_results = stress_tester.run_comprehensive_stress_test()
            result['stress_test'] = stress_test_results
        
        return result
    
    def optimize_strategy_weights(self,
                                strategies: List[str],
                                objective: str = 'sharpe_ratio',
                                constraints: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Optimize the weights of multiple strategies.
        
        Args:
            strategies: List of portfolio construction strategies
            objective: Objective function ('sharpe_ratio', 'return', 'volatility', 'diversification')
            constraints: Dictionary of constraints
            
        Returns:
            Dictionary containing optimized strategy weights and analysis
        """
        import scipy.optimize as optimize
        
        # Construct portfolio for each strategy
        strategy_portfolios = []
        for strategy in strategies:
            portfolio = self.construct_portfolio(
                strategy=strategy,
                constraints=constraints,
                run_stress_test=False
            )
            strategy_portfolios.append(portfolio)
        
        # Define objective function
        def objective_function(weights):
            # Normalize weights to sum to 1
            weights = weights / np.sum(weights)
            
            # Combine portfolios
            combined_weights = pd.Series(0.0, index=self.assets)
            for portfolio, weight in zip(strategy_portfolios, weights):
                combined_weights += portfolio['weights'] * weight
            
            # Calculate metrics
            metrics = self.risk_metrics.calculate_risk_metrics_summary(combined_weights.values)
            
            if objective == 'sharpe_ratio':
                return -metrics['sharpe_ratio']  # Negative for minimization
            elif objective == 'return':
                return -metrics['expected_return']  # Negative for minimization
            elif objective == 'volatility':
                return metrics['volatility']
            elif objective == 'diversification':
                # Calculate weighted average of individual asset volatilities
                weighted_volatility = np.sum(combined_weights.values * np.sqrt(np.diag(self.returns.cov())))
                # Calculate portfolio volatility
                portfolio_volatility = metrics['volatility']
                # Calculate diversification ratio
                diversification_ratio = weighted_volatility / portfolio_volatility if portfolio_volatility != 0 else 0
                return -diversification_ratio  # Negative for minimization
            else:
                raise ValueError(f"Unknown objective: {objective}")
        
        # Initial guess (equal weights)
        initial_weights = np.ones(len(strategies)) / len(strategies)
        
        # Define bounds
        bounds = tuple((0, 1) for _ in range(len(strategies)))
        
        # Define constraints
        constraints = [
            {'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1}  # Weights sum to 1
        ]
        
        # Run optimization
        result = optimize.minimize(
            objective_function,
            initial_weights,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )
        
        # Get optimized weights
        optimized_weights = result['x']
        
        # Normalize weights to sum to 1
        optimized_weights = optimized_weights / np.sum(optimized_weights)
        
        # Construct final portfolio with optimized weights
        final_portfolio = self.construct_multi_strategy_portfolio(
            strategies=strategies,
            weights=optimized_weights,
            constraints=constraints
        )
        
        # Add optimization details
        final_portfolio['optimization_objective'] = objective
        final_portfolio['optimization_success'] = result['success']
        final_portfolio['optimization_message'] = result['message']
        
        return final_portfolio
    
    def generate_efficient_frontier(self, 
                                   num_portfolios: int = 100,
                                   strategy: str = 'mean_variance',
                                   constraints: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
        """
        Generate the efficient frontier.
        
        Args:
            num_portfolios: Number of portfolios to generate
            strategy: Strategy to use for generating the efficient frontier
            constraints: Dictionary of constraints
            
        Returns:
            DataFrame containing portfolio weights and metrics
        """
        # Process constraints
        bounds = (0, 1)  # Default bounds (long-only)
        opt_constraints = []
        
        if constraints:
            # Process bounds
            if 'bounds' in constraints:
                bounds = constraints['bounds']
            
            # Process weight constraints
            if 'weight_constraints' in constraints:
                for asset, (min_weight, max_weight) in constraints['weight_constraints'].items():
                    if asset in self.assets:
                        asset_idx = self.assets.index(asset)
                        
                        # Minimum weight constraint
                        if min_weight is not None:
                            min_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, idx=asset_idx, min_w=min_weight: weights[idx] - min_w
                            }
                            opt_constraints.append(min_constraint)
                        
                        # Maximum weight constraint
                        if max_weight is not None:
                            max_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, idx=asset_idx, max_w=max_weight: max_w - weights[idx]
                            }
                            opt_constraints.append(max_constraint)
            
            # Process group constraints
            if 'group_constraints' in constraints:
                for group_name, group_info in constraints['group_constraints'].items():
                    group_assets = group_info['assets']
                    min_weight = group_info.get('min_weight')
                    max_weight = group_info.get('max_weight')
                    
                    # Get indices of assets in the group
                    group_indices = [self.assets.index(asset) for asset in group_assets if asset in self.assets]
                    
                    if group_indices:
                        # Minimum group weight constraint
                        if min_weight is not None:
                            min_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, indices=group_indices, min_w=min_weight: sum(weights[i] for i in indices) - min_w
                            }
                            opt_constraints.append(min_constraint)
                        
                        # Maximum group weight constraint
                        if max_weight is not None:
                            max_constraint = {
                                'type': 'ineq',
                                'fun': lambda weights, indices=group_indices, max_w=max_weight: max_w - sum(weights[i] for i in indices)
                            }
                            opt_constraints.append(max_constraint)
        
        # Generate efficient frontier
        if strategy == 'mean_variance':
            ef_df = self.optimizer.generate_efficient_frontier(num_portfolios, bounds, opt_constraints)
        else:
            raise ValueError(f"Unknown strategy: {strategy}")
        
        return ef_df
    
    def calculate_portfolio_metrics(self, weights: pd.Series) -> Dict[str, Any]:
        """
        Calculate metrics for a given portfolio.
        
        Args:
            weights: Series of portfolio weights
            
        Returns:
            Dictionary containing portfolio metrics
        """
        # Ensure weights are aligned with returns data
        weights = weights.reindex(self.assets).fillna(0)
        
        # Calculate metrics
        metrics = self.risk_metrics.calculate_risk_metrics_summary(weights.values)
        
        # Create result
        result = {
            'weights': weights,
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'metrics': metrics,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        return result
    
    def run_portfolio_stress_test(self, weights: pd.Series) -> Dict[str, pd.DataFrame]:
        """
        Run stress tests on a given portfolio.
        
        Args:
            weights: Series of portfolio weights
            
        Returns:
            Dictionary containing stress test results
        """
        # Ensure weights are aligned with returns data
        weights = weights.reindex(self.assets).fillna(0)
        
        # Create stress tester
        stress_tester = StressTester(self.returns, weights)
        
        # Run stress tests
        stress_test_results = stress_tester.run_comprehensive_stress_test()
        
        return stress_test_results
    
    def compare_portfolios(self, portfolios: Dict[str, pd.Series]) -> pd.DataFrame:
        """
        Compare multiple portfolios.
        
        Args:
            portfolios: Dictionary mapping portfolio names to weight Series
            
        Returns:
            DataFrame comparing different portfolios
        """
        # Initialize results list
        results = []
        
        # Analyze each portfolio
        for name, weights in portfolios.items():
            try:
                # Ensure weights are aligned with returns data
                weights = weights.reindex(self.assets).fillna(0)
                
                # Calculate metrics
                metrics = self.risk_metrics.calculate_risk_metrics_summary(weights.values)
                
                # Create portfolio result
                portfolio_result = {
                    'portfolio': name,
                    'expected_return': metrics['expected_return'],
                    'volatility': metrics['volatility'],
                    'sharpe_ratio': metrics['sharpe_ratio'],
                    'max_drawdown': metrics['max_drawdown'],
                    'var_95': metrics['var_95'],
                    'cvar_95': metrics['cvar_95'],
                    'annualized_return': metrics['annualized_return'],
                    'annualized_volatility': metrics['annualized_volatility']
                }
                
                # Add weights
                for asset, weight in weights.items():
                    portfolio_result[f'weight_{asset}'] = weight
                
                results.append(portfolio_result)
            except Exception as e:
                self.logger.warning(f"Error analyzing portfolio {name}: {str(e)}")
        
        # Convert results to DataFrame
        comparison_df = pd.DataFrame(results)
        
        return comparison_df