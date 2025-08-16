// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type(email);
    cy.get('[data-testid=password-input]').type(password);
    cy.get('[data-testid=login-button]').click();
    cy.url().should('not.include', '/login');
    cy.get('[data-testid=user-menu]').should('be.visible');
  });
});

// Custom command to select a stock from search
Cypress.Commands.add('searchAndSelectStock', (symbol) => {
  cy.get('[data-testid=search-input]').type(symbol);
  cy.get('[data-testid=search-results]').should('be.visible');
  cy.get(`[data-testid=search-result-${symbol}]`).click();
  cy.url().should('include', `/stocks/${symbol}`);
});

// Custom command to create a portfolio
Cypress.Commands.add('createPortfolio', (name, description) => {
  cy.visit('/portfolios');
  cy.get('[data-testid=create-portfolio-button]').click();
  cy.get('[data-testid=portfolio-name-input]').type(name);
  cy.get('[data-testid=portfolio-description-input]').type(description);
  cy.get('[data-testid=save-portfolio-button]').click();
  cy.contains(name).should('be.visible');
});

// Custom command to place an order
Cypress.Commands.add('placeOrder', (symbol, side, quantity, orderType, price = null) => {
  cy.visit(`/stocks/${symbol}`);
  cy.get('[data-testid=trade-button]').click();
  cy.get(`[data-testid=${side}-tab]`).click();
  cy.get('[data-testid=quantity-input]').clear().type(quantity);
  cy.get('[data-testid=order-type-select]').select(orderType);
  
  if (orderType === 'limit' && price) {
    cy.get('[data-testid=price-input]').clear().type(price);
  }
  
  cy.get('[data-testid=review-order-button]').click();
  cy.get('[data-testid=confirm-order-button]').click();
  cy.get('[data-testid=order-success-message]').should('be.visible');
});

// Custom command to check if element is in viewport
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  const bottom = Cypress.$(cy.state('window')).height();
  const rect = subject[0].getBoundingClientRect();
  
  expect(rect.top).to.be.lessThan(bottom);
  expect(rect.bottom).to.be.greaterThan(0);
  
  return subject;
});

// Custom command to wait for API request to complete
Cypress.Commands.add('waitForAPI', (route) => {
  cy.intercept(route).as('apiRequest');
  cy.wait('@apiRequest');
});

// Custom command to run a backtest
Cypress.Commands.add('runBacktest', (strategyName, symbol, startDate, endDate, initialCapital) => {
  cy.visit('/strategies');
  cy.contains(strategyName).click();
  cy.get('[data-testid=backtest-button]').click();
  cy.get('[data-testid=backtest-symbol-input]').type(symbol);
  cy.get('[data-testid=backtest-start-date]').type(startDate);
  cy.get('[data-testid=backtest-end-date]').type(endDate);
  cy.get('[data-testid=backtest-initial-capital]').clear().type(initialCapital);
  cy.get('[data-testid=run-backtest-button]').click();
  cy.get('[data-testid=backtest-loading]', { timeout: 30000 }).should('not.exist');
  cy.get('[data-testid=backtest-results]').should('be.visible');
});

// Custom command to add symbol to watchlist
Cypress.Commands.add('addToWatchlist', (symbol) => {
  cy.visit('/watchlist');
  cy.get('[data-testid=add-symbol-button]').click();
  cy.get('[data-testid=symbol-input]').type(`${symbol}{enter}`);
  cy.get('[data-testid=watchlist-table]').contains(symbol).should('be.visible');
});

// Custom command to check risk metrics
Cypress.Commands.add('checkRiskMetrics', (portfolioName) => {
  cy.visit('/risk');
  cy.get('[data-testid=portfolio-select]').select(portfolioName);
  cy.get('[data-testid=calculate-risk-button]').click();
  cy.get('[data-testid=risk-metrics]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid=var-value]').should('be.visible');
  cy.get('[data-testid=sharpe-ratio]').should('be.visible');
  cy.get('[data-testid=max-drawdown]').should('be.visible');
});

// Custom command to toggle theme
Cypress.Commands.add('toggleTheme', () => {
  cy.get('[data-testid=theme-toggle]').click();
});

// Custom command to check notification
Cypress.Commands.add('checkNotification', (message) => {
  cy.get('[data-testid=notification]').should('be.visible');
  cy.get('[data-testid=notification]').should('contain', message);
});

// Custom command to navigate to a specific dashboard section
Cypress.Commands.add('navigateToDashboardSection', (section) => {
  const sectionMap = {
    'overview': '[data-testid=nav-dashboard]',
    'portfolio': '[data-testid=nav-portfolio]',
    'trading': '[data-testid=nav-trading]',
    'analytics': '[data-testid=nav-analytics]',
    'risk': '[data-testid=nav-risk]',
    'strategies': '[data-testid=nav-strategies]',
    'watchlist': '[data-testid=nav-watchlist]',
    'settings': '[data-testid=user-menu], [data-testid=settings-link]'
  };
  
  if (section === 'settings') {
    cy.get(sectionMap.settings.split(', ')[0]).click();
    cy.get(sectionMap.settings.split(', ')[1]).click();
  } else {
    cy.get(sectionMap[section]).click();
  }
});

// Custom command to verify chart rendering
Cypress.Commands.add('verifyChart', (chartSelector) => {
  cy.get(chartSelector).should('be.visible');
  cy.get(`${chartSelector} canvas`).should('be.visible');
  // Check if chart has rendered by looking for SVG elements or canvas content
  cy.get(`${chartSelector} canvas`).should(($canvas) => {
    // Check if canvas has content by checking if it has a non-zero width and height
    expect($canvas.width()).to.be.greaterThan(0);
    expect($canvas.height()).to.be.greaterThan(0);
  });
});