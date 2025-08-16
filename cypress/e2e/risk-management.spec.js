/// <reference types="cypress" />

describe('Risk Management Features', () => {
  beforeEach(() => {
    // Mock API responses for consistent testing
    cy.intercept('GET', '/api/portfolio/summary', { fixture: 'portfolio-summary.json' }).as('getPortfolioSummary');
    cy.intercept('GET', '/api/risk/var-calculation', { 
      fixture: 'var-calculation.json' 
    }).as('getVarCalculation');
    cy.intercept('GET', '/api/risk/stress-test', { 
      fixture: 'stress-test.json' 
    }).as('getStressTest');
    cy.intercept('GET', '/api/risk/correlation-matrix', { 
      fixture: 'correlation-matrix.json' 
    }).as('getCorrelationMatrix');
    
    // Login before each test
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type(Cypress.env('TEST_USER_EMAIL'));
    cy.get('[data-testid=password-input]').type(Cypress.env('TEST_USER_PASSWORD'));
    cy.get('[data-testid=login-button]').click();
    
    // Navigate to risk management page
    cy.get('[data-testid=nav-risk]').click();
    cy.url().should('include', '/risk');
  });

  it('should calculate Value at Risk (VaR) correctly', () => {
    // Select portfolio
    cy.get('[data-testid=portfolio-select]').select('Main Portfolio');
    
    // Configure VaR calculation
    cy.get('[data-testid=var-tab]').click();
    cy.get('[data-testid=var-method-select]').select('Historical');
    cy.get('[data-testid=var-confidence-select]').select('95%');
    cy.get('[data-testid=var-timeframe-select]').select('1 Day');
    
    // Run VaR calculation
    cy.get('[data-testid=calculate-var-button]').click();
    cy.wait('@getVarCalculation');
    
    // Verify results
    cy.get('[data-testid=var-result]').should('be.visible');
    cy.get('[data-testid=var-amount]').should('contain', '$');
    cy.get('[data-testid=var-percentage]').should('contain', '%');
    
    // Check VaR chart
    cy.verifyChart('[data-testid=var-chart]');
    
    // Check different VaR methods
    cy.get('[data-testid=var-method-select]').select('Parametric');
    cy.get('[data-testid=calculate-var-button]').click();
    cy.wait('@getVarCalculation');
    cy.get('[data-testid=var-result]').should('be.visible');
    
    cy.get('[data-testid=var-method-select]').select('Monte Carlo');
    cy.get('[data-testid=calculate-var-button]').click();
    cy.wait('@getVarCalculation');
    cy.get('[data-testid=var-result]').should('be.visible');
  });

  it('should perform stress testing correctly', () => {
    // Select portfolio
    cy.get('[data-testid=portfolio-select]').select('Main Portfolio');
    
    // Navigate to stress testing tab
    cy.get('[data-testid=stress-test-tab]').click();
    
    // Select historical scenario
    cy.get('[data-testid=stress-test-scenario-select]').select('2008 Financial Crisis');
    
    // Run stress test
    cy.get('[data-testid=run-stress-test-button]').click();
    cy.wait('@getStressTest');
    
    // Verify results
    cy.get('[data-testid=stress-test-result]').should('be.visible');
    cy.get('[data-testid=portfolio-impact]').should('contain', '-');
    cy.get('[data-testid=recovery-period]').should('be.visible');
    
    // Check stress test chart
    cy.verifyChart('[data-testid=stress-test-chart]');
    
    // Test custom scenario
    cy.get('[data-testid=custom-scenario-tab]').click();
    cy.get('[data-testid=market-drop-input]').clear().type('15');
    cy.get('[data-testid=interest-rate-change-input]').clear().type('2');
    cy.get('[data-testid=volatility-increase-input]').clear().type('50');
    cy.get('[data-testid=run-custom-scenario-button]').click();
    cy.wait('@getStressTest');
    
    // Verify custom scenario results
    cy.get('[data-testid=stress-test-result]').should('be.visible');
    cy.get('[data-testid=portfolio-impact]').should('be.visible');
  });

  it('should analyze portfolio correlation correctly', () => {
    // Select portfolio
    cy.get('[data-testid=portfolio-select]').select('Main Portfolio');
    
    // Navigate to correlation analysis tab
    cy.get('[data-testid=correlation-tab]').click();
    
    // Run correlation analysis
    cy.get('[data-testid=calculate-correlation-button]').click();
    cy.wait('@getCorrelationMatrix');
    
    // Verify correlation matrix
    cy.get('[data-testid=correlation-matrix]').should('be.visible');
    cy.get('[data-testid=correlation-heatmap]').should('be.visible');
    
    // Check correlation statistics
    cy.get('[data-testid=avg-correlation]').should('be.visible');
    cy.get('[data-testid=diversification-score]').should('be.visible');
    
    // Test different timeframes
    cy.get('[data-testid=correlation-timeframe-select]').select('1 Year');
    cy.get('[data-testid=calculate-correlation-button]').click();
    cy.wait('@getCorrelationMatrix');
    cy.get('[data-testid=correlation-matrix]').should('be.visible');
    
    cy.get('[data-testid=correlation-timeframe-select]').select('5 Years');
    cy.get('[data-testid=calculate-correlation-button]').click();
    cy.wait('@getCorrelationMatrix');
    cy.get('[data-testid=correlation-matrix]').should('be.visible');
  });

  it('should implement position sizing recommendations', () => {
    // Select portfolio
    cy.get('[data-testid=portfolio-select]').select('Main Portfolio');
    
    // Navigate to position sizing tab
    cy.get('[data-testid=position-sizing-tab]').click();
    
    // Configure position sizing
    cy.get('[data-testid=risk-per-trade-input]').clear().type('2');
    cy.get('[data-testid=position-sizing-method-select]').select('Fixed Percentage');
    
    // Calculate position sizes
    cy.get('[data-testid=calculate-position-sizes-button]').click();
    
    // Verify position size recommendations
    cy.get('[data-testid=position-size-recommendations]').should('be.visible');
    cy.get('[data-testid=position-size-table]').should('be.visible');
    cy.get('[data-testid=position-size-table] tbody tr').should('have.length.at.least', 1);
    
    // Test different position sizing methods
    cy.get('[data-testid=position-sizing-method-select]').select('Kelly Criterion');
    cy.get('[data-testid=calculate-position-sizes-button]').click();
    cy.get('[data-testid=position-size-recommendations]').should('be.visible');
    
    cy.get('[data-testid=position-sizing-method-select]').select('Optimal F');
    cy.get('[data-testid=calculate-position-sizes-button]').click();
    cy.get('[data-testid=position-size-recommendations]').should('be.visible');
  });

  it('should implement automated risk mitigation strategies', () => {
    // Select portfolio
    cy.get('[data-testid=portfolio-select]').select('Main Portfolio');
    
    // Navigate to risk mitigation tab
    cy.get('[data-testid=risk-mitigation-tab]').click();
    
    // Configure stop-loss strategy
    cy.get('[data-testid=stop-loss-tab]').click();
    cy.get('[data-testid=stop-loss-type-select]').select('Trailing');
    cy.get('[data-testid=stop-loss-percentage-input]').clear().type('10');
    cy.get('[data-testid=apply-stop-loss-button]').click();
    
    // Verify stop-loss applied
    cy.get('[data-testid=stop-loss-applied-message]').should('be.visible');
    cy.get('[data-testid=stop-loss-orders-table]').should('be.visible');
    
    // Configure hedging strategy
    cy.get('[data-testid=hedging-tab]').click();
    cy.get('[data-testid=hedging-method-select]').select('Options');
    cy.get('[data-testid=hedge-ratio-input]').clear().type('50');
    cy.get('[data-testid=apply-hedging-button]').click();
    
    // Verify hedging applied
    cy.get('[data-testid=hedging-applied-message]').should('be.visible');
    cy.get('[data-testid=hedging-positions-table]').should('be.visible');
    
    // Configure portfolio rebalancing
    cy.get('[data-testid=rebalancing-tab]').click();
    cy.get('[data-testid=rebalancing-frequency-select]').select('Monthly');
    cy.get('[data-testid=drift-threshold-input]').clear().type('5');
    cy.get('[data-testid=apply-rebalancing-button]').click();
    
    // Verify rebalancing applied
    cy.get('[data-testid=rebalancing-applied-message]').should('be.visible');
    cy.get('[data-testid=next-rebalancing-date]').should('be.visible');
  });
});