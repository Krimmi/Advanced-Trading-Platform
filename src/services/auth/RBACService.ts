/**
 * Role-Based Access Control (RBAC) Service
 * 
 * This service provides role-based access control functionality for the application,
 * allowing fine-grained control over user permissions and access to features.
 */

// Define permission types
export enum Permission {
  // User management permissions
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  
  // Strategy permissions
  VIEW_STRATEGIES = 'view_strategies',
  CREATE_STRATEGY = 'create_strategy',
  EDIT_STRATEGY = 'edit_strategy',
  DELETE_STRATEGY = 'delete_strategy',
  DEPLOY_STRATEGY = 'deploy_strategy',
  
  // Backtesting permissions
  RUN_BACKTEST = 'run_backtest',
  VIEW_BACKTEST_RESULTS = 'view_backtest_results',
  EXPORT_BACKTEST_RESULTS = 'export_backtest_results',
  
  // Trading permissions
  VIEW_TRADING_DASHBOARD = 'view_trading_dashboard',
  PLACE_TRADE = 'place_trade',
  CANCEL_TRADE = 'cancel_trade',
  VIEW_POSITIONS = 'view_positions',
  VIEW_ORDERS = 'view_orders',
  
  // Risk management permissions
  VIEW_RISK_DASHBOARD = 'view_risk_dashboard',
  EDIT_RISK_PARAMETERS = 'edit_risk_parameters',
  OVERRIDE_RISK_LIMITS = 'override_risk_limits',
  
  // Admin permissions
  VIEW_ADMIN_DASHBOARD = 'view_admin_dashboard',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_API_KEYS = 'manage_api_keys'
}

// Define role types
export enum Role {
  ADMIN = 'admin',
  PORTFOLIO_MANAGER = 'portfolio_manager',
  TRADER = 'trader',
  ANALYST = 'analyst',
  RISK_MANAGER = 'risk_manager',
  COMPLIANCE_OFFICER = 'compliance_officer',
  READ_ONLY = 'read_only'
}

// Define role-permission mappings
const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // Admins have all permissions
    ...Object.values(Permission)
  ],
  
  [Role.PORTFOLIO_MANAGER]: [
    // User management (limited)
    Permission.VIEW_USERS,
    
    // Strategy permissions
    Permission.VIEW_STRATEGIES,
    Permission.CREATE_STRATEGY,
    Permission.EDIT_STRATEGY,
    Permission.DELETE_STRATEGY,
    Permission.DEPLOY_STRATEGY,
    
    // Backtesting permissions
    Permission.RUN_BACKTEST,
    Permission.VIEW_BACKTEST_RESULTS,
    Permission.EXPORT_BACKTEST_RESULTS,
    
    // Trading permissions
    Permission.VIEW_TRADING_DASHBOARD,
    Permission.PLACE_TRADE,
    Permission.CANCEL_TRADE,
    Permission.VIEW_POSITIONS,
    Permission.VIEW_ORDERS,
    
    // Risk management permissions
    Permission.VIEW_RISK_DASHBOARD,
    Permission.EDIT_RISK_PARAMETERS
  ],
  
  [Role.TRADER]: [
    // Strategy permissions (limited)
    Permission.VIEW_STRATEGIES,
    
    // Backtesting permissions
    Permission.RUN_BACKTEST,
    Permission.VIEW_BACKTEST_RESULTS,
    
    // Trading permissions
    Permission.VIEW_TRADING_DASHBOARD,
    Permission.PLACE_TRADE,
    Permission.CANCEL_TRADE,
    Permission.VIEW_POSITIONS,
    Permission.VIEW_ORDERS,
    
    // Risk management permissions (limited)
    Permission.VIEW_RISK_DASHBOARD
  ],
  
  [Role.ANALYST]: [
    // Strategy permissions (limited)
    Permission.VIEW_STRATEGIES,
    Permission.CREATE_STRATEGY,
    Permission.EDIT_STRATEGY,
    
    // Backtesting permissions
    Permission.RUN_BACKTEST,
    Permission.VIEW_BACKTEST_RESULTS,
    Permission.EXPORT_BACKTEST_RESULTS,
    
    // Trading permissions (limited)
    Permission.VIEW_TRADING_DASHBOARD,
    Permission.VIEW_POSITIONS,
    Permission.VIEW_ORDERS,
    
    // Risk management permissions (limited)
    Permission.VIEW_RISK_DASHBOARD
  ],
  
  [Role.RISK_MANAGER]: [
    // Strategy permissions (limited)
    Permission.VIEW_STRATEGIES,
    
    // Backtesting permissions
    Permission.VIEW_BACKTEST_RESULTS,
    
    // Trading permissions (limited)
    Permission.VIEW_TRADING_DASHBOARD,
    Permission.VIEW_POSITIONS,
    Permission.VIEW_ORDERS,
    
    // Risk management permissions
    Permission.VIEW_RISK_DASHBOARD,
    Permission.EDIT_RISK_PARAMETERS,
    Permission.OVERRIDE_RISK_LIMITS
  ],
  
  [Role.COMPLIANCE_OFFICER]: [
    // User management (limited)
    Permission.VIEW_USERS,
    
    // Strategy permissions (limited)
    Permission.VIEW_STRATEGIES,
    
    // Trading permissions (limited)
    Permission.VIEW_TRADING_DASHBOARD,
    Permission.VIEW_POSITIONS,
    Permission.VIEW_ORDERS,
    
    // Risk management permissions (limited)
    Permission.VIEW_RISK_DASHBOARD,
    
    // Admin permissions (limited)
    Permission.VIEW_AUDIT_LOGS
  ],
  
  [Role.READ_ONLY]: [
    // Strategy permissions (limited)
    Permission.VIEW_STRATEGIES,
    
    // Backtesting permissions (limited)
    Permission.VIEW_BACKTEST_RESULTS,
    
    // Trading permissions (limited)
    Permission.VIEW_TRADING_DASHBOARD,
    Permission.VIEW_POSITIONS,
    Permission.VIEW_ORDERS,
    
    // Risk management permissions (limited)
    Permission.VIEW_RISK_DASHBOARD
  ]
};

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  customPermissions?: Permission[]; // Additional permissions not granted by roles
  restrictedPermissions?: Permission[]; // Permissions to be removed despite role grants
}

/**
 * Role-Based Access Control Service
 */
export class RBACService {
  private static instance: RBACService;
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Check if a user has a specific permission
   * @param user User to check
   * @param permission Permission to check
   * @returns True if the user has the permission
   */
  public hasPermission(user: User, permission: Permission): boolean {
    // Check if the permission is explicitly restricted
    if (user.restrictedPermissions?.includes(permission)) {
      return false;
    }
    
    // Check if the permission is explicitly granted
    if (user.customPermissions?.includes(permission)) {
      return true;
    }
    
    // Check if any of the user's roles grant the permission
    return user.roles.some(role => rolePermissions[role]?.includes(permission));
  }
  
  /**
   * Check if a user has all of the specified permissions
   * @param user User to check
   * @param permissions Permissions to check
   * @returns True if the user has all permissions
   */
  public hasAllPermissions(user: User, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }
  
  /**
   * Check if a user has any of the specified permissions
   * @param user User to check
   * @param permissions Permissions to check
   * @returns True if the user has any of the permissions
   */
  public hasAnyPermission(user: User, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }
  
  /**
   * Get all permissions for a user
   * @param user User to get permissions for
   * @returns Array of permissions
   */
  public getUserPermissions(user: User): Permission[] {
    // Start with role-based permissions
    const roleBasedPermissions = user.roles.flatMap(role => rolePermissions[role] || []);
    
    // Add custom permissions
    const allPermissions = [...new Set([...roleBasedPermissions, ...(user.customPermissions || [])])];
    
    // Remove restricted permissions
    return allPermissions.filter(permission => !user.restrictedPermissions?.includes(permission));
  }
  
  /**
   * Check if a user has a specific role
   * @param user User to check
   * @param role Role to check
   * @returns True if the user has the role
   */
  public hasRole(user: User, role: Role): boolean {
    return user.roles.includes(role);
  }
  
  /**
   * Check if a user has any of the specified roles
   * @param user User to check
   * @param roles Roles to check
   * @returns True if the user has any of the roles
   */
  public hasAnyRole(user: User, roles: Role[]): boolean {
    return user.roles.some(role => roles.includes(role));
  }
  
  /**
   * Get all permissions for a role
   * @param role Role to get permissions for
   * @returns Array of permissions
   */
  public getRolePermissions(role: Role): Permission[] {
    return rolePermissions[role] || [];
  }
}

// Export singleton instance
export const rbacService = RBACService.getInstance();