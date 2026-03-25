import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ContentSanitizer } from "./validation";

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Middleware for API validation and security
export class ApiMiddleware {
  // Rate limiting middleware
  static rateLimit(maxRequests: number, windowMs: number) {
    return (req: NextRequest, next: () => Promise<NextResponse>) => {
      const clientId = this.getClientId(req);
      const key = `rate_limit:${clientId}`;
      const now = Date.now();
      
      const record = rateLimitStore.get(key);
      
      if (!record || now > record.resetTime) {
        // New window or expired
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      if (record.count >= maxRequests) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
      
      record.count++;
      return next();
    };
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

  // CORS middleware
  static cors(allowedOrigins: string[] = []) {
    return (req: NextRequest, next: () => Promise<NextResponse>) => {
      const origin = req.headers.get("origin");
      
      if (allowedOrigins.includes(origin || "") || allowedOrigins.includes("*")) {
        const response = next();
        
        // Add CORS headers
        response.then(res => {
          res.headers.set("Access-Control-Allow-Origin", origin || "*");
          res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.headers.set("Access-Control-Allow-Credentials", "true");
        });
        
        return response;
      }
      
      return NextResponse.json(
        { error: "CORS policy violation" },
        { status: 403 }
      );
    };
  }

  // Security headers middleware
  static securityHeaders() {
    return (req: NextRequest, next: () => Promise<NextResponse>) => {
      const response = next();
      
      response.then(res => {
        // Prevent MIME type sniffing
        res.headers.set("X-Content-Type-Options", "nosniff");
        
        // Prevent clickjacking
        res.headers.set("X-Frame-Options", "DENY");
        
        // Enable XSS protection
        res.headers.set("X-XSS-Protection", "1; mode=block");
        
        // Force HTTPS
        res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        
        // Content Security Policy
        res.headers.set(
          "Content-Security-Policy",
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
        );
        
        // Referrer policy
        res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      });
      
      return response;
    };
  }

  // Authentication middleware (placeholder - integrate with your auth system)
  static requireAuth() {
    return async (req: NextRequest, next: () => Promise<NextResponse>) => {
      const token = req.headers.get("authorization")?.replace("Bearer ", "");
      
      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      
      // TODO: Validate token with your auth system
      // const user = await validateToken(token);
      // if (!user) {
      //   return NextResponse.json(
      //     { error: "Invalid token" },
      //     { status: 401 }
      //   );
      // }
      
      // (req as any).user = user;
      
      return next();
    };
  }

  // Helper methods
  private static getClientId(req: NextRequest): string {
    // Use IP address as client identifier
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

// Utility function to compose middleware
export function composeMiddleware(...middlewares: Array<(req: NextRequest, next: () => Promise<NextResponse>) => Promise<NextResponse> | NextResponse>) {
  return async (req: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> => {
    let index = 0;
    
    const dispatch = async (): Promise<NextResponse> => {
      if (index >= middlewares.length) {
        return handler();
      }
      
      const middleware = middlewares[index++];
      return middleware(req, dispatch);
    };
    
    return dispatch();
  };
}

// Pre-configured middleware chains
export const publicApiChain = composeMiddleware(
  ApiMiddleware.securityHeaders(),
  ApiMiddleware.rateLimit(100, 60 * 1000), // 100 requests per minute
  ApiMiddleware.sanitizeInput()
);

export const protectedApiChain = composeMiddleware(
  ApiMiddleware.securityHeaders(),
  ApiMiddleware.rateLimit(60, 60 * 1000), // 60 requests per minute
  ApiMiddleware.requireAuth(),
  ApiMiddleware.sanitizeInput()
);

export const strictApiChain = composeMiddleware(
  ApiMiddleware.securityHeaders(),
  ApiMiddleware.rateLimit(10, 60 * 1000), // 10 requests per minute
  ApiMiddleware.requireAuth(),
  ApiMiddleware.sanitizeInput()
);
