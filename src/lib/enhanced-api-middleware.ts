import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ContentSanitizer } from "./validation";
import { DdosProtection, DdosConfig } from "./ddos-protection";

// Enhanced API middleware with DDoS protection
export class EnhancedApiMiddleware {
  private ddosProtection: DdosProtection;

  constructor(ddosConfig?: Partial<DdosConfig>) {
    this.ddosProtection = new DdosProtection(ddosConfig);
  }

  // Main middleware function
  async middleware(req: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> {
    try {
      // 1. DDoS Protection
      const protectionResult = await this.ddosProtection.protect(req);
      
      if (!protectionResult.allowed) {
        return protectionResult.response || NextResponse.json(
          { error: "Request blocked" },
          { status: 429 }
        );
      }

      // 2. Apply progressive delay if needed
      if (protectionResult.delay && protectionResult.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, protectionResult.delay));
      }

      // 3. Security Headers
      const response = await this.withSecurityHeaders(req, handler);

      // 4. Rate Limit Headers
      this.addRateLimitHeaders(response, req);

      return response;

    } catch (error) {
      console.error("Middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }

  // Security headers middleware
  private async withSecurityHeaders(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const response = await handler();
    
    // Prevent MIME type sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");
    
    // Prevent clickjacking
    response.headers.set("X-Frame-Options", "DENY");
    
    // Enable XSS protection
    response.headers.set("X-XSS-Protection", "1; mode=block");
    
    // Force HTTPS
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    
    // Content Security Policy
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    );
    
    // Referrer policy
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Permissions policy
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );
    
    return response;
  }

  // Add rate limit headers
  private addRateLimitHeaders(response: NextResponse, req: NextRequest): void {
    const clientId = EnhancedApiMiddleware.getClientId(req);
    const ipStatus = DdosProtection.getIpStatus(clientId);
    
    response.headers.set("X-RateLimit-Limit", "100");
    response.headers.set("X-RateLimit-Remaining", Math.max(0, 100 - ipStatus.requests).toString());
    response.headers.set("X-RateLimit-Reset", new Date(Date.now() + 60000).toISOString());
    
    if (ipStatus.blocked) {
      response.headers.set("X-RateLimit-Retry-After", "900"); // 15 minutes
    }
  }

  // Input validation middleware
  static validateInput(schema: z.ZodSchema) {
    return async (req: NextRequest, next: () => Promise<NextResponse>) => {
      try {
        const body = await req.json();
        const validatedData = await schema.parseAsync(body);
        
        // Store validated data for use in the handler
        (req as any).validatedData = validatedData;
        
        return next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return NextResponse.json(
            { error: firstError?.message || "Validation failed" },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: "Invalid request data" },
          { status: 400 }
        );
      }
    };
  }

  // XSS protection middleware
  static sanitizeInput() {
    return async (req: NextRequest, next: () => Promise<NextResponse>) => {
      const body = await req.json();
      
      const sanitized = this.sanitizeObject(body);
      
      (req as any).validatedData = sanitized;
      
      return next();
    };
  }

  // CORS middleware with enhanced security
  static cors(allowedOrigins: string[] = []) {
    return (req: NextRequest, next: () => Promise<NextResponse>) => {
      const origin = req.headers.get("origin");
      
      // Check if origin is allowed
      const isAllowed = allowedOrigins.includes(origin || "") || 
                       allowedOrigins.includes("*") ||
                       (!origin && req.headers.get("host")?.includes("localhost"));
      
      if (isAllowed) {
        const response = next();
        
        response.then(res => {
          res.headers.set("Access-Control-Allow-Origin", origin || "*");
          res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
          res.headers.set("Access-Control-Allow-Credentials", "true");
          res.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
          res.headers.set("Vary", "Origin");
        });
        
        return response;
      }
      
      return NextResponse.json(
        { error: "CORS policy violation" },
        { status: 403 }
      );
    };
  }

  // Authentication middleware with enhanced security
  static requireAuth(options: { 
    requireVerified?: boolean;
    roles?: string[];
    permissions?: string[];
  } = {}) {
    return async (req: NextRequest, next: () => Promise<NextResponse>) => {
      const token = req.headers.get("authorization")?.replace("Bearer ", "");
      
      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      try {
        // TODO: Validate token with your auth system
        // const user = await validateToken(token);
        const user = { 
          id: "user123", 
          verified: true, 
          role: "user", 
          permissions: ["read", "write"] 
        };

        if (options.requireVerified && !user.verified) {
          return NextResponse.json(
            { error: "Email verification required" },
            { status: 403 }
          );
        }

        if (options.roles && !options.roles.includes(user.role)) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          );
        }

        if (options.permissions) {
          const hasPermission = options.permissions.some(p => user.permissions.includes(p));
          if (!hasPermission) {
            return NextResponse.json(
              { error: "Insufficient permissions" },
              { status: 403 }
            );
          }
        }
        
        (req as any).user = user;
        
        return next();
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
    };
  }

  // Request size limiting middleware
  static limitRequestSize(maxSize: number = 10 * 1024 * 1024) { // 10MB default
    return async (req: NextRequest, next: () => Promise<NextResponse>) => {
      const contentLength = req.headers.get("content-length");
      
      if (contentLength && parseInt(contentLength) > maxSize) {
        return NextResponse.json(
          { error: `Request too large. Maximum size is ${maxSize} bytes` },
          { status: 413 }
        );
      }
      
      return next();
    };
  }

  // Request timeout middleware
  static timeout(ms: number = 30000) { // 30 seconds default
    return async (req: NextRequest, next: () => Promise<NextResponse>) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), ms);
      });
      
      try {
        return await Promise.race([
          next(),
          timeoutPromise
        ]);
      } catch (error) {
        return NextResponse.json(
          { error: "Request timeout" },
          { status: 408 }
        );
      }
    };
  }

  // IP-based blocking middleware
  static blockIps(blockedIps: string[]) {
    return (req: NextRequest, next: () => Promise<NextResponse>) => {
      const clientId = this.getClientId(req);
      
      if (blockedIps.includes(clientId)) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
      
      return next();
    };
  }

  // Helper methods
  private static getClientId(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0] : realIp;
    return ip || "unknown";
  }

  private static sanitizeObject(obj: any): any {
    if (typeof obj === "string") {
      return ContentSanitizer.sanitizeText(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}

// Pre-configured middleware chains
export const createApiChain = (ddosConfig?: Partial<DdosConfig>) => {
  const middleware = new EnhancedApiMiddleware(ddosConfig);
  
  return {
    // Public API chain (no auth required)
    public: async (req: NextRequest, handler: () => Promise<NextResponse>) => {
      return middleware.middleware(req, handler);
    },

    // Protected API chain (auth required)
    protected: async (req: NextRequest, handler: () => Promise<NextResponse>) => {
      return middleware.middleware(
        req,
        async () => {
          const authMiddleware = EnhancedApiMiddleware.requireAuth();
          return authMiddleware(req, handler);
        }
      );
    },

    // Admin API chain (admin auth required)
    admin: async (req: NextRequest, handler: () => Promise<NextResponse>) => {
      return middleware.middleware(
        req,
        async () => {
          const authMiddleware = EnhancedApiMiddleware.requireAuth({ roles: ["admin"] });
          return authMiddleware(req, handler);
        }
      );
    },

    // Strict API chain (multiple protections)
    strict: async (req: Request, handler: () => Promise<NextResponse>) => {
      return middleware.middleware(
        req as NextRequest,
        async () => {
          const sizeLimit = EnhancedApiMiddleware.limitRequestSize(1024 * 1024); // 1MB
          const timeout = EnhancedApiMiddleware.timeout(10000); // 10 seconds
          const auth = EnhancedApiMiddleware.requireAuth();
          
          return timeout(req as NextRequest, async () => {
            return sizeLimit(req as NextRequest, async () => {
              return auth(req as NextRequest, handler);
            }) as Promise<NextResponse>;
          }) as Promise<NextResponse>;
        }
      );
    },
  };
};

// Default instance
export const apiChains = createApiChain();
