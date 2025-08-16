describe('Dashboard', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('TEST_USER_EMAIL') || 'test@example.com', 
             Cypress.env('TEST_USER_PASSWORD') || 'Password123!');
    cy.visit('/dashboard');
  });

  it('should display dashboard components', () => {
    // Check that main dashboard components are visible
    cy.get('[data-testid=market-summary-widget]').should('be.visible');
    cy.get('[data-testid=portfolio-summary-widget]').should('be.visible');
    cy.get('[data-testid=recent-alerts-widget]').should('be.visible');
    cy.get('[data-testid=performance-metrics-widget]').should('be.visible');
  });

  it('should display market data', () => {
    // Check that market data is loaded
    cy.get('[data-testid=market-summary-widget]').within(() => {
      cy.get('[data-testid=market-indices]').should('be.visible');
      cy.get('[data-testid=market-sectors]').should('be.visible');
      cy.contains('S&P 500').should('be.visible');
      cy.contains('NASDAQ').should('be.visible');
      cy.contains('DOW').should('be.visible');
    });
  });

  it('should navigate to stock details from search', () => {
    // Search for a stock and navigate to its details page
    cy.searchAndSelectStock('AAPL');
    
    // Verify we're on the stock details page
    cy.url().should('include', '/stocks/AAPL');
    cy.contains('Apple Inc').should('be.visible');
    cy.get('[data-testid=stock-price]').should('be.visible');
    cy.get('[data-testid=stock-chart]').should('be.visible');
  });

  it('should display portfolio summary', () => {
    // Check portfolio summary widget
    cy.get('[data-testid=portfolio-summary-widget]').within(() => {
      cy.get('[data-testid=portfolio-value]').should('be.visible');
      cy.get('[data-testid=portfolio-change]').should('be.visible');
      cy.get('[data-testid=portfolio-allocation]').should('be.visible');
    });
  });

  it('should navigate to portfolio details', () => {
    // Click on portfolio to see details
    cy.get('[data-testid=portfolio-summary-widget]').within(() => {
      cy.get('[data-testid=view-portfolio-button]').click();
    });
    
    // Verify we're on the portfolio details page
    cy.url().should('include', '/portfolios/');
    cy.get('[data-testid=portfolio-holdings]').should('be.visible');
    cy.get('[data-testid=portfolio-performance]').should('be.visible');
  });

  it('should display recent alerts', () => {
    // Check recent alerts widget
    cy.get('[data-testid=recent-alerts-widget]').within(() => {
      cy.get('[data-testid=alerts-list]').should('be.visible');
    });
  });

  it('should display performance metrics', () => {
    // Check performance metrics widget
    cy.get('[data-testid=performance-metrics-widget]').within(() => {
      cy.get('[data-testid=daily-performance]').should('be.visible');
      cy.get('[data-testid=weekly-performance]').should('be.visible');
      cy.get('[data-testid=monthly-performance]').should('be.visible');
      cy.get('[data-testid=yearly-performance]').should('be.visible');
    });
  });

  it('should refresh market data', () => {
    // Intercept API calls
    cy.intercept('GET', '**/api/market/summary').as('marketData');
    
    // Click refresh button
    cy.get('[data-testid=market-summary-widget]').within(() => {
      cy.get('[data-testid=refresh-button]').click();
    });
    
    // Wait for API call to complete
    cy.wait('@marketData');
    
    // Verify data is refreshed
    cy.get('[data-testid=market-summary-widget]').within(() => {
      cy.get('[data-testid=last-updated]').should('contain', 'Last updated:');
    });
  });
});