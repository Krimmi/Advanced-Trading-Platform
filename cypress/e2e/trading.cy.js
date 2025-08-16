describe('Trading', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(Cypress.env('TEST_USER_EMAIL') || 'test@example.com', 
             Cypress.env('TEST_USER_PASSWORD') || 'Password123!');
  });

  it('should navigate to trading page', () => {
    cy.visit('/trading');
    cy.get('[data-testid=trading-page]').should('be.visible');
    cy.get('[data-testid=order-entry-form]').should('be.visible');
    cy.get('[data-testid=order-book]').should('be.visible');
    cy.get('[data-testid=trade-history]').should('be.visible');
  });

  it('should display stock details before trading', () => {
    // Navigate to a stock page
    cy.visit('/stocks/AAPL');
    
    // Check that stock details are displayed
    cy.get('[data-testid=stock-header]').should('contain', 'AAPL');
    cy.get('[data-testid=stock-price]').should('be.visible');
    cy.get('[data-testid=stock-chart]').should('be.visible');
    
    // Click trade button
    cy.get('[data-testid=trade-button]').click();
    
    // Check that order entry form is displayed
    cy.get('[data-testid=order-entry-form]').should('be.visible');
  });

  it('should validate order form inputs', () => {
    cy.visit('/trading');
    
    // Try to submit empty form
    cy.get('[data-testid=review-order-button]').click();
    
    // Check validation errors
    cy.get('[data-testid=symbol-error]').should('be.visible');
    cy.get('[data-testid=quantity-error]').should('be.visible');
    
    // Fill symbol but invalid quantity
    cy.get('[data-testid=symbol-input]').type('AAPL');
    cy.get('[data-testid=quantity-input]').type('0');
    cy.get('[data-testid=review-order-button]').click();
    
    // Check quantity validation error
    cy.get('[data-testid=quantity-error]').should('be.visible');
  });

  it('should place a market buy order', () => {
    // Intercept order creation API call
    cy.intercept('POST', '**/api/trading/orders').as('createOrder');
    
    // Navigate to trading page
    cy.visit('/trading');
    
    // Fill order form
    cy.get('[data-testid=symbol-input]').type('AAPL');
    cy.get('[data-testid=buy-tab]').click();
    cy.get('[data-testid=quantity-input]').clear().type('10');
    cy.get('[data-testid=order-type-select]').select('market');
    
    // Submit order
    cy.get('[data-testid=review-order-button]').click();
    
    // Check order review
    cy.get('[data-testid=order-review-modal]').should('be.visible');
    cy.get('[data-testid=order-review-symbol]').should('contain', 'AAPL');
    cy.get('[data-testid=order-review-quantity]').should('contain', '10');
    cy.get('[data-testid=order-review-type]').should('contain', 'Market');
    cy.get('[data-testid=order-review-side]').should('contain', 'Buy');
    
    // Confirm order
    cy.get('[data-testid=confirm-order-button]').click();
    
    // Wait for API call
    cy.wait('@createOrder');
    
    // Check success message
    cy.get('[data-testid=order-success-message]').should('be.visible');
  });

  it('should place a limit sell order', () => {
    // Intercept order creation API call
    cy.intercept('POST', '**/api/trading/orders').as('createOrder');
    
    // Navigate to trading page
    cy.visit('/trading');
    
    // Fill order form
    cy.get('[data-testid=symbol-input]').type('AAPL');
    cy.get('[data-testid=sell-tab]').click();
    cy.get('[data-testid=quantity-input]').clear().type('5');
    cy.get('[data-testid=order-type-select]').select('limit');
    cy.get('[data-testid=price-input]').clear().type('150.50');
    
    // Submit order
    cy.get('[data-testid=review-order-button]').click();
    
    // Check order review
    cy.get('[data-testid=order-review-modal]').should('be.visible');
    cy.get('[data-testid=order-review-symbol]').should('contain', 'AAPL');
    cy.get('[data-testid=order-review-quantity]').should('contain', '5');
    cy.get('[data-testid=order-review-type]').should('contain', 'Limit');
    cy.get('[data-testid=order-review-price]').should('contain', '150.50');
    cy.get('[data-testid=order-review-side]').should('contain', 'Sell');
    
    // Confirm order
    cy.get('[data-testid=confirm-order-button]').click();
    
    // Wait for API call
    cy.wait('@createOrder');
    
    // Check success message
    cy.get('[data-testid=order-success-message]').should('be.visible');
  });

  it('should view order history', () => {
    // Navigate to orders page
    cy.visit('/trading/orders');
    
    // Check that orders are displayed
    cy.get('[data-testid=orders-table]').should('be.visible');
    cy.get('[data-testid=orders-table-row]').should('have.length.at.least', 1);
  });

  it('should cancel an open order', () => {
    // Intercept orders API call
    cy.intercept('GET', '**/api/trading/orders').as('getOrders');
    
    // Navigate to orders page
    cy.visit('/trading/orders');
    
    // Wait for orders to load
    cy.wait('@getOrders');
    
    // Find an open order and cancel it
    cy.get('[data-testid=orders-table-row]').contains('Open').parent().within(() => {
      cy.get('[data-testid=cancel-order-button]').click();
    });
    
    // Confirm cancellation
    cy.get('[data-testid=confirm-cancel-modal]').should('be.visible');
    cy.get('[data-testid=confirm-cancel-button]').click();
    
    // Check success message
    cy.get('[data-testid=cancel-success-message]').should('be.visible');
  });

  it('should view positions', () => {
    // Navigate to positions page
    cy.visit('/trading/positions');
    
    // Check that positions are displayed
    cy.get('[data-testid=positions-table]').should('be.visible');
  });

  it('should view trade history', () => {
    // Navigate to trade history page
    cy.visit('/trading/history');
    
    // Check that trade history is displayed
    cy.get('[data-testid=trade-history-table]').should('be.visible');
  });
});