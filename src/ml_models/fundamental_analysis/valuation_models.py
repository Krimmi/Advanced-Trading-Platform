"""
Valuation Models Module
This module provides classes and functions for company valuation.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("valuation_models")

class DCFValuationModel:
    """
    Discounted Cash Flow (DCF) valuation model.
    """
    
    def __init__(
        self,
        discount_rate: float = 0.1,
        terminal_growth_rate: float = 0.02,
        forecast_period: int = 5
    ):
        """
        Initialize the DCF valuation model.
        
        Args:
            discount_rate: Discount rate (WACC) to use for DCF calculation
            terminal_growth_rate: Terminal growth rate for perpetuity calculation
            forecast_period: Number of years to forecast cash flows
        """
        self.discount_rate = discount_rate
        self.terminal_growth_rate = terminal_growth_rate
        self.forecast_period = forecast_period
        self.logger = logger
    
    def calculate_free_cash_flow(
        self,
        financial_data: Dict[str, Any]
    ) -> float:
        """
        Calculate free cash flow from financial data.
        
        Args:
            financial_data: Financial data including income statement and cash flow statement
            
        Returns:
            Free cash flow value
        """
        try:
            # Try to get free cash flow directly if available
            cash_flow_statement = financial_data.get('cash_flow_statement', {})
            if 'freeCashFlow' in cash_flow_statement:
                return cash_flow_statement['freeCashFlow']
            
            # Otherwise, calculate it from components
            operating_cash_flow = cash_flow_statement.get('operatingCashFlow', 0)
            capital_expenditure = cash_flow_statement.get('capitalExpenditure', 0)
            
            # Capital expenditure is typically negative, so we add it
            free_cash_flow = operating_cash_flow + capital_expenditure
            
            return free_cash_flow
        except Exception as e:
            self.logger.error(f"Error calculating free cash flow: {e}")
            return 0
    
    def forecast_cash_flows(
        self,
        historical_data: List[Dict[str, Any]],
        growth_rates: Optional[List[float]] = None
    ) -> List[float]:
        """
        Forecast future cash flows based on historical data and growth rates.
        
        Args:
            historical_data: List of historical financial data
            growth_rates: List of growth rates for each forecast year (optional)
            
        Returns:
            List of forecasted cash flows
        """
        try:
            # Calculate the most recent free cash flow
            latest_data = historical_data[-1]
            base_fcf = self.calculate_free_cash_flow(latest_data)
            
            # If no growth rates provided, estimate from historical data
            if growth_rates is None:
                # Calculate historical FCF growth rates
                historical_fcfs = [self.calculate_free_cash_flow(data) for data in historical_data]
                
                # Filter out zero or negative values to avoid division issues
                valid_fcfs = [(i, fcf) for i, fcf in enumerate(historical_fcfs) if fcf > 0]
                
                if len(valid_fcfs) >= 2:
                    # Calculate year-over-year growth rates
                    growth_rates = []
                    for i in range(1, len(valid_fcfs)):
                        prev_idx, prev_fcf = valid_fcfs[i-1]
                        curr_idx, curr_fcf = valid_fcfs[i]
                        years_diff = curr_idx - prev_idx
                        if years_diff > 0:
                            # Annualized growth rate
                            annual_growth = (curr_fcf / prev_fcf) ** (1 / years_diff) - 1
                            growth_rates.append(annual_growth)
                    
                    # Use average growth rate if we have valid growth rates
                    if growth_rates:
                        avg_growth_rate = sum(growth_rates) / len(growth_rates)
                        growth_rates = [avg_growth_rate] * self.forecast_period
                    else:
                        # Default to a conservative growth rate
                        growth_rates = [0.03] * self.forecast_period
                else:
                    # Not enough valid data points, use default growth rate
                    growth_rates = [0.03] * self.forecast_period
            
            # Ensure we have enough growth rates for the forecast period
            if len(growth_rates) < self.forecast_period:
                # Extend with the last growth rate
                last_rate = growth_rates[-1]
                growth_rates.extend([last_rate] * (self.forecast_period - len(growth_rates)))
            
            # Forecast cash flows
            forecasted_cash_flows = []
            current_fcf = base_fcf
            
            for i in range(self.forecast_period):
                growth_rate = growth_rates[i]
                current_fcf = current_fcf * (1 + growth_rate)
                forecasted_cash_flows.append(current_fcf)
            
            return forecasted_cash_flows
        except Exception as e:
            self.logger.error(f"Error forecasting cash flows: {e}")
            return [0] * self.forecast_period
    
    def calculate_terminal_value(self, final_cash_flow: float) -> float:
        """
        Calculate terminal value using the perpetuity growth model.
        
        Args:
            final_cash_flow: Final year forecasted cash flow
            
        Returns:
            Terminal value
        """
        try:
            # Terminal value = FCF_t+1 / (WACC - g)
            # FCF_t+1 = FCF_t * (1 + g)
            next_year_cash_flow = final_cash_flow * (1 + self.terminal_growth_rate)
            terminal_value = next_year_cash_flow / (self.discount_rate - self.terminal_growth_rate)
            return terminal_value
        except Exception as e:
            self.logger.error(f"Error calculating terminal value: {e}")
            return 0
    
    def calculate_present_value(
        self,
        cash_flows: List[float],
        terminal_value: float
    ) -> Tuple[List[float], float, float]:
        """
        Calculate the present value of forecasted cash flows and terminal value.
        
        Args:
            cash_flows: List of forecasted cash flows
            terminal_value: Terminal value
            
        Returns:
            Tuple of (present values of cash flows, present value of terminal value, total present value)
        """
        try:
            # Calculate present value of each cash flow
            present_values = []
            for i, cf in enumerate(cash_flows):
                year = i + 1
                present_value = cf / ((1 + self.discount_rate) ** year)
                present_values.append(present_value)
            
            # Calculate present value of terminal value
            terminal_value_pv = terminal_value / ((1 + self.discount_rate) ** self.forecast_period)
            
            # Calculate total present value
            total_present_value = sum(present_values) + terminal_value_pv
            
            return present_values, terminal_value_pv, total_present_value
        except Exception as e:
            self.logger.error(f"Error calculating present values: {e}")
            return [], 0, 0
    
    def calculate_equity_value(
        self,
        enterprise_value: float,
        financial_data: Dict[str, Any]
    ) -> float:
        """
        Calculate equity value from enterprise value.
        
        Args:
            enterprise_value: Enterprise value
            financial_data: Financial data including balance sheet
            
        Returns:
            Equity value
        """
        try:
            balance_sheet = financial_data.get('balance_sheet', {})
            
            # Get debt and cash
            total_debt = balance_sheet.get('totalDebt', 0)
            if total_debt == 0:
                # Try to calculate from components
                long_term_debt = balance_sheet.get('longTermDebt', 0)
                short_term_debt = balance_sheet.get('shortTermDebt', 0)
                total_debt = long_term_debt + short_term_debt
            
            cash_and_equivalents = balance_sheet.get('cashAndCashEquivalents', 0)
            short_term_investments = balance_sheet.get('shortTermInvestments', 0)
            
            # Calculate equity value
            # Equity Value = Enterprise Value - Debt + Cash and Cash Equivalents
            equity_value = enterprise_value - total_debt + cash_and_equivalents + short_term_investments
            
            return equity_value
        except Exception as e:
            self.logger.error(f"Error calculating equity value: {e}")
            return enterprise_value
    
    def calculate_share_price(
        self,
        equity_value: float,
        financial_data: Dict[str, Any]
    ) -> float:
        """
        Calculate share price from equity value.
        
        Args:
            equity_value: Equity value
            financial_data: Financial data including shares outstanding
            
        Returns:
            Share price
        """
        try:
            # Get shares outstanding
            shares_outstanding = financial_data.get('shares_outstanding', 0)
            
            if shares_outstanding == 0:
                # Try to get from balance sheet
                balance_sheet = financial_data.get('balance_sheet', {})
                shares_outstanding = balance_sheet.get('commonStock', 0)
            
            if shares_outstanding == 0:
                # Try to get from market data
                market_data = financial_data.get('market_data', {})
                shares_outstanding = market_data.get('sharesOutstanding', 0)
            
            if shares_outstanding > 0:
                share_price = equity_value / shares_outstanding
                return share_price
            else:
                self.logger.warning("Shares outstanding is zero or not available")
                return 0
        except Exception as e:
            self.logger.error(f"Error calculating share price: {e}")
            return 0
    
    def value_company(
        self,
        historical_data: List[Dict[str, Any]],
        growth_rates: Optional[List[float]] = None,
        discount_rate: Optional[float] = None,
        terminal_growth_rate: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Perform DCF valuation for a company.
        
        Args:
            historical_data: List of historical financial data
            growth_rates: List of growth rates for each forecast year (optional)
            discount_rate: Discount rate to override the default (optional)
            terminal_growth_rate: Terminal growth rate to override the default (optional)
            
        Returns:
            Dictionary with valuation results
        """
        try:
            # Use provided rates if available, otherwise use defaults
            if discount_rate is not None:
                self.discount_rate = discount_rate
            
            if terminal_growth_rate is not None:
                self.terminal_growth_rate = terminal_growth_rate
            
            # Get the most recent financial data
            latest_data = historical_data[-1]
            
            # Forecast cash flows
            forecasted_cash_flows = self.forecast_cash_flows(historical_data, growth_rates)
            
            # Calculate terminal value
            terminal_value = self.calculate_terminal_value(forecasted_cash_flows[-1])
            
            # Calculate present values
            present_values, terminal_value_pv, enterprise_value = self.calculate_present_value(
                forecasted_cash_flows, terminal_value
            )
            
            # Calculate equity value
            equity_value = self.calculate_equity_value(enterprise_value, latest_data)
            
            # Calculate share price
            share_price = self.calculate_share_price(equity_value, latest_data)
            
            # Create valuation result
            valuation_result = {
                'forecasted_cash_flows': forecasted_cash_flows,
                'present_values': present_values,
                'terminal_value': terminal_value,
                'terminal_value_pv': terminal_value_pv,
                'enterprise_value': enterprise_value,
                'equity_value': equity_value,
                'share_price': share_price,
                'discount_rate': self.discount_rate,
                'terminal_growth_rate': self.terminal_growth_rate,
                'forecast_period': self.forecast_period
            }
            
            return valuation_result
        except Exception as e:
            self.logger.error(f"Error performing DCF valuation: {e}")
            return {
                'error': str(e),
                'enterprise_value': 0,
                'equity_value': 0,
                'share_price': 0
            }


class ComparableCompanyAnalysis:
    """
    Comparable Company Analysis (CCA) valuation model.
    """
    
    def __init__(self):
        """
        Initialize the CCA valuation model.
        """
        self.logger = logger
    
    def calculate_multiples(
        self,
        company_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """
        Calculate valuation multiples for a company.
        
        Args:
            company_data: Company financial and market data
            
        Returns:
            Dictionary of valuation multiples
        """
        try:
            # Extract required data
            income_statement = company_data.get('income_statement', {})
            balance_sheet = company_data.get('balance_sheet', {})
            market_data = company_data.get('market_data', {})
            
            # Get financial metrics
            revenue = income_statement.get('revenue', 0)
            ebitda = income_statement.get('ebitda', 0)
            ebit = income_statement.get('operatingIncome', 0)
            net_income = income_statement.get('netIncome', 0)
            total_assets = balance_sheet.get('totalAssets', 0)
            book_value = balance_sheet.get('totalEquity', 0)
            
            # Get market metrics
            market_cap = market_data.get('marketCap', 0)
            enterprise_value = market_data.get('enterpriseValue', 0)
            
            # If enterprise value is not provided, calculate it
            if enterprise_value == 0 and market_cap > 0:
                total_debt = balance_sheet.get('totalDebt', 0)
                if total_debt == 0:
                    # Try to calculate from components
                    long_term_debt = balance_sheet.get('longTermDebt', 0)
                    short_term_debt = balance_sheet.get('shortTermDebt', 0)
                    total_debt = long_term_debt + short_term_debt
                
                cash_and_equivalents = balance_sheet.get('cashAndCashEquivalents', 0)
                short_term_investments = balance_sheet.get('shortTermInvestments', 0)
                
                enterprise_value = market_cap + total_debt - cash_and_equivalents - short_term_investments
            
            # Calculate multiples
            multiples = {}
            
            # Price multiples
            if market_cap > 0:
                if revenue > 0:
                    multiples['price_to_sales'] = market_cap / revenue
                
                if net_income > 0:
                    multiples['price_to_earnings'] = market_cap / net_income
                
                if book_value > 0:
                    multiples['price_to_book'] = market_cap / book_value
            
            # Enterprise value multiples
            if enterprise_value > 0:
                if revenue > 0:
                    multiples['ev_to_revenue'] = enterprise_value / revenue
                
                if ebitda > 0:
                    multiples['ev_to_ebitda'] = enterprise_value / ebitda
                
                if ebit > 0:
                    multiples['ev_to_ebit'] = enterprise_value / ebit
            
            return multiples
        except Exception as e:
            self.logger.error(f"Error calculating multiples: {e}")
            return {}
    
    def value_company_using_multiples(
        self,
        target_company: Dict[str, Any],
        comparable_companies: List[Dict[str, Any]],
        multiples_to_use: List[str] = None
    ) -> Dict[str, Any]:
        """
        Value a company using multiples from comparable companies.
        
        Args:
            target_company: Target company financial data
            comparable_companies: List of comparable companies data
            multiples_to_use: List of multiples to use for valuation
            
        Returns:
            Dictionary with valuation results
        """
        try:
            # Default multiples to use if not specified
            if multiples_to_use is None:
                multiples_to_use = [
                    'price_to_earnings',
                    'price_to_sales',
                    'price_to_book',
                    'ev_to_ebitda',
                    'ev_to_revenue'
                ]
            
            # Calculate multiples for comparable companies
            comparable_multiples = {}
            for company in comparable_companies:
                company_multiples = self.calculate_multiples(company)
                
                # Add valid multiples to the collection
                for multiple in multiples_to_use:
                    if multiple in company_multiples:
                        if multiple not in comparable_multiples:
                            comparable_multiples[multiple] = []
                        
                        comparable_multiples[multiple].append(company_multiples[multiple])
            
            # Calculate average multiples
            average_multiples = {}
            median_multiples = {}
            
            for multiple, values in comparable_multiples.items():
                if values:
                    # Remove outliers (values outside 1.5 * IQR)
                    q1 = np.percentile(values, 25)
                    q3 = np.percentile(values, 75)
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    
                    filtered_values = [v for v in values if lower_bound <= v <= upper_bound]
                    
                    if filtered_values:
                        average_multiples[multiple] = sum(filtered_values) / len(filtered_values)
                        median_multiples[multiple] = np.median(filtered_values)
            
            # Extract target company metrics
            income_statement = target_company.get('income_statement', {})
            balance_sheet = target_company.get('balance_sheet', {})
            
            revenue = income_statement.get('revenue', 0)
            ebitda = income_statement.get('ebitda', 0)
            ebit = income_statement.get('operatingIncome', 0)
            net_income = income_statement.get('netIncome', 0)
            book_value = balance_sheet.get('totalEquity', 0)
            
            # Calculate implied values using average multiples
            implied_values_avg = {}
            
            if 'price_to_earnings' in average_multiples and net_income > 0:
                implied_values_avg['price_to_earnings'] = average_multiples['price_to_earnings'] * net_income
            
            if 'price_to_sales' in average_multiples and revenue > 0:
                implied_values_avg['price_to_sales'] = average_multiples['price_to_sales'] * revenue
            
            if 'price_to_book' in average_multiples and book_value > 0:
                implied_values_avg['price_to_book'] = average_multiples['price_to_book'] * book_value
            
            if 'ev_to_ebitda' in average_multiples and ebitda > 0:
                implied_values_avg['ev_to_ebitda'] = average_multiples['ev_to_ebitda'] * ebitda
            
            if 'ev_to_revenue' in average_multiples and revenue > 0:
                implied_values_avg['ev_to_revenue'] = average_multiples['ev_to_revenue'] * revenue
            
            # Calculate implied values using median multiples
            implied_values_median = {}
            
            if 'price_to_earnings' in median_multiples and net_income > 0:
                implied_values_median['price_to_earnings'] = median_multiples['price_to_earnings'] * net_income
            
            if 'price_to_sales' in median_multiples and revenue > 0:
                implied_values_median['price_to_sales'] = median_multiples['price_to_sales'] * revenue
            
            if 'price_to_book' in median_multiples and book_value > 0:
                implied_values_median['price_to_book'] = median_multiples['price_to_book'] * book_value
            
            if 'ev_to_ebitda' in median_multiples and ebitda > 0:
                implied_values_median['ev_to_ebitda'] = median_multiples['ev_to_ebitda'] * ebitda
            
            if 'ev_to_revenue' in median_multiples and revenue > 0:
                implied_values_median['ev_to_revenue'] = median_multiples['ev_to_revenue'] * revenue
            
            # Calculate average implied values
            avg_implied_equity_value = 0
            median_implied_equity_value = 0
            
            # Adjust EV multiples to equity value
            total_debt = balance_sheet.get('totalDebt', 0)
            if total_debt == 0:
                # Try to calculate from components
                long_term_debt = balance_sheet.get('longTermDebt', 0)
                short_term_debt = balance_sheet.get('shortTermDebt', 0)
                total_debt = long_term_debt + short_term_debt
            
            cash_and_equivalents = balance_sheet.get('cashAndCashEquivalents', 0)
            short_term_investments = balance_sheet.get('shortTermInvestments', 0)
            net_cash = cash_and_equivalents + short_term_investments - total_debt
            
            # Count valid multiples
            count_avg = 0
            count_median = 0
            
            for multiple, value in implied_values_avg.items():
                if multiple.startswith('ev_'):
                    # Convert EV to equity value
                    implied_values_avg[multiple] += net_cash
                
                avg_implied_equity_value += implied_values_avg[multiple]
                count_avg += 1
            
            for multiple, value in implied_values_median.items():
                if multiple.startswith('ev_'):
                    # Convert EV to equity value
                    implied_values_median[multiple] += net_cash
                
                median_implied_equity_value += implied_values_median[multiple]
                count_median += 1
            
            if count_avg > 0:
                avg_implied_equity_value /= count_avg
            
            if count_median > 0:
                median_implied_equity_value /= count_median
            
            # Calculate share price
            shares_outstanding = target_company.get('shares_outstanding', 0)
            
            if shares_outstanding == 0:
                # Try to get from balance sheet
                shares_outstanding = balance_sheet.get('commonStock', 0)
            
            if shares_outstanding == 0:
                # Try to get from market data
                market_data = target_company.get('market_data', {})
                shares_outstanding = market_data.get('sharesOutstanding', 0)
            
            avg_share_price = 0
            median_share_price = 0
            
            if shares_outstanding > 0:
                avg_share_price = avg_implied_equity_value / shares_outstanding
                median_share_price = median_implied_equity_value / shares_outstanding
            
            # Create valuation result
            valuation_result = {
                'average_multiples': average_multiples,
                'median_multiples': median_multiples,
                'implied_values_avg': implied_values_avg,
                'implied_values_median': implied_values_median,
                'avg_implied_equity_value': avg_implied_equity_value,
                'median_implied_equity_value': median_implied_equity_value,
                'avg_share_price': avg_share_price,
                'median_share_price': median_share_price
            }
            
            return valuation_result
        except Exception as e:
            self.logger.error(f"Error performing CCA valuation: {e}")
            return {
                'error': str(e),
                'avg_implied_equity_value': 0,
                'median_implied_equity_value': 0,
                'avg_share_price': 0,
                'median_share_price': 0
            }


class ValuationService:
    """
    Service for company valuation using multiple methods.
    """
    
    def __init__(self):
        """
        Initialize the valuation service.
        """
        self.dcf_model = DCFValuationModel()
        self.cca_model = ComparableCompanyAnalysis()
        self.logger = logger
    
    def value_company(
        self,
        target_company: Dict[str, Any],
        historical_data: List[Dict[str, Any]],
        comparable_companies: Optional[List[Dict[str, Any]]] = None,
        methods: List[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Value a company using multiple methods.
        
        Args:
            target_company: Target company financial data
            historical_data: List of historical financial data
            comparable_companies: List of comparable companies data (optional)
            methods: List of valuation methods to use
            **kwargs: Additional parameters for valuation methods
            
        Returns:
            Dictionary with valuation results
        """
        try:
            # Default methods if not specified
            if methods is None:
                methods = ['dcf']
                if comparable_companies:
                    methods.append('cca')
            
            valuation_results = {}
            
            # Perform DCF valuation if requested
            if 'dcf' in methods:
                dcf_result = self.dcf_model.value_company(
                    historical_data,
                    growth_rates=kwargs.get('growth_rates'),
                    discount_rate=kwargs.get('discount_rate'),
                    terminal_growth_rate=kwargs.get('terminal_growth_rate')
                )
                valuation_results['dcf'] = dcf_result
            
            # Perform CCA valuation if requested and comparable companies provided
            if 'cca' in methods and comparable_companies:
                cca_result = self.cca_model.value_company_using_multiples(
                    target_company,
                    comparable_companies,
                    multiples_to_use=kwargs.get('multiples_to_use')
                )
                valuation_results['cca'] = cca_result
            
            # Calculate consensus valuation
            consensus_equity_value = 0
            consensus_share_price = 0
            count = 0
            
            if 'dcf' in valuation_results:
                consensus_equity_value += valuation_results['dcf']['equity_value']
                consensus_share_price += valuation_results['dcf']['share_price']
                count += 1
            
            if 'cca' in valuation_results:
                consensus_equity_value += valuation_results['cca']['avg_implied_equity_value']
                consensus_share_price += valuation_results['cca']['avg_share_price']
                count += 1
            
            if count > 0:
                consensus_equity_value /= count
                consensus_share_price /= count
            
            # Add consensus to results
            valuation_results['consensus'] = {
                'equity_value': consensus_equity_value,
                'share_price': consensus_share_price
            }
            
            return valuation_results
        except Exception as e:
            self.logger.error(f"Error performing company valuation: {e}")
            return {
                'error': str(e),
                'consensus': {
                    'equity_value': 0,
                    'share_price': 0
                }
            }