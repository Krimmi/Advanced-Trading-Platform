"""
Financial Ratios Module
This module provides functions for calculating financial ratios from financial statement data.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union, Tuple

class FinancialRatioCalculator:
    """
    Class for calculating financial ratios from financial statement data.
    """
    
    @staticmethod
    def calculate_liquidity_ratios(
        balance_sheet: Dict[str, Any],
        income_statement: Optional[Dict[str, Any]] = None
    ) -> Dict[str, float]:
        """
        Calculate liquidity ratios.
        
        Args:
            balance_sheet: Balance sheet data
            income_statement: Income statement data (optional)
            
        Returns:
            Dictionary of liquidity ratios
        """
        try:
            # Extract required values from balance sheet
            current_assets = balance_sheet.get('currentAssets', 0)
            current_liabilities = balance_sheet.get('currentLiabilities', 0)
            cash_and_equivalents = balance_sheet.get('cashAndCashEquivalents', 0)
            short_term_investments = balance_sheet.get('shortTermInvestments', 0)
            inventory = balance_sheet.get('inventory', 0)
            
            # Calculate ratios
            ratios = {}
            
            # Current ratio
            if current_liabilities and current_liabilities > 0:
                ratios['current_ratio'] = current_assets / current_liabilities
            else:
                ratios['current_ratio'] = None
            
            # Quick ratio (Acid-test ratio)
            if current_liabilities and current_liabilities > 0:
                quick_assets = current_assets - inventory
                ratios['quick_ratio'] = quick_assets / current_liabilities
            else:
                ratios['quick_ratio'] = None
            
            # Cash ratio
            if current_liabilities and current_liabilities > 0:
                cash_and_equivalents_total = cash_and_equivalents + short_term_investments
                ratios['cash_ratio'] = cash_and_equivalents_total / current_liabilities
            else:
                ratios['cash_ratio'] = None
            
            # Working capital
            ratios['working_capital'] = current_assets - current_liabilities
            
            return ratios
        except Exception as e:
            print(f"Error calculating liquidity ratios: {e}")
            return {}
    
    @staticmethod
    def calculate_profitability_ratios(
        income_statement: Dict[str, Any],
        balance_sheet: Optional[Dict[str, Any]] = None
    ) -> Dict[str, float]:
        """
        Calculate profitability ratios.
        
        Args:
            income_statement: Income statement data
            balance_sheet: Balance sheet data (optional)
            
        Returns:
            Dictionary of profitability ratios
        """
        try:
            # Extract required values from income statement
            revenue = income_statement.get('revenue', 0)
            gross_profit = income_statement.get('grossProfit', 0)
            operating_income = income_statement.get('operatingIncome', 0)
            net_income = income_statement.get('netIncome', 0)
            ebitda = income_statement.get('ebitda', 0)
            
            # Calculate ratios
            ratios = {}
            
            # Gross profit margin
            if revenue and revenue > 0:
                ratios['gross_profit_margin'] = gross_profit / revenue
            else:
                ratios['gross_profit_margin'] = None
            
            # Operating profit margin
            if revenue and revenue > 0:
                ratios['operating_profit_margin'] = operating_income / revenue
            else:
                ratios['operating_profit_margin'] = None
            
            # Net profit margin
            if revenue and revenue > 0:
                ratios['net_profit_margin'] = net_income / revenue
            else:
                ratios['net_profit_margin'] = None
            
            # EBITDA margin
            if revenue and revenue > 0:
                ratios['ebitda_margin'] = ebitda / revenue
            else:
                ratios['ebitda_margin'] = None
            
            # Return on assets (ROA) and Return on equity (ROE)
            if balance_sheet:
                total_assets = balance_sheet.get('totalAssets', 0)
                total_equity = balance_sheet.get('totalEquity', 0)
                
                if total_assets and total_assets > 0:
                    ratios['return_on_assets'] = net_income / total_assets
                else:
                    ratios['return_on_assets'] = None
                
                if total_equity and total_equity > 0:
                    ratios['return_on_equity'] = net_income / total_equity
                else:
                    ratios['return_on_equity'] = None
            
            return ratios
        except Exception as e:
            print(f"Error calculating profitability ratios: {e}")
            return {}
    
    @staticmethod
    def calculate_solvency_ratios(
        balance_sheet: Dict[str, Any],
        income_statement: Optional[Dict[str, Any]] = None
    ) -> Dict[str, float]:
        """
        Calculate solvency ratios.
        
        Args:
            balance_sheet: Balance sheet data
            income_statement: Income statement data (optional)
            
        Returns:
            Dictionary of solvency ratios
        """
        try:
            # Extract required values from balance sheet
            total_assets = balance_sheet.get('totalAssets', 0)
            total_liabilities = balance_sheet.get('totalLiabilities', 0)
            total_equity = balance_sheet.get('totalEquity', 0)
            long_term_debt = balance_sheet.get('longTermDebt', 0)
            
            # Calculate ratios
            ratios = {}
            
            # Debt ratio
            if total_assets and total_assets > 0:
                ratios['debt_ratio'] = total_liabilities / total_assets
            else:
                ratios['debt_ratio'] = None
            
            # Debt-to-equity ratio
            if total_equity and total_equity > 0:
                ratios['debt_to_equity'] = total_liabilities / total_equity
            else:
                ratios['debt_to_equity'] = None
            
            # Long-term debt to equity
            if total_equity and total_equity > 0:
                ratios['long_term_debt_to_equity'] = long_term_debt / total_equity
            else:
                ratios['long_term_debt_to_equity'] = None
            
            # Equity multiplier
            if total_equity and total_equity > 0:
                ratios['equity_multiplier'] = total_assets / total_equity
            else:
                ratios['equity_multiplier'] = None
            
            # Interest coverage ratio
            if income_statement:
                operating_income = income_statement.get('operatingIncome', 0)
                interest_expense = income_statement.get('interestExpense', 0)
                
                if interest_expense and interest_expense != 0:
                    ratios['interest_coverage'] = operating_income / abs(interest_expense)
                else:
                    ratios['interest_coverage'] = None
            
            return ratios
        except Exception as e:
            print(f"Error calculating solvency ratios: {e}")
            return {}
    
    @staticmethod
    def calculate_efficiency_ratios(
        income_statement: Dict[str, Any],
        balance_sheet: Dict[str, Any],
        previous_balance_sheet: Optional[Dict[str, Any]] = None
    ) -> Dict[str, float]:
        """
        Calculate efficiency ratios.
        
        Args:
            income_statement: Income statement data
            balance_sheet: Balance sheet data
            previous_balance_sheet: Previous period balance sheet data (optional)
            
        Returns:
            Dictionary of efficiency ratios
        """
        try:
            # Extract required values
            revenue = income_statement.get('revenue', 0)
            cost_of_revenue = income_statement.get('costOfRevenue', 0)
            
            # Get current period values
            inventory = balance_sheet.get('inventory', 0)
            accounts_receivable = balance_sheet.get('netReceivables', 0)
            accounts_payable = balance_sheet.get('accountsPayable', 0)
            total_assets = balance_sheet.get('totalAssets', 0)
            
            # Calculate ratios
            ratios = {}
            
            # Asset turnover
            if total_assets and total_assets > 0:
                ratios['asset_turnover'] = revenue / total_assets
            else:
                ratios['asset_turnover'] = None
            
            # If previous balance sheet is available, calculate average values
            if previous_balance_sheet:
                # Get previous period values
                prev_inventory = previous_balance_sheet.get('inventory', 0)
                prev_accounts_receivable = previous_balance_sheet.get('netReceivables', 0)
                prev_accounts_payable = previous_balance_sheet.get('accountsPayable', 0)
                prev_total_assets = previous_balance_sheet.get('totalAssets', 0)
                
                # Calculate average values
                avg_inventory = (inventory + prev_inventory) / 2
                avg_accounts_receivable = (accounts_receivable + prev_accounts_receivable) / 2
                avg_accounts_payable = (accounts_payable + prev_accounts_payable) / 2
                avg_total_assets = (total_assets + prev_total_assets) / 2
                
                # Inventory turnover
                if avg_inventory and avg_inventory > 0:
                    ratios['inventory_turnover'] = cost_of_revenue / avg_inventory
                    # Days inventory outstanding
                    ratios['days_inventory_outstanding'] = 365 / ratios['inventory_turnover'] if ratios['inventory_turnover'] else None
                else:
                    ratios['inventory_turnover'] = None
                    ratios['days_inventory_outstanding'] = None
                
                # Receivables turnover
                if avg_accounts_receivable and avg_accounts_receivable > 0:
                    ratios['receivables_turnover'] = revenue / avg_accounts_receivable
                    # Days sales outstanding
                    ratios['days_sales_outstanding'] = 365 / ratios['receivables_turnover'] if ratios['receivables_turnover'] else None
                else:
                    ratios['receivables_turnover'] = None
                    ratios['days_sales_outstanding'] = None
                
                # Payables turnover
                if avg_accounts_payable and avg_accounts_payable > 0:
                    ratios['payables_turnover'] = cost_of_revenue / avg_accounts_payable
                    # Days payables outstanding
                    ratios['days_payables_outstanding'] = 365 / ratios['payables_turnover'] if ratios['payables_turnover'] else None
                else:
                    ratios['payables_turnover'] = None
                    ratios['days_payables_outstanding'] = None
                
                # Asset turnover with average assets
                if avg_total_assets and avg_total_assets > 0:
                    ratios['asset_turnover'] = revenue / avg_total_assets
                
                # Cash conversion cycle
                if (ratios['days_inventory_outstanding'] is not None and 
                    ratios['days_sales_outstanding'] is not None and 
                    ratios['days_payables_outstanding'] is not None):
                    ratios['cash_conversion_cycle'] = (
                        ratios['days_inventory_outstanding'] + 
                        ratios['days_sales_outstanding'] - 
                        ratios['days_payables_outstanding']
                    )
                else:
                    ratios['cash_conversion_cycle'] = None
            else:
                # Use current period values if previous period not available
                if inventory and inventory > 0:
                    ratios['inventory_turnover'] = cost_of_revenue / inventory
                    ratios['days_inventory_outstanding'] = 365 / ratios['inventory_turnover'] if ratios['inventory_turnover'] else None
                else:
                    ratios['inventory_turnover'] = None
                    ratios['days_inventory_outstanding'] = None
                
                if accounts_receivable and accounts_receivable > 0:
                    ratios['receivables_turnover'] = revenue / accounts_receivable
                    ratios['days_sales_outstanding'] = 365 / ratios['receivables_turnover'] if ratios['receivables_turnover'] else None
                else:
                    ratios['receivables_turnover'] = None
                    ratios['days_sales_outstanding'] = None
                
                if accounts_payable and accounts_payable > 0:
                    ratios['payables_turnover'] = cost_of_revenue / accounts_payable
                    ratios['days_payables_outstanding'] = 365 / ratios['payables_turnover'] if ratios['payables_turnover'] else None
                else:
                    ratios['payables_turnover'] = None
                    ratios['days_payables_outstanding'] = None
                
                if (ratios['days_inventory_outstanding'] is not None and 
                    ratios['days_sales_outstanding'] is not None and 
                    ratios['days_payables_outstanding'] is not None):
                    ratios['cash_conversion_cycle'] = (
                        ratios['days_inventory_outstanding'] + 
                        ratios['days_sales_outstanding'] - 
                        ratios['days_payables_outstanding']
                    )
                else:
                    ratios['cash_conversion_cycle'] = None
            
            return ratios
        except Exception as e:
            print(f"Error calculating efficiency ratios: {e}")
            return {}
    
    @staticmethod
    def calculate_valuation_ratios(
        income_statement: Dict[str, Any],
        balance_sheet: Dict[str, Any],
        cash_flow_statement: Optional[Dict[str, Any]] = None,
        market_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, float]:
        """
        Calculate valuation ratios.
        
        Args:
            income_statement: Income statement data
            balance_sheet: Balance sheet data
            cash_flow_statement: Cash flow statement data (optional)
            market_data: Market data including price, shares outstanding, etc. (optional)
            
        Returns:
            Dictionary of valuation ratios
        """
        try:
            # Extract required values
            net_income = income_statement.get('netIncome', 0)
            revenue = income_statement.get('revenue', 0)
            ebitda = income_statement.get('ebitda', 0)
            
            total_assets = balance_sheet.get('totalAssets', 0)
            total_equity = balance_sheet.get('totalEquity', 0)
            shares_outstanding = balance_sheet.get('commonStock', 0)  # This is an approximation
            
            # Calculate ratios
            ratios = {}
            
            # Earnings per share (EPS)
            if shares_outstanding and shares_outstanding > 0:
                ratios['earnings_per_share'] = net_income / shares_outstanding
            else:
                ratios['earnings_per_share'] = None
            
            # Book value per share
            if shares_outstanding and shares_outstanding > 0:
                ratios['book_value_per_share'] = total_equity / shares_outstanding
            else:
                ratios['book_value_per_share'] = None
            
            # If market data is available, calculate market-based ratios
            if market_data:
                price = market_data.get('price', 0)
                market_cap = market_data.get('marketCap', 0)
                enterprise_value = market_data.get('enterpriseValue', 0)
                
                # Price-to-earnings (P/E) ratio
                if ratios['earnings_per_share'] and ratios['earnings_per_share'] > 0:
                    ratios['price_to_earnings'] = price / ratios['earnings_per_share']
                else:
                    ratios['price_to_earnings'] = None
                
                # Price-to-book (P/B) ratio
                if ratios['book_value_per_share'] and ratios['book_value_per_share'] > 0:
                    ratios['price_to_book'] = price / ratios['book_value_per_share']
                else:
                    ratios['price_to_book'] = None
                
                # Price-to-sales (P/S) ratio
                if revenue and revenue > 0 and market_cap:
                    ratios['price_to_sales'] = market_cap / revenue
                else:
                    ratios['price_to_sales'] = None
                
                # Enterprise value to EBITDA (EV/EBITDA)
                if ebitda and ebitda > 0 and enterprise_value:
                    ratios['ev_to_ebitda'] = enterprise_value / ebitda
                else:
                    ratios['ev_to_ebitda'] = None
                
                # Enterprise value to revenue (EV/Revenue)
                if revenue and revenue > 0 and enterprise_value:
                    ratios['ev_to_revenue'] = enterprise_value / revenue
                else:
                    ratios['ev_to_revenue'] = None
                
                # If cash flow statement is available, calculate cash flow ratios
                if cash_flow_statement:
                    operating_cash_flow = cash_flow_statement.get('operatingCashFlow', 0)
                    free_cash_flow = cash_flow_statement.get('freeCashFlow', 0)
                    
                    # Price-to-cash flow (P/CF) ratio
                    if operating_cash_flow and operating_cash_flow > 0 and market_cap:
                        ratios['price_to_cash_flow'] = market_cap / operating_cash_flow
                    else:
                        ratios['price_to_cash_flow'] = None
                    
                    # Price-to-free cash flow (P/FCF) ratio
                    if free_cash_flow and free_cash_flow > 0 and market_cap:
                        ratios['price_to_free_cash_flow'] = market_cap / free_cash_flow
                    else:
                        ratios['price_to_free_cash_flow'] = None
            
            return ratios
        except Exception as e:
            print(f"Error calculating valuation ratios: {e}")
            return {}
    
    @staticmethod
    def calculate_growth_ratios(
        current_period: Dict[str, Any],
        previous_period: Dict[str, Any]
    ) -> Dict[str, float]:
        """
        Calculate growth ratios between two periods.
        
        Args:
            current_period: Current period financial data
            previous_period: Previous period financial data
            
        Returns:
            Dictionary of growth ratios
        """
        try:
            # Extract required values
            current_revenue = current_period.get('income_statement', {}).get('revenue', 0)
            previous_revenue = previous_period.get('income_statement', {}).get('revenue', 0)
            
            current_net_income = current_period.get('income_statement', {}).get('netIncome', 0)
            previous_net_income = previous_period.get('income_statement', {}).get('netIncome', 0)
            
            current_ebitda = current_period.get('income_statement', {}).get('ebitda', 0)
            previous_ebitda = previous_period.get('income_statement', {}).get('ebitda', 0)
            
            current_total_assets = current_period.get('balance_sheet', {}).get('totalAssets', 0)
            previous_total_assets = previous_period.get('balance_sheet', {}).get('totalAssets', 0)
            
            current_equity = current_period.get('balance_sheet', {}).get('totalEquity', 0)
            previous_equity = previous_period.get('balance_sheet', {}).get('totalEquity', 0)
            
            # Calculate growth ratios
            ratios = {}
            
            # Revenue growth
            if previous_revenue and previous_revenue != 0:
                ratios['revenue_growth'] = (current_revenue - previous_revenue) / abs(previous_revenue)
            else:
                ratios['revenue_growth'] = None
            
            # Net income growth
            if previous_net_income and previous_net_income != 0:
                ratios['net_income_growth'] = (current_net_income - previous_net_income) / abs(previous_net_income)
            else:
                ratios['net_income_growth'] = None
            
            # EBITDA growth
            if previous_ebitda and previous_ebitda != 0:
                ratios['ebitda_growth'] = (current_ebitda - previous_ebitda) / abs(previous_ebitda)
            else:
                ratios['ebitda_growth'] = None
            
            # Asset growth
            if previous_total_assets and previous_total_assets != 0:
                ratios['asset_growth'] = (current_total_assets - previous_total_assets) / abs(previous_total_assets)
            else:
                ratios['asset_growth'] = None
            
            # Equity growth
            if previous_equity and previous_equity != 0:
                ratios['equity_growth'] = (current_equity - previous_equity) / abs(previous_equity)
            else:
                ratios['equity_growth'] = None
            
            return ratios
        except Exception as e:
            print(f"Error calculating growth ratios: {e}")
            return {}
    
    @staticmethod
    def calculate_all_ratios(
        current_period: Dict[str, Any],
        previous_period: Optional[Dict[str, Any]] = None,
        market_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Dict[str, float]]:
        """
        Calculate all financial ratios.
        
        Args:
            current_period: Current period financial data
            previous_period: Previous period financial data (optional)
            market_data: Market data including price, shares outstanding, etc. (optional)
            
        Returns:
            Dictionary of all financial ratios
        """
        # Extract financial statements
        balance_sheet = current_period.get('balance_sheet', {})
        income_statement = current_period.get('income_statement', {})
        cash_flow_statement = current_period.get('cash_flow_statement', {})
        
        previous_balance_sheet = previous_period.get('balance_sheet', {}) if previous_period else None
        
        # Calculate ratios
        liquidity_ratios = FinancialRatioCalculator.calculate_liquidity_ratios(
            balance_sheet, income_statement
        )
        
        profitability_ratios = FinancialRatioCalculator.calculate_profitability_ratios(
            income_statement, balance_sheet
        )
        
        solvency_ratios = FinancialRatioCalculator.calculate_solvency_ratios(
            balance_sheet, income_statement
        )
        
        efficiency_ratios = FinancialRatioCalculator.calculate_efficiency_ratios(
            income_statement, balance_sheet, previous_balance_sheet
        )
        
        valuation_ratios = FinancialRatioCalculator.calculate_valuation_ratios(
            income_statement, balance_sheet, cash_flow_statement, market_data
        )
        
        # Calculate growth ratios if previous period data is available
        growth_ratios = {}
        if previous_period:
            growth_ratios = FinancialRatioCalculator.calculate_growth_ratios(
                current_period, previous_period
            )
        
        # Combine all ratios
        all_ratios = {
            'liquidity': liquidity_ratios,
            'profitability': profitability_ratios,
            'solvency': solvency_ratios,
            'efficiency': efficiency_ratios,
            'valuation': valuation_ratios,
            'growth': growth_ratios
        }
        
        return all_ratios