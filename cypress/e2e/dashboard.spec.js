/// <reference types="cypress" />

describe('Dashboard Functionality', () => {
  beforeEach(() => {
    // Mock API responses for consistent testing
    cy.intercept('GET', '/api/market-data/watchlist', { fixture: 'watchlist.json' }).as('getWatchlist');
    cy.intercept('GET', '/api/portfolio/summary', { fixture: 'portfolio-summary.json' }).as('getPortfolioSummary');
    cy.intercept('GET', '/api/market-data/quotes*', { fixture: 'quotes.json' }).as('getQuotes');
    cy.intercept('GET', '/api/analytics/market-overview', { fixture: 'market-overview.json' }).as('getMarketOverview');
    
    // Login before each test
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type(Cypress.env('TEST_USER_EMAIL'));
    cy.get('[data-testid=password-input]').type(Cypress.env('TEST_USER_PASSWORD'));
    cy.get('[data-testid=login-button]').click();
    
    // Wait for dashboard to load
    cy.url().should('include', '/dashboard');
  });

  it('should display portfolio summary correctly', () => {
    cy.wait('@getPortfolioSummary');
    
    // Check portfolio value
    cy.get('[data-testid=portfolio-value]').should('be.visible');
    cy.get('[data-testid=portfolio-value]').should('contain', '$');
    
    // Check daily P&L
    cy.get('[data-testid=daily-pnl]').should('be.visible');
    
    // Check allocation chart
    cy.get('[data-testid=allocation-chart]').should('be.visible');
    
    // Check portfolio metrics
    cy.get('[data-testid=portfolio-metrics]').within(() => {
      cy.contains('Sharpe Ratio').should('be.visible');
      cy.contains('Beta').should('be.visible');
      cy.contains('Alpha').should('be.visible');
      cy.contains('Max Drawdown').should('be.visible');
    });
  });

  it('should display watchlist correctly', () => {
    cy.wait('@getWatchlist');
    cy.wait('@getQuotes');
    
    // Check watchlist table
    cy.get('[data-testid=watchlist-table]').should('be.visible');
    cy.get('[data-testid=watchlist-table] tbody tr').should('have.length.at.least', 1);
    
    // Check watchlist functionality
    cy.get('[data-testid=add-symbol-button]').click();
    cy.get('[data-testid=symbol-input]').type('MSFT{enter}');
    cy.get('[data-testid=watchlist-table]').contains('MSFT').should('be.visible');
    
    // Check symbol details
    cy.get('[data-testid=watchlist-table] tbody tr').first().click();
    cy.get('[data-testid=symbol-details]').should('be.visible');
    cy.get('[data-testid=symbol-chart]').should('be.visible');
  });

  it('should display market overview correctly', () => {
    cy.wait('@getMarketOverview');
    
    // Check market indices
    cy.get('[data-testid=market-indices]').should('be.visible');
    cy.get('[data-testid=market-indices]').contains('S&P 500').should('be.visible');
    cy.get('[data-testid=market-indices]').contains('NASDAQ').should('be.visible');
    cy.get('[data-testid=market-indices]').contains('DOW').should('be.visible');
    
    // Check sector performance
    cy.get('[data-testid=sector-performance]').should('be.visible');
    cy.get('[data-testid=sector-performance] .sector-item').should('have.length.at.least', 5);
    
    // Check market news
    cy.get('[data-testid=market-news]').should('be.visible');
    cy.get('[data-testid=market-news] .news-item').should('have.length.at.least', 3);
  });

  it('should navigate between different dashboard sections', () => {
    // Navigate to portfolio page
    cy.get('[data-testid=nav-portfolio]').click();
    cy.url().should('include', '/portfolio');
    cy.get('[data-testid=portfolio-holdings]').should('be.visible');
    
    // Navigate to trading page
    cy.get('[data-testid=nav-trading]').click();
    cy.url().should('include', '/trading');
    cy.get('[data-testid=order-entry]').should('be.visible');
    
    // Navigate to analytics page
    cy.get('[data-testid=nav-analytics]').click();
    cy.url().should('include', '/analytics');
    cy.get('[data-testid=analytics-dashboard]').should('be.visible');
    
    // Navigate back to main dashboard
    cy.get('[data-testid=nav-dashboard]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should test order entry workflow', () => {
    // Navigate to trading page
    cy.get('[data-testid=nav-trading]').click();
    
    // Mock order submission
    cy.intercept('POST', '/api/orders', { 
      statusCode: 201, 
      body: { 
        id: 'test-order-id', 
        status: 'accepted' 
      } 
    }).as('submitOrder');
    
    // Fill order form
    cy.get('[data-testid=symbol-input]').type('AAPL');
    cy.get('[data-testid=order-type-select]').select('Market');
    cy.get('[data-testid=order-side-buy]').click();
    cy.get('[data-testid=quantity-input]').type('10');
    cy.get('[data-testid=submit-order-button]').click();
    
    // Confirm order
    cy.get('[data-testid=confirm-order-modal]').should('be.visible');
    cy.get('[data-testid=confirm-order-button]').click();
    
    // Wait for order submission
    cy.wait('@submitOrder');
    
    // Check success message
    cy.get('[data-testid=order-success-message]').should('be.visible');
    cy.get('[data-testid=order-success-message]').should('contain', 'Order submitted successfully');
  });

  it('should test risk management features', () => {
    // Navigate to risk management page
    cy.get('[data-testid=nav-risk]').click();
    cy.url().should('include', '/risk');
    
    // Check VaR calculation
    cy.get('[data-testid=var-calculator]').should('be.visible');
    cy.get('[data-testid=var-confidence-select]').select('95%');
    cy.get('[data-testid=var-timeframe-select]').select('1 Day');
    cy.get('[data-testid=calculate-var-button]').click();
    
    // Check VaR results
    cy.get('[data-testid=var-result]').should('be.visible');
    cy.get('[data-testid=var-chart]').should('be.visible');
    
    // Check stress testing
    cy.get('[data-testid=stress-test-tab]').click();
    cy.get('[data-testid=stress-test-scenario-select]').select('2008 Financial Crisis');
    cy.get('[data-testid=run-stress-test-button]').click();
    
    // Check stress test results
    cy.get('[data-testid=stress-test-result]').should('be.visible');
    cy.get('[data-testid=stress-test-chart]').should('be.visible');
  });

  it('should test strategy backtesting workflow', () => {
    // Navigate to strategies page
    cy.get('[data-testid=nav-strategies]').click();
    cy.url().should('include', '/strategies');
    
    // Select strategy to backtest
    cy.get('[data-testid=strategy-list]').contains('Moving Average Crossover').click();
    cy.get('[data-testid=backtest-button]').click();
    
    // Configure backtest
    cy.get('[data-testid=backtest-symbol-input]').type('AAPL');
    cy.get('[data-testid=backtest-start-date]').type('2022-01-01');
    cy.get('[data-testid=backtest-end-date]').type('2022-12-31');
    cy.get('[data-testid=backtest-initial-capital]').clear().type('100000');
    cy.get('[data-testid=run-backtest-button]').click();
    
    // Wait for backtest to complete
    cy.get('[data-testid=backtest-loading]', { timeout: 10000 }).should('not.exist');
    
    // Check backtest results
    cy.get('[data-testid=backtest-results]').should('be.visible');
    cy.get('[data-testid=equity-curve-chart]').should('be.visible');
    cy.get('[data-testid=performance-metrics]').should('be.visible');
    cy.get('[data-testid=trade-list]').should('be.visible');
  });

  it('should test user preferences functionality', () => {
    // Navigate to settings page
    cy.get('[data-testid=user-menu]').click();
    cy.get('[data-testid=settings-link]').click();
    cy.url().should('include', '/settings');
    
    // Test theme switching
    cy.get('[data-testid=theme-dark]').click();
    cy.get('body').should('have.class', 'dark-theme');
    cy.get('[data-testid=theme-light]').click();
    cy.get('body').should('have.class', 'light-theme');
    
    // Test notification preferences
    cy.get('[data-testid=notification-settings]').should('be.visible');
    cy.get('[data-testid=email-notifications]').click();
    cy.get('[data-testid=price-alerts]').click();
    cy.get('[data-testid=save-notification-settings]').click();
    
    // Check success message
    cy.get('[data-testid=settings-saved-message]').should('be.visible');
  });
});