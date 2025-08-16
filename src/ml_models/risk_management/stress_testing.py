"""
Stress testing and scenario analysis module.
This module provides classes and functions for stress testing and scenario analysis.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union, Callable
import logging
import sys
import os

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
from src.ml_models.risk_management.risk_metrics import RiskMetrics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("stress_testing")

class StressTester:
    """
    Class for stress testing and scenario analysis.
    """
    def __init__(self, returns_data: pd.DataFrame, portfolio_weights: pd.Series):
        """
        Initialize the stress tester.
        
        Args:
            returns_data: DataFrame of asset returns with DatetimeIndex
            portfolio_weights: Series of portfolio weights indexed by asset names
        """
        self.returns = returns_data
        self.weights = portfolio_weights
        self.assets = list(returns_data.columns)
        
        # Ensure weights are aligned with returns data
        self.weights = self.weights.reindex(self.assets).fillna(0)
        
        # Calculate portfolio returns
        self.portfolio_returns = self._calculate_portfolio_returns()
        
        # Create risk metrics calculator
        self.risk_metrics = RiskMetrics(returns_data)
        
        self.logger = logger
    
    def _calculate_portfolio_returns(self) -> pd.Series:
        """
        Calculate historical portfolio returns.
        
        Returns:
            Series of portfolio returns
        """
        return (self.returns * self.weights).sum(axis=1)
    
    def historical_scenario_analysis(self, 
                                    scenario_periods: Dict[str, Tuple[str, str]],
                                    risk_metrics: List[str] = None) -> pd.DataFrame:
        """
        Perform historical scenario analysis.
        
        Args:
            scenario_periods: Dictionary mapping scenario names to (start_date, end_date) tuples
            risk_metrics: List of risk metrics to calculate (default: ['return', 'volatility', 'max_drawdown', 'var_95', 'cvar_95'])
            
        Returns:
            DataFrame containing scenario analysis results
        """
        # Default risk metrics
        if risk_metrics is None:
            risk_metrics = ['return', 'volatility', 'max_drawdown', 'var_95', 'cvar_95']
        
        # Initialize results list
        results = []
        
        # Analyze each scenario
        for scenario_name, (start_date, end_date) in scenario_periods.items():
            try:
                # Filter returns for scenario period
                scenario_returns = self.returns.loc[start_date:end_date]
                
                # Calculate portfolio returns for scenario period
                scenario_portfolio_returns = (scenario_returns * self.weights).sum(axis=1)
                
                # Calculate cumulative return
                cumulative_return = (1 + scenario_portfolio_returns).prod() - 1
                
                # Create scenario result
                scenario_result = {
                    'scenario': scenario_name,
                    'start_date': start_date,
                    'end_date': end_date,
                    'num_days': len(scenario_returns)
                }
                
                # Calculate requested risk metrics
                if 'return' in risk_metrics:
                    scenario_result['return'] = cumulative_return
                    scenario_result['annualized_return'] = (1 + cumulative_return) ** (252 / len(scenario_returns)) - 1
                
                if 'volatility' in risk_metrics:
                    scenario_result['volatility'] = scenario_portfolio_returns.std()
                    scenario_result['annualized_volatility'] = scenario_portfolio_returns.std() * np.sqrt(252)
                
                if 'max_drawdown' in risk_metrics:
                    # Calculate cumulative returns
                    cum_returns = (1 + scenario_portfolio_returns).cumprod()
                    # Calculate running maximum
                    running_max = np.maximum.accumulate(cum_returns)
                    # Calculate drawdown
                    drawdown = (cum_returns - running_max) / running_max
                    # Calculate maximum drawdown
                    scenario_result['max_drawdown'] = drawdown.min()
                
                if 'var_95' in risk_metrics:
                    scenario_result['var_95'] = -np.percentile(scenario_portfolio_returns, 5)
                
                if 'cvar_95' in risk_metrics:
                    var_95 = -np.percentile(scenario_portfolio_returns, 5)
                    scenario_result['cvar_95'] = -scenario_portfolio_returns[scenario_portfolio_returns <= -var_95].mean()
                
                if 'sharpe_ratio' in risk_metrics:
                    mean_return = scenario_portfolio_returns.mean()
                    std_dev = scenario_portfolio_returns.std()
                    scenario_result['sharpe_ratio'] = mean_return / std_dev if std_dev != 0 else 0
                    scenario_result['annualized_sharpe_ratio'] = (mean_return * 252) / (std_dev * np.sqrt(252)) if std_dev != 0 else 0
                
                if 'sortino_ratio' in risk_metrics:
                    mean_return = scenario_portfolio_returns.mean()
                    downside_returns = scenario_portfolio_returns[scenario_portfolio_returns < 0]
                    downside_deviation = np.sqrt(np.mean(downside_returns ** 2)) if len(downside_returns) > 0 else 0
                    scenario_result['sortino_ratio'] = mean_return / downside_deviation if downside_deviation != 0 else 0
                    scenario_result['annualized_sortino_ratio'] = (mean_return * 252) / (downside_deviation * np.sqrt(252)) if downside_deviation != 0 else 0
                
                results.append(scenario_result)
            except Exception as e:
                self.logger.warning(f"Error analyzing scenario {scenario_name}: {str(e)}")
        
        # Convert results to DataFrame
        scenario_df = pd.DataFrame(results)
        
        return scenario_df
    
    def monte_carlo_stress_test(self, 
                               num_simulations: int = 1000,
                               time_horizon: int = 252,
                               confidence_level: float = 0.95,
                               return_scenarios: bool = False) -> Dict[str, Any]:
        """
        Perform Monte Carlo stress testing.
        
        Args:
            num_simulations: Number of simulations to run
            time_horizon: Time horizon in days
            confidence_level: Confidence level for VaR and CVaR
            return_scenarios: Whether to return all scenario paths
            
        Returns:
            Dictionary containing stress test results
        """
        # Calculate portfolio mean and volatility
        portfolio_mean = self.portfolio_returns.mean()
        portfolio_volatility = self.portfolio_returns.std()
        
        # Initialize simulation results
        simulation_results = np.zeros((time_horizon, num_simulations))
        
        # Run simulations
        for i in range(num_simulations):
            # Generate random returns
            random_returns = np.random.normal(portfolio_mean, portfolio_volatility, time_horizon)
            
            # Calculate cumulative returns
            cumulative_returns = (1 + random_returns).cumprod()
            
            # Store results
            simulation_results[:, i] = cumulative_returns
        
        # Calculate statistics
        final_values = simulation_results[-1, :]
        mean_final_value = np.mean(final_values)
        median_final_value = np.median(final_values)
        min_final_value = np.min(final_values)
        max_final_value = np.max(final_values)
        
        # Calculate VaR
        var = 1 - np.percentile(final_values, 100 * (1 - confidence_level))
        
        # Calculate CVaR
        cvar = 1 - np.mean(final_values[final_values <= np.percentile(final_values, 100 * (1 - confidence_level))])
        
        # Calculate probability of loss
        prob_loss = np.mean(final_values < 1)
        
        # Create result dictionary
        result = {
            'mean_final_value': mean_final_value,
            'median_final_value': median_final_value,
            'min_final_value': min_final_value,
            'max_final_value': max_final_value,
            'var': var,
            'cvar': cvar,
            'probability_of_loss': prob_loss,
            'confidence_level': confidence_level,
            'num_simulations': num_simulations,
            'time_horizon': time_horizon
        }
        
        # Add percentiles
        percentiles = [1, 5, 10, 25, 50, 75, 90, 95, 99]
        for p in percentiles:
            result[f'percentile_{p}'] = np.percentile(final_values, p)
        
        # Add scenarios if requested
        if return_scenarios:
            result['scenarios'] = simulation_results
        
        return result
    
    def custom_scenario_analysis(self, 
                               scenario_shocks: Dict[str, Dict[str, float]],
                               time_horizon: int = 252) -> pd.DataFrame:
        """
        Perform custom scenario analysis with user-defined shocks.
        
        Args:
            scenario_shocks: Dictionary mapping scenario names to dictionaries of asset shocks
            time_horizon: Time horizon in days
            
        Returns:
            DataFrame containing scenario analysis results
        """
        # Initialize results list
        results = []
        
        # Analyze each scenario
        for scenario_name, shocks in scenario_shocks.items():
            try:
                # Create scenario result
                scenario_result = {
                    'scenario': scenario_name
                }
                
                # Calculate portfolio impact
                portfolio_impact = 0
                for asset, shock in shocks.items():
                    if asset in self.weights.index:
                        asset_impact = shock * self.weights[asset]
                        portfolio_impact += asset_impact
                        scenario_result[f'impact_{asset}'] = asset_impact
                
                # Calculate total portfolio impact
                scenario_result['portfolio_impact'] = portfolio_impact
                
                # Calculate annualized impact
                scenario_result['annualized_impact'] = (1 + portfolio_impact) ** (252 / time_horizon) - 1
                
                # Calculate final portfolio value
                scenario_result['final_portfolio_value'] = 1 + portfolio_impact
                
                results.append(scenario_result)
            except Exception as e:
                self.logger.warning(f"Error analyzing scenario {scenario_name}: {str(e)}")
        
        # Convert results to DataFrame
        scenario_df = pd.DataFrame(results)
        
        return scenario_df
    
    def factor_stress_test(self, 
                          factor_exposures: pd.DataFrame,
                          factor_shocks: Dict[str, Dict[str, float]]) -> pd.DataFrame:
        """
        Perform factor-based stress testing.
        
        Args:
            factor_exposures: DataFrame of factor exposures (assets x factors)
            factor_shocks: Dictionary mapping scenario names to dictionaries of factor shocks
            
        Returns:
            DataFrame containing stress test results
        """
        # Initialize results list
        results = []
        
        # Analyze each scenario
        for scenario_name, shocks in factor_shocks.items():
            try:
                # Create scenario result
                scenario_result = {
                    'scenario': scenario_name
                }
                
                # Calculate asset impacts
                asset_impacts = {}
                for asset in self.assets:
                    if asset in factor_exposures.index:
                        asset_impact = 0
                        for factor, shock in shocks.items():
                            if factor in factor_exposures.columns:
                                factor_exposure = factor_exposures.loc[asset, factor]
                                asset_impact += factor_exposure * shock
                        asset_impacts[asset] = asset_impact
                        scenario_result[f'impact_{asset}'] = asset_impact
                
                # Calculate portfolio impact
                portfolio_impact = 0
                for asset, impact in asset_impacts.items():
                    if asset in self.weights.index:
                        portfolio_impact += impact * self.weights[asset]
                
                # Calculate total portfolio impact
                scenario_result['portfolio_impact'] = portfolio_impact
                
                # Calculate final portfolio value
                scenario_result['final_portfolio_value'] = 1 + portfolio_impact
                
                results.append(scenario_result)
            except Exception as e:
                self.logger.warning(f"Error analyzing scenario {scenario_name}: {str(e)}")
        
        # Convert results to DataFrame
        scenario_df = pd.DataFrame(results)
        
        return scenario_df
    
    def historical_var_stress_test(self, 
                                 confidence_levels: List[float] = None,
                                 time_horizons: List[int] = None) -> pd.DataFrame:
        """
        Perform historical VaR stress testing at different confidence levels and time horizons.
        
        Args:
            confidence_levels: List of confidence levels to test
            time_horizons: List of time horizons in days to test
            
        Returns:
            DataFrame containing VaR stress test results
        """
        # Default confidence levels
        if confidence_levels is None:
            confidence_levels = [0.9, 0.95, 0.99]
        
        # Default time horizons
        if time_horizons is None:
            time_horizons = [1, 5, 10, 21, 63, 252]  # 1 day, 1 week, 2 weeks, 1 month, 3 months, 1 year
        
        # Initialize results list
        results = []
        
        # Calculate VaR for each confidence level and time horizon
        for confidence_level in confidence_levels:
            for time_horizon in time_horizons:
                # Calculate VaR
                var = -np.percentile(self.portfolio_returns, 100 * (1 - confidence_level)) * np.sqrt(time_horizon)
                
                # Calculate CVaR
                cvar = -self.portfolio_returns[self.portfolio_returns <= -var / np.sqrt(time_horizon)].mean() * np.sqrt(time_horizon)
                
                # Create result
                result = {
                    'confidence_level': confidence_level,
                    'time_horizon': time_horizon,
                    'var': var,
                    'cvar': cvar
                }
                
                results.append(result)
        
        # Convert results to DataFrame
        var_df = pd.DataFrame(results)
        
        return var_df
    
    def correlation_stress_test(self, 
                              correlation_scenarios: Dict[str, float],
                              num_simulations: int = 1000) -> pd.DataFrame:
        """
        Perform correlation stress testing.
        
        Args:
            correlation_scenarios: Dictionary mapping scenario names to correlation multipliers
            num_simulations: Number of simulations to run for each scenario
            
        Returns:
            DataFrame containing correlation stress test results
        """
        # Calculate original correlation matrix
        original_corr = self.returns.corr()
        
        # Initialize results list
        results = []
        
        # Analyze each scenario
        for scenario_name, corr_multiplier in correlation_scenarios.items():
            try:
                # Create modified correlation matrix
                modified_corr = original_corr.copy()
                
                # Modify off-diagonal elements
                for i in range(len(self.assets)):
                    for j in range(len(self.assets)):
                        if i != j:
                            # Increase or decrease correlation
                            modified_corr.iloc[i, j] = min(1, max(-1, modified_corr.iloc[i, j] * corr_multiplier))
                
                # Ensure matrix is positive semi-definite
                eigenvalues = np.linalg.eigvals(modified_corr)
                if np.any(eigenvalues < 0):
                    # Add small positive value to diagonal to make positive semi-definite
                    min_eigenvalue = min(eigenvalues)
                    modified_corr = modified_corr + np.eye(len(self.assets)) * abs(min_eigenvalue) * 1.1
                
                # Convert correlation to covariance
                std_dev = self.returns.std()
                modified_cov = modified_corr * np.outer(std_dev, std_dev)
                
                # Run Monte Carlo simulation with modified covariance
                portfolio_mean = self.portfolio_returns.mean()
                
                # Initialize simulation results
                simulation_results = np.zeros(num_simulations)
                
                # Run simulations
                for i in range(num_simulations):
                    # Generate random returns with modified covariance
                    random_returns = np.random.multivariate_normal(
                        self.returns.mean().values,
                        modified_cov.values,
                        1
                    )[0]
                    
                    # Calculate portfolio return
                    portfolio_return = np.sum(random_returns * self.weights.values)
                    
                    # Store result
                    simulation_results[i] = portfolio_return
                
                # Calculate statistics
                mean_return = np.mean(simulation_results)
                volatility = np.std(simulation_results)
                var_95 = -np.percentile(simulation_results, 5)
                cvar_95 = -np.mean(simulation_results[simulation_results <= -var_95])
                
                # Create scenario result
                scenario_result = {
                    'scenario': scenario_name,
                    'correlation_multiplier': corr_multiplier,
                    'mean_return': mean_return,
                    'volatility': volatility,
                    'var_95': var_95,
                    'cvar_95': cvar_95,
                    'sharpe_ratio': mean_return / volatility if volatility != 0 else 0
                }
                
                results.append(scenario_result)
            except Exception as e:
                self.logger.warning(f"Error analyzing scenario {scenario_name}: {str(e)}")
        
        # Convert results to DataFrame
        correlation_df = pd.DataFrame(results)
        
        return correlation_df
    
    def liquidity_stress_test(self, 
                             liquidity_scenarios: Dict[str, Dict[str, float]],
                             position_sizes: pd.Series,
                             daily_volumes: pd.Series) -> pd.DataFrame:
        """
        Perform liquidity stress testing.
        
        Args:
            liquidity_scenarios: Dictionary mapping scenario names to dictionaries of volume reduction factors
            position_sizes: Series of position sizes in number of shares
            daily_volumes: Series of average daily trading volumes
            
        Returns:
            DataFrame containing liquidity stress test results
        """
        # Initialize results list
        results = []
        
        # Analyze each scenario
        for scenario_name, volume_factors in liquidity_scenarios.items():
            try:
                # Create scenario result
                scenario_result = {
                    'scenario': scenario_name
                }
                
                # Calculate days to liquidate for each asset
                total_days_to_liquidate = 0
                max_days_to_liquidate = 0
                
                for asset in self.assets:
                    if asset in position_sizes.index and asset in daily_volumes.index:
                        # Get volume reduction factor for this asset
                        volume_factor = volume_factors.get(asset, volume_factors.get('default', 1.0))
                        
                        # Calculate reduced daily volume
                        reduced_volume = daily_volumes[asset] * volume_factor
                        
                        # Calculate days to liquidate
                        days_to_liquidate = position_sizes[asset] / reduced_volume if reduced_volume > 0 else float('inf')
                        
                        # Store result
                        scenario_result[f'days_to_liquidate_{asset}'] = days_to_liquidate
                        
                        # Update total and max
                        total_days_to_liquidate += days_to_liquidate
                        max_days_to_liquidate = max(max_days_to_liquidate, days_to_liquidate)
                
                # Calculate average days to liquidate
                scenario_result['avg_days_to_liquidate'] = total_days_to_liquidate / len(self.assets)
                scenario_result['max_days_to_liquidate'] = max_days_to_liquidate
                
                results.append(scenario_result)
            except Exception as e:
                self.logger.warning(f"Error analyzing scenario {scenario_name}: {str(e)}")
        
        # Convert results to DataFrame
        liquidity_df = pd.DataFrame(results)
        
        return liquidity_df
    
    def tail_risk_stress_test(self, 
                             confidence_levels: List[float] = None,
                             distribution_types: List[str] = None) -> pd.DataFrame:
        """
        Perform tail risk stress testing using different distribution assumptions.
        
        Args:
            confidence_levels: List of confidence levels to test
            distribution_types: List of distribution types to test
            
        Returns:
            DataFrame containing tail risk stress test results
        """
        # Default confidence levels
        if confidence_levels is None:
            confidence_levels = [0.9, 0.95, 0.99]
        
        # Default distribution types
        if distribution_types is None:
            distribution_types = ['normal', 'historical', 't-distribution']
        
        # Initialize results list
        results = []
        
        # Calculate portfolio mean and volatility
        portfolio_mean = self.portfolio_returns.mean()
        portfolio_volatility = self.portfolio_returns.std()
        
        # Calculate degrees of freedom for t-distribution
        # (using method of moments estimator)
        excess_kurtosis = self.portfolio_returns.kurtosis()
        df = 6 / excess_kurtosis + 4 if excess_kurtosis > 0 else 30
        
        # Analyze each confidence level and distribution type
        for confidence_level in confidence_levels:
            for dist_type in distribution_types:
                try:
                    # Calculate VaR and CVaR
                    if dist_type == 'normal':
                        # Normal distribution
                        from scipy import stats
                        z_score = stats.norm.ppf(1 - confidence_level)
                        var = -portfolio_mean + z_score * portfolio_volatility
                        # Expected shortfall (CVaR) for normal distribution
                        cvar = -portfolio_mean + portfolio_volatility * stats.norm.pdf(z_score) / (1 - confidence_level)
                    
                    elif dist_type == 'historical':
                        # Historical distribution
                        var = -np.percentile(self.portfolio_returns, 100 * (1 - confidence_level))
                        cvar = -self.portfolio_returns[self.portfolio_returns <= -var].mean()
                    
                    elif dist_type == 't-distribution':
                        # Student's t-distribution
                        from scipy import stats
                        t_score = stats.t.ppf(1 - confidence_level, df)
                        var = -portfolio_mean + t_score * portfolio_volatility
                        # Expected shortfall (CVaR) for t-distribution
                        k = stats.t.pdf(t_score, df) / (1 - confidence_level)
                        cvar = -portfolio_mean + portfolio_volatility * k * (df + t_score**2) / (df - 1)
                    
                    else:
                        continue
                    
                    # Create result
                    result = {
                        'confidence_level': confidence_level,
                        'distribution_type': dist_type,
                        'var': var,
                        'cvar': cvar
                    }
                    
                    # Add additional information for t-distribution
                    if dist_type == 't-distribution':
                        result['degrees_of_freedom'] = df
                    
                    results.append(result)
                except Exception as e:
                    self.logger.warning(f"Error analyzing {dist_type} at {confidence_level} confidence level: {str(e)}")
        
        # Convert results to DataFrame
        tail_risk_df = pd.DataFrame(results)
        
        return tail_risk_df
    
    def run_comprehensive_stress_test(self) -> Dict[str, pd.DataFrame]:
        """
        Run a comprehensive stress test including multiple types of analysis.
        
        Returns:
            Dictionary containing results of different stress tests
        """
        results = {}
        
        # 1. Historical scenario analysis
        # Define common historical stress periods
        historical_scenarios = {
            'Global Financial Crisis': ('2007-10-01', '2009-03-31'),
            'COVID-19 Crash': ('2020-02-15', '2020-03-31'),
            'Tech Bubble Burst': ('2000-03-01', '2002-10-31'),
            'European Debt Crisis': ('2011-07-01', '2011-09-30'),
            'Flash Crash': ('2010-05-06', '2010-05-07'),
            'Black Monday': ('1987-10-19', '1987-10-20'),
            'Recent Bull Market': ('2019-01-01', '2019-12-31')
        }
        
        try:
            results['historical_scenarios'] = self.historical_scenario_analysis(historical_scenarios)
        except Exception as e:
            self.logger.warning(f"Error in historical scenario analysis: {str(e)}")
        
        # 2. Monte Carlo stress test
        try:
            monte_carlo_result = self.monte_carlo_stress_test(num_simulations=5000)
            # Convert to DataFrame for consistency
            results['monte_carlo'] = pd.DataFrame([monte_carlo_result])
        except Exception as e:
            self.logger.warning(f"Error in Monte Carlo stress test: {str(e)}")
        
        # 3. Custom scenario analysis
        # Define custom shock scenarios
        custom_scenarios = {
            'Market Crash': {'SPY': -0.30, 'QQQ': -0.35, 'IWM': -0.40},
            'Tech Selloff': {'QQQ': -0.25, 'AAPL': -0.30, 'MSFT': -0.30, 'AMZN': -0.35, 'GOOGL': -0.35},
            'Interest Rate Hike': {'TLT': -0.15, 'IEF': -0.10, 'LQD': -0.08, 'SPY': -0.05},
            'Inflation Surge': {'TIP': 0.05, 'GLD': 0.10, 'SPY': -0.08, 'TLT': -0.12},
            'Economic Recovery': {'SPY': 0.15, 'IWM': 0.20, 'XLF': 0.25, 'XLI': 0.18}
        }
        
        try:
            # Filter scenarios to include only assets in the portfolio
            filtered_scenarios = {}
            for scenario_name, shocks in custom_scenarios.items():
                filtered_shocks = {asset: shock for asset, shock in shocks.items() if asset in self.assets}
                if filtered_shocks:
                    filtered_scenarios[scenario_name] = filtered_shocks
            
            if filtered_scenarios:
                results['custom_scenarios'] = self.custom_scenario_analysis(filtered_scenarios)
        except Exception as e:
            self.logger.warning(f"Error in custom scenario analysis: {str(e)}")
        
        # 4. VaR stress test
        try:
            results['var_stress_test'] = self.historical_var_stress_test()
        except Exception as e:
            self.logger.warning(f"Error in VaR stress test: {str(e)}")
        
        # 5. Correlation stress test
        correlation_scenarios = {
            'Normal': 1.0,
            'Increased Correlation': 1.5,
            'High Correlation': 2.0,
            'Perfect Correlation': 10.0,  # Will be capped at 1.0
            'Decreased Correlation': 0.5,
            'Zero Correlation': 0.0,
            'Negative Correlation': -1.0
        }
        
        try:
            results['correlation_stress_test'] = self.correlation_stress_test(correlation_scenarios)
        except Exception as e:
            self.logger.warning(f"Error in correlation stress test: {str(e)}")
        
        # 6. Tail risk stress test
        try:
            results['tail_risk_stress_test'] = self.tail_risk_stress_test()
        except Exception as e:
            self.logger.warning(f"Error in tail risk stress test: {str(e)}")
        
        return results