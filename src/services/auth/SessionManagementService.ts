/**
 * Session Management Service
 * 
 * This service provides enhanced session management functionality for the application,
 * including session tracking, expiration, and security features.
 */

import * as crypto from 'crypto';
import { User } from './RBACService';

// Session interface
export interface Session {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  isActive: boolean;
  isMfaVerified: boolean;
  mfaVerifiedAt?: Date;
}

// Session creation options
export interface SessionOptions {
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  duration?: number; // Duration in minutes
  requireMfa?: boolean;
}

/**
 * Session Management Service
 */
export class SessionManagementService {
  private static instance: SessionManagementService;
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> Set of sessionIds
  private readonly DEFAULT_SESSION_DURATION = 60; // 60 minutes
  private readonly SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): SessionManagementService {
    if (!SessionManagementService.instance) {
      SessionManagementService.instance = new SessionManagementService();
    }
    return SessionManagementService.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Start the cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupExpiredSessions(), this.SESSION_CLEANUP_INTERVAL);
  }
  
  /**
   * Create a new session
   * @param options Session options
   * @returns Created session
   */
  public createSession(options: SessionOptions): Session {
    const {
      userId,
      ipAddress,
      userAgent,
      deviceId,
      duration = this.DEFAULT_SESSION_DURATION,
      requireMfa = false
    } = options;
    
    // Generate session ID and token
    const sessionId = crypto.randomBytes(16).toString('hex');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration time
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMinutes(expiresAt.getMinutes() + duration);
    
    // Create the session
    const session: Session = {
      id: sessionId,
      userId,
      token,
      createdAt: now,
      expiresAt,
      lastActivityAt: now,
      ipAddress,
      userAgent,
      deviceId,
      isActive: true,
      isMfaVerified: !requireMfa // If MFA is not required, mark as verified
    };
    
    // Store the session
    this.sessions.set(sessionId, session);
    
    // Add to user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)?.add(sessionId);
    
    return session;
  }
  
  /**
   * Get a session by ID
   * @param sessionId Session ID
   * @returns Session or null if not found
   */
  public getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }
  
  /**
   * Get a session by token
   * @param token Session token
   * @returns Session or null if not found
   */
  public getSessionByToken(token: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.token === token) {
        return session;
      }
    }
    return null;
  }
  
  /**
   * Validate a session
   * @param sessionId Session ID
   * @param token Session token
   * @returns True if the session is valid
   */
  public validateSession(sessionId: string, token: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    // Check if the session is active and not expired
    if (!session.isActive || new Date() > session.expiresAt) {
      return false;
    }
    
    // Check if the token matches
    if (session.token !== token) {
      return false;
    }
    
    // Update last activity time
    session.lastActivityAt = new Date();
    this.sessions.set(sessionId, session);
    
    return true;
  }
  
  /**
   * Extend a session's expiration time
   * @param sessionId Session ID
   * @param duration Duration in minutes
   * @returns Updated session or null if not found
   */
  public extendSession(sessionId: string, duration: number): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Calculate new expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + duration);
    
    // Update the session
    session.expiresAt = expiresAt;
    session.lastActivityAt = new Date();
    this.sessions.set(sessionId, session);
    
    return session;
  }
  
  /**
   * Invalidate a session
   * @param sessionId Session ID
   * @returns True if the session was invalidated
   */
  public invalidateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    // Mark the session as inactive
    session.isActive = false;
    this.sessions.set(sessionId, session);
    
    return true;
  }
  
  /**
   * Invalidate all sessions for a user
   * @param userId User ID
   * @returns Number of sessions invalidated
   */
  public invalidateUserSessions(userId: string): number {
    const sessionIds = this.userSessions.get(userId);
    
    if (!sessionIds) {
      return 0;
    }
    
    let count = 0;
    
    for (const sessionId of sessionIds) {
      if (this.invalidateSession(sessionId)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Mark a session as MFA verified
   * @param sessionId Session ID
   * @returns Updated session or null if not found
   */
  public markSessionMfaVerified(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Mark the session as MFA verified
    session.isMfaVerified = true;
    session.mfaVerifiedAt = new Date();
    this.sessions.set(sessionId, session);
    
    return session;
  }
  
  /**
   * Get all active sessions for a user
   * @param userId User ID
   * @returns Array of active sessions
   */
  public getUserActiveSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId);
    
    if (!sessionIds) {
      return [];
    }
    
    const now = new Date();
    const activeSessions: Session[] = [];
    
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      
      if (session && session.isActive && session.expiresAt > now) {
        activeSessions.push(session);
      }
    }
    
    return activeSessions;
  }
  
  /**
   * Clean up expired sessions
   * @returns Number of sessions cleaned up
   */
  private cleanupExpiredSessions(): number {
    const now = new Date();
    let count = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now || !session.isActive) {
        // Remove from user sessions
        this.userSessions.get(session.userId)?.delete(sessionId);
        
        // Remove the session
        this.sessions.delete(sessionId);
        count++;
      }
    }
    
    // Clean up empty user session sets
    for (const [userId, sessionIds] of this.userSessions.entries()) {
      if (sessionIds.size === 0) {
        this.userSessions.delete(userId);
      }
    }
    
    return count;
  }
  
  /**
   * Get session statistics
   * @returns Session statistics
   */
  public getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    mfaVerifiedSessions: number;
    uniqueUsers: number;
  } {
    const now = new Date();
    let activeSessions = 0;
    let expiredSessions = 0;
    let mfaVerifiedSessions = 0;
    
    for (const session of this.sessions.values()) {
      if (session.isActive && session.expiresAt > now) {
        activeSessions++;
        
        if (session.isMfaVerified) {
          mfaVerifiedSessions++;
        }
      } else {
        expiredSessions++;
      }
    }
    
    return {
      totalSessions: this.sessions.size,
      activeSessions,
      expiredSessions,
      mfaVerifiedSessions,
      uniqueUsers: this.userSessions.size
    };
  }
  
  /**
   * Destroy the service (for testing)
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.sessions.clear();
    this.userSessions.clear();
  }
}

// Export singleton instance
export const sessionManagementService = SessionManagementService.getInstance();