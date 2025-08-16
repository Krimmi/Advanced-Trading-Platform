"""
Portfolio optimization module.
This module provides classes and functions for portfolio optimization.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union, Callable
import scipy.optimize as optimize
import logging
import cvxpy as cp
import sys
import os

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
from src.ml_models.risk_management.risk_metrics import RiskMetrics
from src.ml_models.risk_management.transaction_costs import (
    TransactionCostModel, FixedRateModel, create_transaction_cost_model
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("portfolio_optimization")

class PortfolioOptimizer:
    """
    Base class for portfolio optimization.
    """
    def __init__(self, returns_data: pd.DataFrame, risk_free_rate: float = 0.0):
        """
        Initialize the portfolio optimizer.
        
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
        
        # Calculate basic statistics
        self.mean_returns = returns_data.mean()
        self.cov_matrix = returns_data.cov()
        
        self.logger = logger
    
    def optimize_sharpe_ratio(self, 
                             bounds: Optional[Tuple[float, float]] = (0, 1),
                             constraints: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Optimize portfolio for maximum Sharpe ratio.
        
        Args:
            bounds: Tuple of (min_weight, max_weight) for each asset
            constraints: List of additional constraints
            
        Returns:
            Dictionary containing optimized weights and metrics
        """
        # Define objective function to minimize (negative Sharpe ratio)
        def objective(weights):
            return -self.risk_metrics.calculate_sharpe_ratio(weights)
        
        # Initial guess (equal weights)
        initial_weights = np.ones(self.num_assets) / self.num_assets
        
        # Define bounds
        if bounds:
            bounds_tuple = tuple(bounds for _ in range(self.num_assets))
        else:
            bounds_tuple = tuple((0, 1) for _ in range(self.num_assets))
        
        # Define constraints
        constraint_list = []
        
        # Add weights sum to 1 constraint
        weights_sum_to_1 = {'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1}
        constraint_list.append(weights_sum_to_1)
        
        # Add additional constraints if provided
        if constraints:
            constraint_list.extend(constraints)
        
        # Run optimization
        result = optimize.minimize(
            objective,
            initial_weights,
            method='SLSQP',
            bounds=bounds_tuple,
            constraints=constraint_list
        )
        
        # Check if optimization was successful
        if not result['success']:
            self.logger.warning(f"Optimization failed: {result['message']}")
        
        # Get optimized weights
        optimized_weights = result['x']
        
        # Calculate metrics for optimized portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(optimized_weights)
        
        # Create result dictionary
        optimization_result = {
            'weights': pd.Series(optimized_weights, index=self.assets),
            'sharpe_ratio': -result['fun'],  # Convert back from negative
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'metrics': metrics
        }
        
        return optimization_result
    
    def optimize_minimum_volatility(self,
                                   bounds: Optional[Tuple[float, float]] = (0, 1),
                                   constraints: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Optimize portfolio for minimum volatility.
        
        Args:
            bounds: Tuple of (min_weight, max_weight) for each asset
            constraints: List of additional constraints
            
        Returns:
            Dictionary containing optimized weights and metrics
        """
        # Define objective function to minimize (portfolio volatility)
        def objective(weights):
            return self.risk_metrics.calculate_portfolio_volatility(weights)
        
        # Initial guess (equal weights)
        initial_weights = np.ones(self.num_assets) / self.num_assets
        
        # Define bounds
        if bounds:
            bounds_tuple = tuple(bounds for _ in range(self.num_assets))
        else:
            bounds_tuple = tuple((0, 1) for _ in range(self.num_assets))
        
        # Define constraints
        constraint_list = []
        
        # Add weights sum to 1 constraint
        weights_sum_to_1 = {'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1}
        constraint_list.append(weights_sum_to_1)
        
        # Add additional constraints if provided
        if constraints:
            constraint_list.extend(constraints)
        
        # Run optimization
        result = optimize.minimize(
            objective,
            initial_weights,
            method='SLSQP',
            bounds=bounds_tuple,
            constraints=constraint_list
        )
        
        # Check if optimization was successful
        if not result['success']:
            self.logger.warning(f"Optimization failed: {result['message']}")
        
        # Get optimized weights
        optimized_weights = result['x']
        
        # Calculate metrics for optimized portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(optimized_weights)
        
        # Create result dictionary
        optimization_result = {
            'weights': pd.Series(optimized_weights, index=self.assets),
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'metrics': metrics
        }
        
        return optimization_result
    
    def optimize_maximum_return(self,
                               target_volatility: Optional[float] = None,
                               bounds: Optional[Tuple[float, float]] = (0, 1),
                               constraints: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Optimize portfolio for maximum return, optionally with a volatility constraint.
        
        Args:
            target_volatility: Target portfolio volatility (if None, no volatility constraint)
            bounds: Tuple of (min_weight, max_weight) for each asset
            constraints: List of additional constraints
            
        Returns:
            Dictionary containing optimized weights and metrics
        """
        # Define objective function to minimize (negative portfolio return)
        def objective(weights):
            return -self.risk_metrics.calculate_portfolio_return(weights)
        
        # Initial guess (equal weights)
        initial_weights = np.ones(self.num_assets) / self.num_assets
        
        # Define bounds
        if bounds:
            bounds_tuple = tuple(bounds for _ in range(self.num_assets))
        else:
            bounds_tuple = tuple((0, 1) for _ in range(self.num_assets))
        
        # Define constraints
        constraint_list = []
        
        # Add weights sum to 1 constraint
        weights_sum_to_1 = {'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1}
        constraint_list.append(weights_sum_to_1)
        
        # Add volatility constraint if target_volatility is provided
        if target_volatility is not None:
            volatility_constraint = {
                'type': 'eq',
                'fun': lambda weights: self.risk_metrics.calculate_portfolio_volatility(weights) - target_volatility
            }
            constraint_list.append(volatility_constraint)
        
        # Add additional constraints if provided
        if constraints:
            constraint_list.extend(constraints)
        
        # Run optimization
        result = optimize.minimize(
            objective,
            initial_weights,
            method='SLSQP',
            bounds=bounds_tuple,
            constraints=constraint_list
        )
        
        # Check if optimization was successful
        if not result['success']:
            self.logger.warning(f"Optimization failed: {result['message']}")
        
        # Get optimized weights
        optimized_weights = result['x']
        
        # Calculate metrics for optimized portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(optimized_weights)
        
        # Create result dictionary
        optimization_result = {
            'weights': pd.Series(optimized_weights, index=self.assets),
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'metrics': metrics
        }
        
        return optimization_result
    
    def generate_efficient_frontier(self, 
                                   num_portfolios: int = 100,
                                   bounds: Optional[Tuple[float, float]] = (0, 1),
                                   constraints: Optional[List[Dict]] = None) -> pd.DataFrame:
        """
        Generate the efficient frontier.
        
        Args:
            num_portfolios: Number of portfolios to generate
            bounds: Tuple of (min_weight, max_weight) for each asset
            constraints: List of additional constraints
            
        Returns:
            DataFrame containing portfolio weights and metrics
        """
        # Find minimum volatility portfolio
        min_vol_portfolio = self.optimize_minimum_volatility(bounds, constraints)
        min_volatility = min_vol_portfolio['volatility']
        
        # Find maximum return portfolio
        max_return_portfolio = self.optimize_maximum_return(bounds=bounds, constraints=constraints)
        max_return = max_return_portfolio['expected_return']
        
        # Generate target returns between min volatility portfolio return and max return
        min_return = min_vol_portfolio['expected_return']
        target_returns = np.linspace(min_return, max_return, num_portfolios)
        
        # Initialize results list
        results = []
        
        # Generate efficient frontier portfolios
        for target_return in target_returns:
            # Define constraints including target return
            ef_constraints = []
            
            # Add weights sum to 1 constraint
            weights_sum_to_1 = {'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1}
            ef_constraints.append(weights_sum_to_1)
            
            # Add target return constraint
            target_return_constraint = {
                'type': 'eq',
                'fun': lambda weights: self.risk_metrics.calculate_portfolio_return(weights) - target_return
            }
            ef_constraints.append(target_return_constraint)
            
            # Add additional constraints if provided
            if constraints:
                ef_constraints.extend(constraints)
            
            # Define objective function to minimize (portfolio volatility)
            def objective(weights):
                return self.risk_metrics.calculate_portfolio_volatility(weights)
            
            # Initial guess (equal weights)
            initial_weights = np.ones(self.num_assets) / self.num_assets
            
            # Define bounds
            if bounds:
                bounds_tuple = tuple(bounds for _ in range(self.num_assets))
            else:
                bounds_tuple = tuple((0, 1) for _ in range(self.num_assets))
            
            # Run optimization
            try:
                result = optimize.minimize(
                    objective,
                    initial_weights,
                    method='SLSQP',
                    bounds=bounds_tuple,
                    constraints=ef_constraints
                )
                
                # Check if optimization was successful
                if result['success']:
                    # Get optimized weights
                    optimized_weights = result['x']
                    
                    # Calculate metrics for optimized portfolio
                    volatility = self.risk_metrics.calculate_portfolio_volatility(optimized_weights)
                    sharpe_ratio = self.risk_metrics.calculate_sharpe_ratio(optimized_weights)
                    
                    # Create result dictionary
                    portfolio_result = {
                        'return': target_return,
                        'volatility': volatility,
                        'sharpe_ratio': sharpe_ratio
                    }
                    
                    # Add weights
                    for i, asset in enumerate(self.assets):
                        portfolio_result[f'weight_{asset}'] = optimized_weights[i]
                    
                    results.append(portfolio_result)
            except Exception as e:
                self.logger.warning(f"Optimization failed for target return {target_return}: {str(e)}")
        
        # Convert results to DataFrame
        ef_df = pd.DataFrame(results)
        
        return ef_df
    
    def optimize_risk_parity(self,
                            risk_budget: Optional[np.ndarray] = None,
                            bounds: Optional[Tuple[float, float]] = (0, 1),
                            max_iterations: int = 1000) -> Dict[str, Any]:
        """
        Optimize portfolio using risk parity approach.
        
        Args:
            risk_budget: Target risk contribution for each asset (if None, equal risk contribution)
            bounds: Tuple of (min_weight, max_weight) for each asset
            max_iterations: Maximum number of iterations for optimization
            
        Returns:
            Dictionary containing optimized weights and metrics
        """
        # If risk_budget is not provided, use equal risk contribution
        if risk_budget is None:
            risk_budget = np.ones(self.num_assets) / self.num_assets
        else:
            # Normalize risk budget to sum to 1
            risk_budget = risk_budget / np.sum(risk_budget)
        
        # Define objective function to minimize (risk parity error)
        def objective(weights):
            # Normalize weights to sum to 1
            weights = weights / np.sum(weights)
            
            # Calculate portfolio volatility
            portfolio_volatility = self.risk_metrics.calculate_portfolio_volatility(weights)
            
            # Calculate risk contribution
            risk_contribution = self.risk_metrics.calculate_risk_contribution(weights)
            
            # Calculate risk contribution error
            risk_target = risk_budget * portfolio_volatility
            risk_error = np.sum((risk_contribution - risk_target) ** 2)
            
            return risk_error
        
        # Initial guess (equal weights)
        initial_weights = np.ones(self.num_assets) / self.num_assets
        
        # Define bounds
        if bounds:
            bounds_tuple = tuple(bounds for _ in range(self.num_assets))
        else:
            bounds_tuple = tuple((0, 1) for _ in range(self.num_assets))
        
        # Run optimization
        result = optimize.minimize(
            objective,
            initial_weights,
            method='SLSQP',
            bounds=bounds_tuple,
            constraints={'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1},
            options={'maxiter': max_iterations}
        )
        
        # Check if optimization was successful
        if not result['success']:
            self.logger.warning(f"Risk parity optimization failed: {result['message']}")
        
        # Get optimized weights
        optimized_weights = result['x']
        
        # Normalize weights to sum to 1
        optimized_weights = optimized_weights / np.sum(optimized_weights)
        
        # Calculate metrics for optimized portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(optimized_weights)
        
        # Calculate actual risk contribution
        risk_contribution = self.risk_metrics.calculate_risk_contribution(optimized_weights)
        
        # Create result dictionary
        optimization_result = {
            'weights': pd.Series(optimized_weights, index=self.assets),
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'risk_contribution': risk_contribution,
            'risk_budget': pd.Series(risk_budget, index=self.assets),
            'metrics': metrics
        }
        
        return optimization_result
    
    def optimize_maximum_diversification(self,
                                        bounds: Optional[Tuple[float, float]] = (0, 1),
                                        constraints: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Optimize portfolio for maximum diversification.
        
        Args:
            bounds: Tuple of (min_weight, max_weight) for each asset
            constraints: List of additional constraints
            
        Returns:
            Dictionary containing optimized weights and metrics
        """
        # Define objective function to minimize (negative diversification ratio)
        def objective(weights):
            # Calculate weighted average of individual asset volatilities
            weighted_volatility = np.sum(weights * np.sqrt(np.diag(self.cov_matrix)))
            
            # Calculate portfolio volatility
            portfolio_volatility = self.risk_metrics.calculate_portfolio_volatility(weights)
            
            # Calculate diversification ratio
            diversification_ratio = weighted_volatility / portfolio_volatility if portfolio_volatility != 0 else 0
            
            # Return negative diversification ratio for minimization
            return -diversification_ratio
        
        # Initial guess (equal weights)
        initial_weights = np.ones(self.num_assets) / self.num_assets
        
        # Define bounds
        if bounds:
            bounds_tuple = tuple(bounds for _ in range(self.num_assets))
        else:
            bounds_tuple = tuple((0, 1) for _ in range(self.num_assets))
        
        # Define constraints
        constraint_list = []
        
        # Add weights sum to 1 constraint
        weights_sum_to_1 = {'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1}
        constraint_list.append(weights_sum_to_1)
        
        # Add additional constraints if provided
        if constraints:
            constraint_list.extend(constraints)
        
        # Run optimization
        result = optimize.minimize(
            objective,
            initial_weights,
            method='SLSQP',
            bounds=bounds_tuple,
            constraints=constraint_list
        )
        
        # Check if optimization was successful
        if not result['success']:
            self.logger.warning(f"Maximum diversification optimization failed: {result['message']}")
        
        # Get optimized weights
        optimized_weights = result['x']
        
        # Calculate metrics for optimized portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(optimized_weights)
        
        # Calculate diversification ratio
        weighted_volatility = np.sum(optimized_weights * np.sqrt(np.diag(self.cov_matrix)))
        portfolio_volatility = metrics['volatility']
        diversification_ratio = weighted_volatility / portfolio_volatility if portfolio_volatility != 0 else 0
        
        # Create result dictionary
        optimization_result = {
            'weights': pd.Series(optimized_weights, index=self.assets),
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'diversification_ratio': diversification_ratio,
            'metrics': metrics
        }
        
        return optimization_result
    
    def optimize_black_litterman(self,
                                market_weights: np.ndarray,
                                views: Dict[str, float],
                                view_confidences: Dict[str, float],
                                tau: float = 0.025,
                                bounds: Optional[Tuple[float, float]] = (0, 1),
                                constraints: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Optimize portfolio using Black-Litterman model.
        
        Args:
            market_weights: Market capitalization weights
            views: Dictionary of views on expected returns (asset: expected_return)
            view_confidences: Dictionary of confidence levels for views (asset: confidence)
            tau: Scaling parameter for uncertainty in the prior
            bounds: Tuple of (min_weight, max_weight) for each asset
            constraints: List of additional constraints
            
        Returns:
            Dictionary containing optimized weights and metrics
        """
        # Calculate implied returns using reverse optimization
        implied_returns = self.risk_free_rate + tau * np.dot(self.cov_matrix, market_weights)
        
        # Create view matrix P and view vector Q
        view_assets = list(views.keys())
        num_views = len(view_assets)
        
        P = np.zeros((num_views, self.num_assets))
        Q = np.zeros(num_views)
        
        for i, asset in enumerate(view_assets):
            asset_idx = self.assets.index(asset)
            P[i, asset_idx] = 1
            Q[i] = views[asset]
        
        # Create diagonal matrix of view confidences
        omega = np.zeros((num_views, num_views))
        for i, asset in enumerate(view_assets):
            confidence = view_confidences.get(asset, 0.5)  # Default confidence of 0.5
            omega[i, i] = (1 / confidence) * np.dot(P[i], np.dot(self.cov_matrix, P[i].T))
        
        # Calculate posterior returns
        A = np.dot(np.dot(P, self.cov_matrix), P.T) + omega
        B = np.dot(P, implied_returns) - Q
        
        try:
            # Solve for lambda (Lagrange multiplier)
            lambda_bl = np.linalg.solve(A, B)
            
            # Calculate posterior returns
            posterior_returns = implied_returns - np.dot(np.dot(self.cov_matrix, P.T), lambda_bl)
        except np.linalg.LinAlgError:
            self.logger.warning("Singular matrix in Black-Litterman calculation. Using pseudo-inverse.")
            # Use pseudo-inverse if matrix is singular
            A_inv = np.linalg.pinv(A)
            lambda_bl = np.dot(A_inv, B)
            posterior_returns = implied_returns - np.dot(np.dot(self.cov_matrix, P.T), lambda_bl)
        
        # Store original mean returns
        original_mean_returns = self.mean_returns.copy()
        
        # Temporarily replace mean returns with posterior returns
        self.mean_returns = pd.Series(posterior_returns, index=self.assets)
        
        # Optimize portfolio using mean-variance optimization
        result = self.optimize_sharpe_ratio(bounds, constraints)
        
        # Restore original mean returns
        self.mean_returns = original_mean_returns
        
        # Add Black-Litterman specific information to result
        result['implied_returns'] = pd.Series(implied_returns, index=self.assets)
        result['posterior_returns'] = pd.Series(posterior_returns, index=self.assets)
        result['views'] = views
        result['view_confidences'] = view_confidences
        
        return result
    
    def optimize_hierarchical_risk_parity(self, 
                                         correlation_method: str = 'pearson',
                                         linkage_method: str = 'single') -> Dict[str, Any]:
        """
        Optimize portfolio using Hierarchical Risk Parity approach.
        
        Args:
            correlation_method: Method to calculate correlation ('pearson', 'kendall', 'spearman')
            linkage_method: Linkage method for hierarchical clustering ('single', 'complete', 'average', 'weighted')
            
        Returns:
            Dictionary containing optimized weights and metrics
        """
        try:
            from scipy.cluster.hierarchy import linkage, dendrogram
            from scipy.spatial.distance import squareform
        except ImportError:
            self.logger.error("scipy.cluster.hierarchy is required for hierarchical risk parity")
            raise ImportError("scipy.cluster.hierarchy is required for hierarchical risk parity")
        
        # Calculate correlation matrix
        corr = self.returns.corr(method=correlation_method)
        
        # Convert correlation to distance matrix
        distance = np.sqrt(0.5 * (1 - corr))
        
        # Perform hierarchical clustering
        dist_condensed = squareform(distance)
        link = linkage(dist_condensed, method=linkage_method)
        
        # Get quasi-diagonalization order
        sorted_indices = self._get_quasi_diag(link)
        sorted_assets = [self.assets[i] for i in sorted_indices]
        
        # Compute HRP weights
        weights = self._get_hrp_weights(sorted_indices)
        
        # Calculate metrics for optimized portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(weights)
        
        # Create result dictionary
        optimization_result = {
            'weights': pd.Series(weights, index=self.assets),
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'sorted_assets': sorted_assets,
            'metrics': metrics
        }
        
        return optimization_result
    
    def _get_quasi_diag(self, link):
        """
        Compute quasi-diagonal ordering of assets based on hierarchical clustering.
        
        Args:
            link: Linkage matrix from hierarchical clustering
            
        Returns:
            List of asset indices in quasi-diagonal order
        """
        # Number of assets
        n = self.num_assets
        
        # Initialize ordered list
        ordered_list = []
        
        # Cluster label count
        cluster_labels = [i for i in range(n)]
        
        # For each linkage step
        for i in range(n - 1):
            # Get clusters being merged
            c1 = int(link[i, 0])
            c2 = int(link[i, 1])
            
            # Get all assets in each cluster
            c1_assets = [j for j, x in enumerate(cluster_labels) if x == c1]
            c2_assets = [j for j, x in enumerate(cluster_labels) if x == c2]
            
            # Add to ordered list
            ordered_list.append(c1_assets + c2_assets)
            
            # Update cluster labels
            for j in range(n):
                if cluster_labels[j] == c2:
                    cluster_labels[j] = c1
        
        # Flatten ordered list
        ordered_list = [item for sublist in ordered_list for item in sublist]
        
        # Return unique elements in order of appearance
        return list(dict.fromkeys(ordered_list))
    
    def _get_hrp_weights(self, sorted_indices):
        """
        Compute HRP weights given the quasi-diagonal ordering of assets.
        
        Args:
            sorted_indices: List of asset indices in quasi-diagonal order
            
        Returns:
            Array of HRP weights
        """
        # Initialize weights
        weights = np.ones(self.num_assets)
        
        # Get covariance matrix
        cov = self.cov_matrix.values
        
        # Get variance vector
        var = np.diag(cov)
        
        # Sort variance and covariance
        sorted_var = var[sorted_indices]
        sorted_cov = cov[sorted_indices][:, sorted_indices]
        
        # Compute cluster variance at each level
        clusters = [sorted_indices]  # Start with all assets in one cluster
        while len(clusters) < self.num_assets:
            # Find cluster with highest variance
            cluster_var = [np.sum(sorted_var[c]) for c in clusters]
            i = np.argmax(cluster_var)
            
            # Split cluster
            cluster = clusters[i]
            if len(cluster) > 1:
                # Find split point (minimize intra-cluster correlation)
                n = len(cluster)
                split_point = n // 2
                clusters.pop(i)
                clusters.append(cluster[:split_point])
                clusters.append(cluster[split_point:])
            else:
                break
        
        # Compute inverse variance weights within each cluster
        for cluster in clusters:
            if len(cluster) > 0:
                # Get inverse variance
                inv_var = 1 / sorted_var[cluster]
                # Normalize to sum to 1
                cluster_weight = inv_var / np.sum(inv_var)
                # Assign weights
                weights[cluster] = cluster_weight
        
        # Reorder weights to original asset order
        reordered_weights = np.zeros(self.num_assets)
        for i, idx in enumerate(sorted_indices):
            reordered_weights[idx] = weights[i]
        
        return reordered_weights
    
    def optimize_minimum_cvar(self,
                             confidence_level: float = 0.95,
                             bounds: Optional[Tuple[float, float]] = (0, 1),
                             constraints: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Optimize portfolio for minimum Conditional Value at Risk (CVaR).
        
        Args:
            confidence_level: Confidence level for CVaR calculation
            bounds: Tuple of (min_weight, max_weight) for each asset
            constraints: List of additional constraints
            
        Returns:
            Dictionary containing optimized weights and metrics
        """
        # Define objective function to minimize (CVaR)
        def objective(weights):
            return self.risk_metrics.calculate_conditional_value_at_risk(weights, confidence_level)
        
        # Initial guess (equal weights)
        initial_weights = np.ones(self.num_assets) / self.num_assets
        
        # Define bounds
        if bounds:
            bounds_tuple = tuple(bounds for _ in range(self.num_assets))
        else:
            bounds_tuple = tuple((0, 1) for _ in range(self.num_assets))
        
        # Define constraints
        constraint_list = []
        
        # Add weights sum to 1 constraint
        weights_sum_to_1 = {'type': 'eq', 'fun': lambda weights: np.sum(weights) - 1}
        constraint_list.append(weights_sum_to_1)
        
        # Add additional constraints if provided
        if constraints:
            constraint_list.extend(constraints)
        
        # Run optimization
        result = optimize.minimize(
            objective,
            initial_weights,
            method='SLSQP',
            bounds=bounds_tuple,
            constraints=constraint_list
        )
        
        # Check if optimization was successful
        if not result['success']:
            self.logger.warning(f"Minimum CVaR optimization failed: {result['message']}")
        
        # Get optimized weights
        optimized_weights = result['x']
        
        # Calculate metrics for optimized portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(optimized_weights)
        
        # Calculate CVaR
        cvar = self.risk_metrics.calculate_conditional_value_at_risk(optimized_weights, confidence_level)
        
        # Create result dictionary
        optimization_result = {
            'weights': pd.Series(optimized_weights, index=self.assets),
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'cvar': cvar,
            'confidence_level': confidence_level,
            'metrics': metrics
        }
        
        return optimization_result
    
    def optimize_equal_weight(self) -> Dict[str, Any]:
        """
        Create an equal-weighted portfolio.
        
        Returns:
            Dictionary containing portfolio weights and metrics
        """
        # Equal weights
        weights = np.ones(self.num_assets) / self.num_assets
        
        # Calculate metrics for equal-weighted portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(weights)
        
        # Create result dictionary
        optimization_result = {
            'weights': pd.Series(weights, index=self.assets),
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'metrics': metrics
        }
        
        return optimization_result
    
    def optimize_inverse_volatility(self) -> Dict[str, Any]:
        """
        Create an inverse volatility weighted portfolio.
        
        Returns:
            Dictionary containing portfolio weights and metrics
        """
        # Calculate inverse volatility
        inv_vol = 1 / self.std_dev
        
        # Normalize to sum to 1
        weights = inv_vol / np.sum(inv_vol)
        
        # Calculate metrics for inverse volatility portfolio
        metrics = self.risk_metrics.calculate_risk_metrics_summary(weights)
        
        # Create result dictionary
        optimization_result = {
            'weights': pd.Series(weights, index=self.assets),
            'expected_return': metrics['expected_return'],
            'volatility': metrics['volatility'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'metrics': metrics
        }
        
        return optimization_result
    
    def optimize_with_transaction_costs(self,
                                    current_weights: pd.Series,
                                    optimization_method: str = 'maximum_sharpe',
                                    transaction_cost_model: Optional[TransactionCostModel] = None,
                                    max_turnover: Optional[float] = None,
                                    bounds: Optional[Tuple[float, float]] = (0, 1),
                                    constraints: Optional[List[Dict[str, Any]]] = None,
                                    target_return: Optional[float] = None,
                                    target_volatility: Optional[float] = None) -> Dict[str, Any]:
        """
        Optimize a portfolio considering transaction costs and turnover constraints.
        
        Args:
            current_weights: Current portfolio weights
            optimization_method: Optimization method to use
            transaction_cost_model: Transaction cost model to use
            max_turnover: Maximum allowed turnover (sum of absolute weight changes)
            bounds: Bounds for portfolio weights (min, max)
            constraints: Additional optimization constraints
            target_return: Target portfolio return (for minimum volatility with target return)
            target_volatility: Target portfolio volatility (for maximum return with target volatility)
            
        Returns:
            Dictionary with optimization results
        """
        self.logger.info(f"Optimizing portfolio with transaction costs using {optimization_method} method")
        
        # Create default transaction cost model if not provided
        if transaction_cost_model is None:
            transaction_cost_model = FixedRateModel(rate=0.001)
        
        # Ensure current weights are properly aligned with assets
        if not isinstance(current_weights, pd.Series):
            current_weights = pd.Series(current_weights)
        
        # Align current weights with assets in returns data
        aligned_weights = pd.Series(0.0, index=self.assets)
        for asset in current_weights.index:
            if asset in aligned_weights.index:
                aligned_weights[asset] = current_weights[asset]
        
        # Normalize weights to sum to 1
        if aligned_weights.sum() > 0:
            aligned_weights = aligned_weights / aligned_weights.sum()
        
        # Define the objective function that includes transaction costs
        def objective_with_costs(weights):
            # Convert weights to Series for easier handling
            weights_series = pd.Series(weights, index=self.assets)
            
            # Calculate trades (weight changes)
            trades = weights_series - aligned_weights
            
            # Estimate transaction costs
            # For simplicity, we use price=1 for all assets
            prices = pd.Series(1.0, index=self.assets)
            costs = transaction_cost_model.estimate_costs(trades, prices)
            total_cost = costs.sum()
            
            # Calculate portfolio metrics
            expected_return = np.sum(weights * self.mean_returns)
            portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(self.cov_matrix, weights)))
            
            # Adjust return by transaction costs
            adjusted_return = expected_return - total_cost
            
            # Different objectives based on optimization method
            if optimization_method == 'maximum_sharpe':
                # Negative Sharpe ratio (we're minimizing)
                return -1 * (adjusted_return - self.risk_free_rate) / portfolio_volatility
            elif optimization_method == 'minimum_volatility':
                return portfolio_volatility
            elif optimization_method == 'maximum_return':
                # Negative return (we're minimizing)
                return -1 * adjusted_return
            else:
                raise ValueError(f"Unsupported optimization method: {optimization_method}")
        
        # Initial guess: current weights
        initial_weights = aligned_weights.values
        
        # Constraints
        opt_constraints = []
        
        # Weights sum to 1
        opt_constraints.append({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        
        # Maximum turnover constraint
        if max_turnover is not None:
            turnover_constraint = {
                'type': 'ineq',
                'fun': lambda x: max_turnover - np.sum(np.abs(x - aligned_weights.values))
            }
            opt_constraints.append(turnover_constraint)
        
        # Target return constraint
        if target_return is not None:
            return_constraint = {
                'type': 'eq',
                'fun': lambda x: np.sum(x * self.mean_returns) - target_return
            }
            opt_constraints.append(return_constraint)
        
        # Target volatility constraint
        if target_volatility is not None:
            vol_constraint = {
                'type': 'eq',
                'fun': lambda x: np.sqrt(np.dot(x.T, np.dot(self.cov_matrix, x))) - target_volatility
            }
            opt_constraints.append(vol_constraint)
        
        # Add any additional constraints
        if constraints:
            opt_constraints.extend(constraints)
        
        # Optimize
        result = optimize.minimize(
            objective_with_costs,
            initial_weights,
            method='SLSQP',
            bounds=bounds * self.num_assets,
            constraints=opt_constraints
        )
        
        if not result['success']:
            self.logger.warning(f"Optimization failed: {result['message']}")
        
        # Extract optimized weights
        optimized_weights = pd.Series(result['x'], index=self.assets)
        
        # Calculate trades
        trades = optimized_weights - aligned_weights
        
        # Calculate transaction costs
        prices = pd.Series(1.0, index=self.assets)
        costs = transaction_cost_model.estimate_costs(trades, prices)
        total_cost = costs.sum()
        
        # Calculate turnover
        turnover = np.sum(np.abs(trades))
        
        # Calculate portfolio metrics
        expected_return = np.sum(optimized_weights * self.mean_returns)
        adjusted_return = expected_return - total_cost
        portfolio_volatility = np.sqrt(np.dot(optimized_weights.T, np.dot(self.cov_matrix, optimized_weights)))
        sharpe_ratio = (adjusted_return - self.risk_free_rate) / portfolio_volatility
        
        # Calculate additional risk metrics
        metrics = self.risk_metrics.calculate_risk_metrics_summary(optimized_weights.values)
        
        return {
            'weights': optimized_weights,
            'current_weights': aligned_weights,
            'trades': trades,
            'turnover': turnover,
            'trade_costs': costs,
            'total_cost': total_cost,
            'expected_return': expected_return,
            'adjusted_return': adjusted_return,
            'volatility': portfolio_volatility,
            'sharpe_ratio': sharpe_ratio,
            'metrics': metrics
        }

    def compare_optimization_methods(self, 
                                    methods: List[str] = None,
                                    bounds: Optional[Tuple[float, float]] = (0, 1),
                                    constraints: Optional[List[Dict]] = None) -> pd.DataFrame:
        """
        Compare different portfolio optimization methods.
        
        Args:
            methods: List of optimization methods to compare
            bounds: Tuple of (min_weight, max_weight) for each asset
            constraints: List of additional constraints
            
        Returns:
            DataFrame comparing different optimization methods
        """
        # Default methods
        if methods is None:
            methods = [
                'equal_weight',
                'inverse_volatility',
                'minimum_volatility',
                'maximum_sharpe',
                'risk_parity',
                'maximum_diversification',
                'minimum_cvar',
                'hierarchical_risk_parity'
            ]
        
        # Initialize results list
        results = []
        
        # Run each optimization method
        for method in methods:
            try:
                if method == 'equal_weight':
                    result = self.optimize_equal_weight()
                elif method == 'inverse_volatility':
                    result = self.optimize_inverse_volatility()
                elif method == 'minimum_volatility':
                    result = self.optimize_minimum_volatility(bounds, constraints)
                elif method == 'maximum_sharpe':
                    result = self.optimize_sharpe_ratio(bounds, constraints)
                elif method == 'risk_parity':
                    result = self.optimize_risk_parity(bounds=bounds)
                elif method == 'maximum_diversification':
                    result = self.optimize_maximum_diversification(bounds, constraints)
                elif method == 'minimum_cvar':
                    result = self.optimize_minimum_cvar(bounds=bounds, constraints=constraints)
                elif method == 'hierarchical_risk_parity':
                    result = self.optimize_hierarchical_risk_parity()
                else:
                    self.logger.warning(f"Unknown optimization method: {method}")
                    continue
                
                # Extract key metrics
                method_result = {
                    'method': method,
                    'expected_return': result['expected_return'],
                    'volatility': result['volatility'],
                    'sharpe_ratio': result['sharpe_ratio']
                }
                
                # Add additional metrics if available
                if 'cvar' in result:
                    method_result['cvar'] = result['cvar']
                if 'diversification_ratio' in result:
                    method_result['diversification_ratio'] = result['diversification_ratio']
                if 'max_drawdown' in result['metrics']:
                    method_result['max_drawdown'] = result['metrics']['max_drawdown']
                
                # Add weights
                for asset, weight in result['weights'].items():
                    method_result[f'weight_{asset}'] = weight
                
                results.append(method_result)
            except Exception as e:
                self.logger.warning(f"Error in {method} optimization: {str(e)}")
        
        # Convert results to DataFrame
        comparison_df = pd.DataFrame(results)
        
        return comparison_df