"""
Financial Statement Analysis Module
This module provides tools for analyzing financial statements.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union, Tuple
import logging
from .financial_ratios import FinancialRatioCalculator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("financial_analysis")

class FinancialStatementAnalysis:
    """
    Class for analyzing financial statements.
    """
    
    def __init__(self):
        """
        Initialize the financial statement analysis.
        """
        self.ratio_calculator = FinancialRatioCalculator()
        self.logger = logger
    
    def analyze_income_statement(
        self,
        income_statement: Dict[str, Any],
        previous_income_statement: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze an income statement.
        
        Args:
            income_statement: Income statement data
            previous_income_statement: Previous period income statement (optional)
            
        Returns:
            Dictionary with analysis results
        """
        try:
            # Extract key metrics
            revenue = income_statement.get('revenue', 0)
            cost_of_revenue = income_statement.get('costOfRevenue', 0)
            gross_profit = income_statement.get('grossProfit', 0)
            operating_expenses = income_statement.get('operatingExpenses', 0)
            operating_income = income_statement.get('operatingIncome', 0)
            net_income = income_statement.get('netIncome', 0)
            ebitda = income_statement.get('ebitda', 0)
            
            # Calculate margins
            analysis = {}
            
            if revenue > 0:
                analysis['gross_margin'] = gross_profit / revenue
                analysis['operating_margin'] = operating_income / revenue
                analysis['net_margin'] = net_income / revenue
                analysis['ebitda_margin'] = ebitda / revenue
            else:
                analysis['gross_margin'] = None
                analysis['operating_margin'] = None
                analysis['net_margin'] = None
                analysis['ebitda_margin'] = None
            
            # Calculate expense ratios
            if revenue > 0:
                analysis['cogs_ratio'] = cost_of_revenue / revenue
                analysis['operating_expense_ratio'] = operating_expenses / revenue
            else:
                analysis['cogs_ratio'] = None
                analysis['operating_expense_ratio'] = None
            
            # Calculate year-over-year growth if previous data available
            if previous_income_statement:
                prev_revenue = previous_income_statement.get('revenue', 0)
                prev_gross_profit = previous_income_statement.get('grossProfit', 0)
                prev_operating_income = previous_income_statement.get('operatingIncome', 0)
                prev_net_income = previous_income_statement.get('netIncome', 0)
                prev_ebitda = previous_income_statement.get('ebitda', 0)
                
                # Calculate growth rates
                if prev_revenue > 0:
                    analysis['revenue_growth'] = (revenue - prev_revenue) / prev_revenue
                else:
                    analysis['revenue_growth'] = None
                
                if prev_gross_profit > 0:
                    analysis['gross_profit_growth'] = (gross_profit - prev_gross_profit) / prev_gross_profit
                else:
                    analysis['gross_profit_growth'] = None
                
                if prev_operating_income > 0:
                    analysis['operating_income_growth'] = (operating_income - prev_operating_income) / prev_operating_income
                else:
                    analysis['operating_income_growth'] = None
                
                if prev_net_income > 0:
                    analysis['net_income_growth'] = (net_income - prev_net_income) / prev_net_income
                else:
                    analysis['net_income_growth'] = None
                
                if prev_ebitda > 0:
                    analysis['ebitda_growth'] = (ebitda - prev_ebitda) / prev_ebitda
                else:
                    analysis['ebitda_growth'] = None
                
                # Calculate margin changes
                if prev_revenue > 0:
                    prev_gross_margin = prev_gross_profit / prev_revenue
                    prev_operating_margin = prev_operating_income / prev_revenue
                    prev_net_margin = prev_net_income / prev_revenue
                    prev_ebitda_margin = prev_ebitda / prev_revenue
                    
                    analysis['gross_margin_change'] = analysis['gross_margin'] - prev_gross_margin
                    analysis['operating_margin_change'] = analysis['operating_margin'] - prev_operating_margin
                    analysis['net_margin_change'] = analysis['net_margin'] - prev_net_margin
                    analysis['ebitda_margin_change'] = analysis['ebitda_margin'] - prev_ebitda_margin
            
            return analysis
        except Exception as e:
            self.logger.error(f"Error analyzing income statement: {e}")
            return {}
    
    def analyze_balance_sheet(
        self,
        balance_sheet: Dict[str, Any],
        previous_balance_sheet: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a balance sheet.
        
        Args:
            balance_sheet: Balance sheet data
            previous_balance_sheet: Previous period balance sheet (optional)
            
        Returns:
            Dictionary with analysis results
        """
        try:
            # Extract key metrics
            total_assets = balance_sheet.get('totalAssets', 0)
            current_assets = balance_sheet.get('currentAssets', 0)
            cash_and_equivalents = balance_sheet.get('cashAndCashEquivalents', 0)
            total_liabilities = balance_sheet.get('totalLiabilities', 0)
            current_liabilities = balance_sheet.get('currentLiabilities', 0)
            total_equity = balance_sheet.get('totalEquity', 0)
            long_term_debt = balance_sheet.get('longTermDebt', 0)
            
            # Calculate key ratios
            analysis = {}
            
            # Asset composition
            if total_assets > 0:
                analysis['current_assets_ratio'] = current_assets / total_assets
                analysis['cash_ratio'] = cash_and_equivalents / total_assets
            else:
                analysis['current_assets_ratio'] = None
                analysis['cash_ratio'] = None
            
            # Liability composition
            if total_liabilities > 0:
                analysis['current_liabilities_ratio'] = current_liabilities / total_liabilities
                analysis['long_term_debt_ratio'] = long_term_debt / total_liabilities
            else:
                analysis['current_liabilities_ratio'] = None
                analysis['long_term_debt_ratio'] = None
            
            # Debt and equity structure
            if total_assets > 0:
                analysis['debt_ratio'] = total_liabilities / total_assets
                analysis['equity_ratio'] = total_equity / total_assets
            else:
                analysis['debt_ratio'] = None
                analysis['equity_ratio'] = None
            
            if total_equity > 0:
                analysis['debt_to_equity'] = total_liabilities / total_equity
            else:
                analysis['debt_to_equity'] = None
            
            # Liquidity ratios
            if current_liabilities > 0:
                analysis['current_ratio'] = current_assets / current_liabilities
                analysis['quick_ratio'] = (current_assets - balance_sheet.get('inventory', 0)) / current_liabilities
                analysis['cash_to_current_liabilities'] = cash_and_equivalents / current_liabilities
            else:
                analysis['current_ratio'] = None
                analysis['quick_ratio'] = None
                analysis['cash_to_current_liabilities'] = None
            
            # Calculate year-over-year changes if previous data available
            if previous_balance_sheet:
                prev_total_assets = previous_balance_sheet.get('totalAssets', 0)
                prev_current_assets = previous_balance_sheet.get('currentAssets', 0)
                prev_cash_and_equivalents = previous_balance_sheet.get('cashAndCashEquivalents', 0)
                prev_total_liabilities = previous_balance_sheet.get('totalLiabilities', 0)
                prev_current_liabilities = previous_balance_sheet.get('currentLiabilities', 0)
                prev_total_equity = previous_balance_sheet.get('totalEquity', 0)
                prev_long_term_debt = previous_balance_sheet.get('longTermDebt', 0)
                
                # Calculate growth rates
                if prev_total_assets > 0:
                    analysis['total_assets_growth'] = (total_assets - prev_total_assets) / prev_total_assets
                else:
                    analysis['total_assets_growth'] = None
                
                if prev_current_assets > 0:
                    analysis['current_assets_growth'] = (current_assets - prev_current_assets) / prev_current_assets
                else:
                    analysis['current_assets_growth'] = None
                
                if prev_cash_and_equivalents > 0:
                    analysis['cash_growth'] = (cash_and_equivalents - prev_cash_and_equivalents) / prev_cash_and_equivalents
                else:
                    analysis['cash_growth'] = None
                
                if prev_total_liabilities > 0:
                    analysis['total_liabilities_growth'] = (total_liabilities - prev_total_liabilities) / prev_total_liabilities
                else:
                    analysis['total_liabilities_growth'] = None
                
                if prev_current_liabilities > 0:
                    analysis['current_liabilities_growth'] = (current_liabilities - prev_current_liabilities) / prev_current_liabilities
                else:
                    analysis['current_liabilities_growth'] = None
                
                if prev_total_equity > 0:
                    analysis['total_equity_growth'] = (total_equity - prev_total_equity) / prev_total_equity
                else:
                    analysis['total_equity_growth'] = None
                
                if prev_long_term_debt > 0:
                    analysis['long_term_debt_growth'] = (long_term_debt - prev_long_term_debt) / prev_long_term_debt
                else:
                    analysis['long_term_debt_growth'] = None
            
            return analysis
        except Exception as e:
            self.logger.error(f"Error analyzing balance sheet: {e}")
            return {}
    
    def analyze_cash_flow_statement(
        self,
        cash_flow_statement: Dict[str, Any],
        previous_cash_flow_statement: Optional[Dict[str, Any]] = None,
        income_statement: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a cash flow statement.
        
        Args:
            cash_flow_statement: Cash flow statement data
            previous_cash_flow_statement: Previous period cash flow statement (optional)
            income_statement: Income statement data (optional)
            
        Returns:
            Dictionary with analysis results
        """
        try:
            # Extract key metrics
            operating_cash_flow = cash_flow_statement.get('operatingCashFlow', 0)
            capital_expenditure = cash_flow_statement.get('capitalExpenditure', 0)
            free_cash_flow = cash_flow_statement.get('freeCashFlow', 0)
            
            # If free cash flow is not provided, calculate it
            if free_cash_flow == 0:
                free_cash_flow = operating_cash_flow + capital_expenditure  # Capital expenditure is typically negative
            
            investing_cash_flow = cash_flow_statement.get('investingCashFlow', 0)
            financing_cash_flow = cash_flow_statement.get('financingCashFlow', 0)
            
            # Calculate cash flow analysis
            analysis = {}
            
            # Cash flow composition
            total_cash_flow = operating_cash_flow + investing_cash_flow + financing_cash_flow
            
            if total_cash_flow != 0:
                analysis['operating_cash_flow_ratio'] = operating_cash_flow / abs(total_cash_flow)
                analysis['investing_cash_flow_ratio'] = investing_cash_flow / abs(total_cash_flow)
                analysis['financing_cash_flow_ratio'] = financing_cash_flow / abs(total_cash_flow)
            else:
                analysis['operating_cash_flow_ratio'] = None
                analysis['investing_cash_flow_ratio'] = None
                analysis['financing_cash_flow_ratio'] = None
            
            # Capital expenditure ratio
            if operating_cash_flow != 0:
                analysis['capex_to_operating_cash_flow'] = abs(capital_expenditure) / abs(operating_cash_flow)
            else:
                analysis['capex_to_operating_cash_flow'] = None
            
            # Free cash flow analysis
            analysis['free_cash_flow'] = free_cash_flow
            
            # Cash flow to income ratios (if income statement provided)
            if income_statement:
                net_income = income_statement.get('netIncome', 0)
                revenue = income_statement.get('revenue', 0)
                
                if net_income != 0:
                    analysis['operating_cash_flow_to_net_income'] = operating_cash_flow / net_income
                    analysis['free_cash_flow_to_net_income'] = free_cash_flow / net_income
                else:
                    analysis['operating_cash_flow_to_net_income'] = None
                    analysis['free_cash_flow_to_net_income'] = None
                
                if revenue != 0:
                    analysis['operating_cash_flow_to_revenue'] = operating_cash_flow / revenue
                    analysis['free_cash_flow_to_revenue'] = free_cash_flow / revenue
                else:
                    analysis['operating_cash_flow_to_revenue'] = None
                    analysis['free_cash_flow_to_revenue'] = None
            
            # Calculate year-over-year changes if previous data available
            if previous_cash_flow_statement:
                prev_operating_cash_flow = previous_cash_flow_statement.get('operatingCashFlow', 0)
                prev_capital_expenditure = previous_cash_flow_statement.get('capitalExpenditure', 0)
                prev_free_cash_flow = previous_cash_flow_statement.get('freeCashFlow', 0)
                
                # If previous free cash flow is not provided, calculate it
                if prev_free_cash_flow == 0:
                    prev_free_cash_flow = prev_operating_cash_flow + prev_capital_expenditure
                
                prev_investing_cash_flow = previous_cash_flow_statement.get('investingCashFlow', 0)
                prev_financing_cash_flow = previous_cash_flow_statement.get('financingCashFlow', 0)
                
                # Calculate growth rates
                if prev_operating_cash_flow != 0:
                    analysis['operating_cash_flow_growth'] = (operating_cash_flow - prev_operating_cash_flow) / abs(prev_operating_cash_flow)
                else:
                    analysis['operating_cash_flow_growth'] = None
                
                if prev_capital_expenditure != 0:
                    analysis['capital_expenditure_growth'] = (capital_expenditure - prev_capital_expenditure) / abs(prev_capital_expenditure)
                else:
                    analysis['capital_expenditure_growth'] = None
                
                if prev_free_cash_flow != 0:
                    analysis['free_cash_flow_growth'] = (free_cash_flow - prev_free_cash_flow) / abs(prev_free_cash_flow)
                else:
                    analysis['free_cash_flow_growth'] = None
            
            return analysis
        except Exception as e:
            self.logger.error(f"Error analyzing cash flow statement: {e}")
            return {}
    
    def analyze_financial_statements(
        self,
        current_period: Dict[str, Any],
        previous_period: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze all financial statements.
        
        Args:
            current_period: Current period financial data
            previous_period: Previous period financial data (optional)
            
        Returns:
            Dictionary with analysis results
        """
        try:
            # Extract financial statements
            income_statement = current_period.get('income_statement', {})
            balance_sheet = current_period.get('balance_sheet', {})
            cash_flow_statement = current_period.get('cash_flow_statement', {})
            
            previous_income_statement = previous_period.get('income_statement', {}) if previous_period else None
            previous_balance_sheet = previous_period.get('balance_sheet', {}) if previous_period else None
            previous_cash_flow_statement = previous_period.get('cash_flow_statement', {}) if previous_period else None
            
            # Analyze individual statements
            income_analysis = self.analyze_income_statement(income_statement, previous_income_statement)
            balance_sheet_analysis = self.analyze_balance_sheet(balance_sheet, previous_balance_sheet)
            cash_flow_analysis = self.analyze_cash_flow_statement(
                cash_flow_statement, previous_cash_flow_statement, income_statement
            )
            
            # Calculate financial ratios
            ratios = self.ratio_calculator.calculate_all_ratios(
                current_period, previous_period, current_period.get('market_data')
            )
            
            # Combine all analyses
            analysis_results = {
                'income_statement': income_analysis,
                'balance_sheet': balance_sheet_analysis,
                'cash_flow': cash_flow_analysis,
                'ratios': ratios
            }
            
            return analysis_results
        except Exception as e:
            self.logger.error(f"Error analyzing financial statements: {e}")
            return {}
    
    def analyze_financial_trends(
        self,
        historical_data: List[Dict[str, Any]],
        metrics: Optional[List[str]] = None
    ) -> Dict[str, pd.Series]:
        """
        Analyze trends in financial metrics over time.
        
        Args:
            historical_data: List of historical financial data
            metrics: List of metrics to analyze (optional)
            
        Returns:
            Dictionary of time series for each metric
        """
        try:
            # Default metrics if not specified
            if metrics is None:
                metrics = [
                    'revenue', 'gross_profit', 'operating_income', 'net_income', 'ebitda',
                    'total_assets', 'total_liabilities', 'total_equity',
                    'operating_cash_flow', 'free_cash_flow',
                    'gross_margin', 'operating_margin', 'net_margin',
                    'return_on_assets', 'return_on_equity',
                    'debt_to_equity', 'current_ratio'
                ]
            
            # Initialize results dictionary
            trend_data = {metric: [] for metric in metrics}
            dates = []
            
            # Extract data for each period
            for period_data in historical_data:
                # Get date
                date = period_data.get('date', None)
                if date is None:
                    # Try to get from income statement
                    income_statement = period_data.get('income_statement', {})
                    date = income_statement.get('date', None)
                
                if date is None:
                    # Skip if no date available
                    continue
                
                dates.append(date)
                
                # Extract metrics
                for metric in metrics:
                    value = None
                    
                    # Check income statement
                    income_statement = period_data.get('income_statement', {})
                    if metric in income_statement:
                        value = income_statement[metric]
                    
                    # Check balance sheet
                    if value is None:
                        balance_sheet = period_data.get('balance_sheet', {})
                        if metric in balance_sheet:
                            value = balance_sheet[metric]
                    
                    # Check cash flow statement
                    if value is None:
                        cash_flow_statement = period_data.get('cash_flow_statement', {})
                        if metric in cash_flow_statement:
                            value = cash_flow_statement[metric]
                    
                    # Check ratios
                    if value is None:
                        # Analyze the period to get ratios
                        analysis = self.analyze_financial_statements(period_data)
                        
                        # Check in different ratio categories
                        for category in ['liquidity', 'profitability', 'solvency', 'efficiency', 'valuation']:
                            if metric in analysis.get('ratios', {}).get(category, {}):
                                value = analysis['ratios'][category][metric]
                                break
                    
                    # Add to trend data
                    trend_data[metric].append(value)
            
            # Convert to pandas Series
            trend_series = {}
            for metric, values in trend_data.items():
                if values:  # Only include metrics with data
                    trend_series[metric] = pd.Series(values, index=dates)
            
            return trend_series
        except Exception as e:
            self.logger.error(f"Error analyzing financial trends: {e}")
            return {}
    
    def calculate_growth_rates(
        self,
        trend_data: Dict[str, pd.Series],
        periods: List[str] = ['YoY', '3Y', '5Y']
    ) -> Dict[str, Dict[str, float]]:
        """
        Calculate growth rates for financial metrics.
        
        Args:
            trend_data: Dictionary of time series for each metric
            periods: List of periods to calculate growth rates for
            
        Returns:
            Dictionary of growth rates for each metric and period
        """
        try:
            growth_rates = {}
            
            for metric, series in trend_data.items():
                # Sort series by date
                series = series.sort_index()
                
                # Skip if not enough data
                if len(series) < 2:
                    continue
                
                metric_growth = {}
                
                # Year-over-Year growth
                if 'YoY' in periods and len(series) >= 2:
                    latest = series.iloc[-1]
                    previous = series.iloc[-2]
                    
                    if previous != 0 and not pd.isna(previous) and not pd.isna(latest):
                        yoy_growth = (latest - previous) / abs(previous)
                        metric_growth['YoY'] = yoy_growth
                
                # 3-Year CAGR
                if '3Y' in periods and len(series) >= 4:
                    latest = series.iloc[-1]
                    three_years_ago = series.iloc[-4]
                    
                    if three_years_ago > 0 and not pd.isna(three_years_ago) and not pd.isna(latest):
                        cagr_3y = (latest / three_years_ago) ** (1/3) - 1
                        metric_growth['3Y'] = cagr_3y
                
                # 5-Year CAGR
                if '5Y' in periods and len(series) >= 6:
                    latest = series.iloc[-1]
                    five_years_ago = series.iloc[-6]
                    
                    if five_years_ago > 0 and not pd.isna(five_years_ago) and not pd.isna(latest):
                        cagr_5y = (latest / five_years_ago) ** (1/5) - 1
                        metric_growth['5Y'] = cagr_5y
                
                # Add to growth rates if we have data
                if metric_growth:
                    growth_rates[metric] = metric_growth
            
            return growth_rates
        except Exception as e:
            self.logger.error(f"Error calculating growth rates: {e}")
            return {}