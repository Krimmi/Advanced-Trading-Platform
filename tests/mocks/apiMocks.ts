/**
 * API Mocking Utilities for Testing
 * 
 * This file contains mock implementations and fixtures for external API services
 * used in testing the hedge fund trading application.
 */

import nock from 'nock';
import { readFileSync } from 'fs';
import { join } from 'path';

// Base URLs for different API providers
const API_URLS = {
  ALPACA: 'https://api.alpaca.markets',
  ALPACA_DATA: 'https://data.alpaca.markets',
  IEX_CLOUD: 'https://cloud.iexapis.com',
  POLYGON: 'https://api.polygon.io',
  FMP: 'https://financialmodelingprep.com/api'
};

// Helper to load JSON fixtures
const loadFixture = (path: string) => {
  try {
    return JSON.parse(readFileSync(join(__dirname, '../fixtures', path), 'utf-8'));
  } catch (error) {
    console.error(`Failed to load fixture: ${path}`, error);
    return null;
  }
};

/**
 * Mock Alpaca API responses
 */
export const mockAlpacaApi = {
  // Account information
  mockGetAccount: () => {
    const accountData = loadFixture('alpaca/account.json');
    return nock(API_URLS.ALPACA)
      .get('/v2/account')
      .reply(200, accountData);
  },
  
  // Positions
  mockGetPositions: () => {
    const positionsData = loadFixture('alpaca/positions.json');
    return nock(API_URLS.ALPACA)
      .get('/v2/positions')
      .reply(200, positionsData);
  },
  
  // Orders
  mockPlaceOrder: (order: any) => {
    const orderResponse = {
      id: 'order-id-12345',
      client_order_id: order.client_order_id || 'client-order-id',
      status: 'accepted',
      created_at: new Date().toISOString(),
      ...order
    };
    
    return nock(API_URLS.ALPACA)
      .post('/v2/orders')
      .reply(200, orderResponse);
  },
  
  // Market data
  mockGetBars: (symbol: string, timeframe: string = '1D') => {
    const barsData = loadFixture(`alpaca/bars_${symbol.toLowerCase()}.json`) || {
      [symbol]: [
        {
          t: new Date().toISOString(),
          o: 150.0,
          h: 155.0,
          l: 149.0,
          c: 153.0,
          v: 1000000
        },
        {
          t: new Date(Date.now() - 86400000).toISOString(),
          o: 153.0,
          h: 158.0,
          l: 152.0,
          c: 157.0,
          v: 1200000
        }
      ]
    };
    
    return nock(API_URLS.ALPACA_DATA)
      .get(`/v2/stocks/${symbol}/bars`)
      .query(true) // Match any query parameters
      .reply(200, { bars: barsData[symbol] });
  },
  
  mockGetQuote: (symbol: string) => {
    const quoteData = loadFixture(`alpaca/quote_${symbol.toLowerCase()}.json`) || {
      [symbol]: {
        t: new Date().toISOString(),
        bp: 150.5,
        bs: 100,
        ap: 150.7,
        as: 200
      }
    };
    
    return nock(API_URLS.ALPACA_DATA)
      .get(`/v2/stocks/${symbol}/quotes/latest`)
      .reply(200, { quote: quoteData[symbol] });
  }
};

/**
 * Mock IEX Cloud API responses
 */
export const mockIEXCloudApi = {
  // Company information
  mockGetCompany: (symbol: string) => {
    const companyData = loadFixture(`iex/company_${symbol.toLowerCase()}.json`) || {
      symbol,
      companyName: `${symbol} Inc.`,
      exchange: 'NASDAQ',
      industry: 'Technology',
      website: `https://www.${symbol.toLowerCase()}.com`,
      description: `${symbol} is a technology company.`,
      CEO: 'John Doe',
      securityName: `${symbol} Common Stock`,
      issueType: 'cs',
      sector: 'Technology',
      employees: 10000
    };
    
    return nock(API_URLS.IEX_CLOUD)
      .get(`/v1/stock/${symbol}/company`)
      .query(true)
      .reply(200, companyData);
  },
  
  // Quote data
  mockGetQuote: (symbol: string) => {
    const quoteData = loadFixture(`iex/quote_${symbol.toLowerCase()}.json`) || {
      symbol,
      companyName: `${symbol} Inc.`,
      latestPrice: 150.5,
      latestVolume: 1000000,
      bidPrice: 150.4,
      bidSize: 100,
      askPrice: 150.6,
      askSize: 200,
      high: 155.0,
      low: 149.0,
      open: 150.0,
      close: 153.0,
      previousClose: 152.0,
      change: 1.0,
      changePercent: 0.0066,
      marketCap: 2500000000000
    };
    
    return nock(API_URLS.IEX_CLOUD)
      .get(`/v1/stock/${symbol}/quote`)
      .query(true)
      .reply(200, quoteData);
  },
  
  // Financial data
  mockGetFinancials: (symbol: string) => {
    const financialsData = loadFixture(`iex/financials_${symbol.toLowerCase()}.json`) || {
      symbol,
      financials: [
        {
          reportDate: '2023-03-31',
          totalRevenue: 100000000000,
          costOfRevenue: 50000000000,
          grossProfit: 50000000000,
          operatingExpense: 20000000000,
          operatingIncome: 30000000000,
          netIncome: 25000000000,
          researchAndDevelopment: 10000000000,
          operatingRevenue: 100000000000,
          totalAssets: 350000000000,
          totalLiabilities: 150000000000,
          currentDebt: 10000000000,
          totalCash: 50000000000,
          currentCash: 30000000000,
          totalDebt: 100000000000
        }
      ]
    };
    
    return nock(API_URLS.IEX_CLOUD)
      .get(`/v1/stock/${symbol}/financials`)
      .query(true)
      .reply(200, financialsData);
  }
};

/**
 * Mock Polygon.io API responses
 */
export const mockPolygonApi = {
  // Ticker details
  mockGetTickerDetails: (symbol: string) => {
    const tickerData = loadFixture(`polygon/ticker_${symbol.toLowerCase()}.json`) || {
      ticker: {
        ticker: symbol,
        name: `${symbol} Inc.`,
        market: 'stocks',
        locale: 'us',
        primary_exchange: 'NASDAQ',
        type: 'cs',
        active: true,
        currency_name: 'usd',
        cik: '0000123456',
        composite_figi: 'BBG000ABCDEF',
        share_class_figi: 'BBG001ABCDEF',
        description: `${symbol} Inc. is a technology company.`
      }
    };
    
    return nock(API_URLS.POLYGON)
      .get(`/v3/reference/tickers/${symbol}`)
      .query(true)
      .reply(200, tickerData);
  },
  
  // Aggregates (bars)
  mockGetAggregates: (symbol: string) => {
    const barsData = loadFixture(`polygon/aggs_${symbol.toLowerCase()}.json`) || {
      ticker: symbol,
      status: 'OK',
      adjusted: true,
      queryCount: 2,
      resultsCount: 2,
      results: [
        {
          v: 1000000,
          o: 150.0,
          c: 153.0,
          h: 155.0,
          l: 149.0,
          t: Date.now() - 86400000,
          vw: 152.0
        },
        {
          v: 1200000,
          o: 153.0,
          c: 157.0,
          h: 158.0,
          l: 152.0,
          t: Date.now(),
          vw: 155.0
        }
      ]
    };
    
    return nock(API_URLS.POLYGON)
      .get(`/v2/aggs/ticker/${symbol}/range/1/day/2023-01-01/2023-01-31`)
      .query(true)
      .reply(200, barsData);
  },
  
  // Last quote
  mockGetLastQuote: (symbol: string) => {
    const quoteData = loadFixture(`polygon/quote_${symbol.toLowerCase()}.json`) || {
      status: 'success',
      request_id: 'request-id-12345',
      results: {
        T: symbol,
        p: 150.5,
        s: 100,
        P: 150.7,
        S: 200,
        t: Date.now()
      }
    };
    
    return nock(API_URLS.POLYGON)
      .get(`/v2/last/nbbo/${symbol}`)
      .query(true)
      .reply(200, quoteData);
  }
};

/**
 * Mock Financial Modeling Prep API responses
 */
export const mockFMPApi = {
  // Company profile
  mockGetCompanyProfile: (symbol: string) => {
    const profileData = loadFixture(`fmp/profile_${symbol.toLowerCase()}.json`) || [{
      symbol,
      price: 150.5,
      beta: 1.2,
      volAvg: 30000000,
      mktCap: 2500000000000,
      lastDiv: 0.82,
      range: '120.5-180.0',
      changes: 1.5,
      companyName: `${symbol} Inc.`,
      currency: 'USD',
      cik: '0000123456',
      isin: 'US0000123456',
      cusip: '000123456',
      exchange: 'NASDAQ',
      exchangeShortName: 'NASDAQ',
      industry: 'Technology',
      website: `https://www.${symbol.toLowerCase()}.com`,
      description: `${symbol} Inc. is a technology company.`,
      ceo: 'John Doe',
      sector: 'Technology',
      country: 'US',
      fullTimeEmployees: 150000,
      phone: '123-456-7890',
      address: '123 Tech Street',
      city: 'Cupertino',
      state: 'CA',
      zip: '95014',
      dcfDiff: 10.5,
      dcf: 160.0,
      image: `https://financialmodelingprep.com/image/${symbol.toLowerCase()}.png`,
      ipoDate: '1980-12-12'
    }];
    
    return nock(API_URLS.FMP)
      .get(`/v3/profile/${symbol}`)
      .query(true)
      .reply(200, profileData);
  },
  
  // Income statement
  mockGetIncomeStatement: (symbol: string) => {
    const incomeData = loadFixture(`fmp/income_${symbol.toLowerCase()}.json`) || [
      {
        date: '2023-03-31',
        symbol,
        reportedCurrency: 'USD',
        fillingDate: '2023-04-30',
        acceptedDate: '2023-04-30',
        period: 'FY',
        revenue: 100000000000,
        costOfRevenue: 50000000000,
        grossProfit: 50000000000,
        grossProfitRatio: 0.5,
        researchAndDevelopmentExpenses: 10000000000,
        generalAndAdministrativeExpenses: 5000000000,
        sellingAndMarketingExpenses: 5000000000,
        operatingExpenses: 20000000000,
        operatingIncome: 30000000000,
        operatingIncomeRatio: 0.3,
        interestExpense: 1000000000,
        incomeBeforeTax: 29000000000,
        incomeBeforeTaxRatio: 0.29,
        incomeTaxExpense: 4000000000,
        netIncome: 25000000000,
        netIncomeRatio: 0.25,
        eps: 1.5,
        epsDiluted: 1.48,
        weightedAverageShsOut: 16666666667,
        weightedAverageShsOutDil: 16891891892
      }
    ];
    
    return nock(API_URLS.FMP)
      .get(`/v3/income-statement/${symbol}`)
      .query(true)
      .reply(200, incomeData);
  },
  
  // Balance sheet
  mockGetBalanceSheet: (symbol: string) => {
    const balanceData = loadFixture(`fmp/balance_${symbol.toLowerCase()}.json`) || [
      {
        date: '2023-03-31',
        symbol,
        reportedCurrency: 'USD',
        fillingDate: '2023-04-30',
        acceptedDate: '2023-04-30',
        period: 'FY',
        cashAndCashEquivalents: 30000000000,
        shortTermInvestments: 20000000000,
        cashAndShortTermInvestments: 50000000000,
        netReceivables: 15000000000,
        inventory: 5000000000,
        totalCurrentAssets: 70000000000,
        propertyPlantEquipmentNet: 40000000000,
        goodwill: 20000000000,
        intangibleAssets: 10000000000,
        totalNonCurrentAssets: 280000000000,
        totalAssets: 350000000000,
        accountPayables: 30000000000,
        shortTermDebt: 10000000000,
        totalCurrentLiabilities: 50000000000,
        longTermDebt: 90000000000,
        totalNonCurrentLiabilities: 100000000000,
        totalLiabilities: 150000000000,
        commonStock: 50000000000,
        retainedEarnings: 150000000000,
        totalStockholdersEquity: 200000000000,
        totalLiabilitiesAndStockholdersEquity: 350000000000
      }
    ];
    
    return nock(API_URLS.FMP)
      .get(`/v3/balance-sheet-statement/${symbol}`)
      .query(true)
      .reply(200, balanceData);
  },
  
  // Cash flow statement
  mockGetCashFlowStatement: (symbol: string) => {
    const cashFlowData = loadFixture(`fmp/cashflow_${symbol.toLowerCase()}.json`) || [
      {
        date: '2023-03-31',
        symbol,
        reportedCurrency: 'USD',
        fillingDate: '2023-04-30',
        acceptedDate: '2023-04-30',
        period: 'FY',
        netIncome: 25000000000,
        depreciationAndAmortization: 10000000000,
        changeInWorkingCapital: -5000000000,
        netCashProvidedByOperatingActivities: 30000000000,
        capitalExpenditure: -12000000000,
        acquisitionsNet: -5000000000,
        purchasesOfInvestments: -20000000000,
        salesMaturitiesOfInvestments: 15000000000,
        netCashUsedForInvestingActivites: -22000000000,
        debtRepayment: -5000000000,
        commonStockIssued: 1000000000,
        commonStockRepurchased: -15000000000,
        dividendsPaid: -3000000000,
        netCashUsedProvidedByFinancingActivities: -22000000000,
        effectOfForexChangesOnCash: -1000000000,
        netChangeInCash: -15000000000,
        cashAtEndOfPeriod: 30000000000,
        cashAtBeginningOfPeriod: 45000000000,
        operatingCashFlow: 30000000000,
        capitalExpenditure: -12000000000,
        freeCashFlow: 18000000000
      }
    ];
    
    return nock(API_URLS.FMP)
      .get(`/v3/cash-flow-statement/${symbol}`)
      .query(true)
      .reply(200, cashFlowData);
  }
};

/**
 * Reset all API mocks
 */
export const resetAllApiMocks = () => {
  nock.cleanAll();
};

/**
 * Setup all API mocks for a given symbol
 */
export const setupAllApiMocksForSymbol = (symbol: string) => {
  // Alpaca mocks
  mockAlpacaApi.mockGetQuote(symbol);
  mockAlpacaApi.mockGetBars(symbol);
  
  // IEX Cloud mocks
  mockIEXCloudApi.mockGetCompany(symbol);
  mockIEXCloudApi.mockGetQuote(symbol);
  mockIEXCloudApi.mockGetFinancials(symbol);
  
  // Polygon mocks
  mockPolygonApi.mockGetTickerDetails(symbol);
  mockPolygonApi.mockGetAggregates(symbol);
  mockPolygonApi.mockGetLastQuote(symbol);
  
  // FMP mocks
  mockFMPApi.mockGetCompanyProfile(symbol);
  mockFMPApi.mockGetIncomeStatement(symbol);
  mockFMPApi.mockGetBalanceSheet(symbol);
  mockFMPApi.mockGetCashFlowStatement(symbol);
};