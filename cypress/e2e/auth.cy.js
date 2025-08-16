describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate to login page', () => {
    cy.get('[data-testid=login-link]').click();
    cy.url().should('include', '/login');
    cy.get('[data-testid=login-form]').should('be.visible');
  });

  it('should show validation errors for empty login form', () => {
    cy.visit('/login');
    cy.get('[data-testid=login-button]').click();
    cy.get('[data-testid=email-error]').should('be.visible');
    cy.get('[data-testid=password-error]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type('invalid@example.com');
    cy.get('[data-testid=password-input]').type('wrongpassword');
    cy.get('[data-testid=login-button]').click();
    cy.get('[data-testid=login-error]').should('be.visible');
  });

  it('should register a new user', () => {
    const email = `test${Date.now()}@example.com`;
    const password = 'Password123!';

    cy.visit('/register');
    cy.get('[data-testid=name-input]').type('Test User');
    cy.get('[data-testid=email-input]').type(email);
    cy.get('[data-testid=password-input]').type(password);
    cy.get('[data-testid=confirm-password-input]').type(password);
    cy.get('[data-testid=register-button]').click();
    
    // Should redirect to dashboard or welcome page
    cy.url().should('not.include', '/register');
    cy.get('[data-testid=user-menu]').should('be.visible');
  });

  it('should login successfully', () => {
    // Using test account - in a real test, you'd use a fixture or test account
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type(Cypress.env('TEST_USER_EMAIL') || 'test@example.com');
    cy.get('[data-testid=password-input]').type(Cypress.env('TEST_USER_PASSWORD') || 'Password123!');
    cy.get('[data-testid=login-button]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=user-menu]').should('be.visible');
  });

  it('should logout successfully', () => {
    // Login first using custom command
    cy.login(Cypress.env('TEST_USER_EMAIL') || 'test@example.com', 
             Cypress.env('TEST_USER_PASSWORD') || 'Password123!');
    
    // Then logout
    cy.get('[data-testid=user-menu]').click();
    cy.get('[data-testid=logout-button]').click();
    
    // Should redirect to home or login page
    cy.get('[data-testid=login-link]').should('be.visible');
  });
});