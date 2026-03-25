import { NextRequest, NextResponse } from "next/server";

// DDoS Protection Configuration
export interface DdosConfig {
  // Rate limiting
  globalLimit: number;
  windowMs: number;
  
  // IP-based limits
  ipLimit: number;
  ipWindowMs: number;
  
  // User-based limits
  userLimit: number;
  userWindowMs: number;
  
  // Endpoint-specific limits
  endpointLimits: Record<string, { limit: number; windowMs: number }>;
  
  // DDoS detection thresholds
  suspiciousThreshold: number;
  blockThreshold: number;
  blockDuration: number;
  
  // Advanced protection
  enableCaptcha: boolean;
  enableProgressiveDelays: boolean;
  enableIpWhitelist: boolean;
  enableIpBlacklist: boolean;
}

// Default configuration
export const defaultDdosConfig: DdosConfig = {
  globalLimit: 10000, // 10k requests per minute globally
  windowMs: 60 * 1000, // 1 minute
  
  ipLimit: 100, // 100 requests per minute per IP
  ipWindowMs: 60 * 1000, // 1 minute
  
  userLimit: 60, // 60 requests per minute per user
  userWindowMs: 60 * 1000, // 1 minute
  
  endpointLimits: {
    // Authentication endpoints (stricter limits)
    "/api/auth/sign-in": { limit: 10, windowMs: 60 * 1000 },
    "/api/auth/sign-up": { limit: 5, windowMs: 60 * 1000 },
    "/api/auth/reset-password": { limit: 3, windowMs: 60 * 1000 },
    
    // Content creation endpoints
    "/api/blog/create": { limit: 10, windowMs: 60 * 1000 },
    "/api/courses/create": { limit: 5, windowMs: 60 * 1000 },
    "/api/mentorship/request": { limit: 10, windowMs: 60 * 1000 },
    
    // File upload endpoints
    "/api/upload": { limit: 20, windowMs: 60 * 1000 },
    
    // Search endpoints
    "/api/search": { limit: 30, windowMs: 60 * 1000 },
  },
  
  suspiciousThreshold: 50, // 50 requests triggers suspicion
  blockThreshold: 100, // 100 requests triggers block
  blockDuration: 15 * 60 * 1000, // 15 minutes
  
  enableCaptcha: true,
  enableProgressiveDelays: true,
  enableIpWhitelist: true,
  enableIpBlacklist: true,
};

// In-memory storage (in production, use Redis)
const rateLimitStore = new Map<string, {
  count: number;
  resetTime: number;
  lastAccess: number;
  suspicious: boolean;
  blocked: boolean;
  blockExpiry?: number;
}>();

const globalStore = {
  count: 0,
  resetTime: Date.now() + defaultDdosConfig.windowMs,
};

// IP and user tracking
const ipTracker = new Map<string, {
  requests: number;
  lastReset: number;
  suspicious: boolean;
  blocked: boolean;
  blockExpiry?: number;
  patterns: string[];
}>();

const userTracker = new Map<string, {
  requests: number;
  lastReset: number;
  endpoints: Set<string>;
}>();

// IP whitelist and blacklist
const ipWhitelist = new Set<string>([
  // Add trusted IPs (localhost, etc.)
  "127.0.0.1",
  "::1",
]);

const ipBlacklist = new Set<string>([
  // Add known malicious IPs
]);

export class DdosProtection {
  private config: DdosConfig;

  constructor(config: Partial<DdosConfig> = {}) {
    this.config = { ...defaultDdosConfig, ...config };
  }

  // Main protection middleware
  async protect(req: NextRequest): Promise<{ allowed: boolean; response?: NextResponse; delay?: number }> {
    const clientId = this.getClientId(req);
    const userId = this.getUserId(req);
    const pathname = req.nextUrl.pathname;

    // Check IP blacklist
    if (this.config.enableIpBlacklist && this.isIpBlacklisted(clientId)) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        ),
      };
    }

    // Check IP whitelist
    if (this.config.enableIpWhitelist && this.isIpWhitelisted(clientId)) {
      return { allowed: true };
    }

    // Check if IP is blocked
    if (this.isIpBlocked(clientId)) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        ),
      };
    }

    // Global rate limiting
    if (!this.checkGlobalLimit()) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "Service temporarily unavailable" },
          { status: 503 }
        ),
      };
    }

    // IP-based rate limiting
    const ipResult = this.checkIpLimit(clientId);
    if (!ipResult.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          { 
            error: "Too many requests from your IP. Please try again later.",
            retryAfter: ipResult.retryAfter,
          },
          { status: 429 }
        ),
      };
    }

    // User-based rate limiting
    if (userId && !this.checkUserLimit(userId, pathname)) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        ),
      };
    }

    // Endpoint-specific rate limiting
    const endpointResult = this.checkEndpointLimit(pathname);
    if (!endpointResult.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          { 
            error: "Too many requests to this endpoint. Please try again later.",
            retryAfter: endpointResult.retryAfter,
          },
          { status: 429 }
        ),
      };
    }

    // DDoS pattern detection
    const suspiciousActivity = this.detectSuspiciousActivity(clientId, req);
    if (suspiciousActivity) {
      this.handleSuspiciousActivity(clientId, suspiciousActivity);
      
      if (suspiciousActivity.block) {
        return {
          allowed: false,
          response: NextResponse.json(
            { error: "Suspicious activity detected" },
            { status: 429 }
          ),
        };
      }
    }

    // Progressive delays for high-frequency requests
    let delay = 0;
    if (this.config.enableProgressiveDelays) {
      delay = this.calculateProgressiveDelay(clientId);
    }

    return { allowed: true, delay };
  }

  // Global rate limiting
  private checkGlobalLimit(): boolean {
    const now = Date.now();
    
    if (now > globalStore.resetTime) {
      globalStore.count = 0;
      globalStore.resetTime = now + this.config.windowMs;
    }
    
    if (globalStore.count >= this.config.globalLimit) {
      return false;
    }
    
    globalStore.count++;
    return true;
  }

  // IP-based rate limiting
  private checkIpLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    let ipData = ipTracker.get(ip);
    
    if (!ipData || now > ipData.lastReset + this.config.ipWindowMs) {
      ipData = {
        requests: 0,
        lastReset: now,
        suspicious: false,
        blocked: false,
        patterns: [],
      };
      ipTracker.set(ip, ipData);
    }
    
    ipData.requests++;
    
    if (ipData.requests > this.config.ipLimit) {
      const retryAfter = Math.ceil((ipData.lastReset + this.config.ipWindowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    return { allowed: true };
  }

  // User-based rate limiting
  private checkUserLimit(userId: string, endpoint: string): boolean {
    const now = Date.now();
    let userData = userTracker.get(userId);
    
    if (!userData || now > userData.lastReset + this.config.userWindowMs) {
      userData = {
        requests: 0,
        lastReset: now,
        endpoints: new Set(),
      };
      userTracker.set(userId, userData);
    }
    
    userData.requests++;
    userData.endpoints.add(endpoint);
    
    return userData.requests <= this.config.userLimit;
  }

  // Endpoint-specific rate limiting
  private checkEndpointLimit(endpoint: string): { allowed: boolean; retryAfter?: number } {
    const limit = this.config.endpointLimits[endpoint];
    if (!limit) return { allowed: true };
    
    const now = Date.now();
    const key = `endpoint:${endpoint}`;
    let data = rateLimitStore.get(key);
    
    if (!data || now > data.resetTime) {
      data = {
        count: 0,
        resetTime: now + limit.windowMs,
        lastAccess: now,
        suspicious: false,
        blocked: false,
      };
      rateLimitStore.set(key, data);
    }
    
    data.count++;
    data.lastAccess = now;
    
    if (data.count > limit.limit) {
      const retryAfter = Math.ceil((data.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    return { allowed: true };
  }

  // DDoS pattern detection
  private detectSuspiciousActivity(ip: string, req: NextRequest): { type: string; block: boolean } | null {
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";
    const pathname = req.nextUrl.pathname;
    
    // Check for suspicious patterns
    const patterns: string[] = [
      // No user agent
      !userAgent ? "no-user-agent" : null,
      
      // Suspicious user agents
      /bot|crawler|spider|scraper/i.test(userAgent) ? "bot-user-agent" : null,
      
      // Rapid endpoint switching
      this.detectRapidEndpointSwitching(ip) ? "rapid-endpoint-switching" : null,
      
      // Unusual request patterns
      this.detectUnusualPatterns(ip, pathname) ? "unusual-patterns" : null,
      
      // Missing headers for sensitive endpoints
      this.isSensitiveEndpoint(pathname) && !req.headers.get("authorization") ? "missing-auth" : null,
    ].filter((pattern): pattern is string => pattern !== null);
    
    const ipData = ipTracker.get(ip);
    if (ipData) {
      ipData.patterns = patterns;
    }
    
    // Block if too many suspicious patterns
    if (patterns.length >= 3) {
      return { type: "multiple-suspicious-patterns", block: true };
    }
    
    // Block if exceeding suspicious threshold
    if (ipData && ipData.requests > this.config.suspiciousThreshold) {
      return { type: "high-frequency-requests", block: ipData.requests > this.config.blockThreshold };
    }
    
    return patterns.length > 0 ? { type: patterns[0] || "unknown", block: false } : null;
  }

  // Handle suspicious activity
  private handleSuspiciousActivity(ip: string, activity: { type: string; block: boolean }) {
    const ipData = ipTracker.get(ip);
    if (!ipData) return;
    
    ipData.suspicious = true;
    
    if (activity.block) {
      ipData.blocked = true;
      ipData.blockExpiry = Date.now() + this.config.blockDuration;
      
      // Log security event
      console.warn(`IP ${ip} blocked for suspicious activity: ${activity.type}`);
    }
  }

  // Progressive delay calculation
  private calculateProgressiveDelay(ip: string): number {
    const ipData = ipTracker.get(ip);
    if (!ipData) return 0;
    
    // Exponential backoff based on request count
    const baseDelay = 100; // 100ms
    const multiplier = Math.min(ipData.requests / 10, 10); // Cap at 10x
    return baseDelay * multiplier;
  }

  // Helper methods
  private getClientId(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0] : realIp;
    return ip || "unknown";
  }

  private getUserId(req: NextRequest): string | null {
    // Extract user ID from JWT token or session
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // TODO: Parse JWT and extract user ID
      // For now, return null
      return null;
    }
    return null;
  }

  private isIpBlacklisted(ip: string): boolean {
    return ipBlacklist.has(ip);
  }

  private isIpWhitelisted(ip: string): boolean {
    return ipWhitelist.has(ip);
  }

  private isIpBlocked(ip: string): boolean {
    const ipData = ipTracker.get(ip);
    if (!ipData || !ipData.blocked) return false;
    
    if (ipData.blockExpiry && Date.now() > ipData.blockExpiry) {
      // Unblock if expired
      ipData.blocked = false;
      ipData.blockExpiry = undefined;
      return false;
    }
    
    return true;
  }

  private isSensitiveEndpoint(pathname: string): boolean {
    return pathname.startsWith("/api/auth") || 
           pathname.startsWith("/api/admin") ||
           pathname.includes("/delete") ||
           pathname.includes("/create");
  }

  private detectRapidEndpointSwitching(ip: string): boolean {
    // Implementation would track recent endpoints for this IP
    // For now, return false
    return false;
  }

  private detectUnusualPatterns(ip: string, pathname: string): boolean {
    // Implementation would detect unusual access patterns
    // For now, return false
    return false;
  }

  // Management methods
  static addToIpWhitelist(ip: string): void {
    ipWhitelist.add(ip);
  }

  static addToIpBlacklist(ip: string): void {
    ipBlacklist.add(ip);
  }

  static removeFromIpWhitelist(ip: string): void {
    ipWhitelist.delete(ip);
  }

  static removeFromIpBlacklist(ip: string): void {
    ipBlacklist.delete(ip);
  }

  static getIpStatus(ip: string): {
    whitelisted: boolean;
    blacklisted: boolean;
    blocked: boolean;
    requests: number;
    suspicious: boolean;
  } {
    const ipData = ipTracker.get(ip);
    
    return {
      whitelisted: ipWhitelist.has(ip),
      blacklisted: ipBlacklist.has(ip),
      blocked: ipData?.blocked || false,
      requests: ipData?.requests || 0,
      suspicious: ipData?.suspicious || false,
    };
  }

  // Cleanup expired entries
  static cleanup(): void {
    const now = Date.now();
    
    // Cleanup IP tracker
    for (const [ip, data] of ipTracker.entries()) {
      if (now > data.lastReset + defaultDdosConfig.ipWindowMs * 2) {
        ipTracker.delete(ip);
      }
    }
    
    // Cleanup user tracker
    for (const [userId, data] of userTracker.entries()) {
      if (now > data.lastReset + defaultDdosConfig.userWindowMs * 2) {
        userTracker.delete(userId);
      }
    }
    
    // Cleanup rate limit store
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime + 60000) { // 1 minute after expiry
        rateLimitStore.delete(key);
      }
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => DdosProtection.cleanup(), 5 * 60 * 1000);
}
