import { NextRequest, NextResponse } from "next/server";
import { apiChains } from "@/lib/enhanced-api-middleware";
import { z } from "zod";

// Example schema for validation
const requestSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().optional(),
});

// Protected API endpoint with DDoS protection
export async function POST(req: NextRequest) {
  return apiChains.protected(req, async () => {
    try {
      // Get validated data from middleware
      const data = (req as any).validatedData || await req.json();
      
      // Validate the request
      const validatedData = requestSchema.parse(data);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: "Request processed successfully",
        data: {
          originalMessage: validatedData.message,
          processedAt: new Date().toISOString(),
          requestId: Math.random().toString(36).substring(7),
        },
      });
      
    } catch (error) {
      console.error("API Error:", error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Validation failed",
            details: error.errors.map(e => e.message).join(", ")
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

// GET endpoint with public access
export async function GET(req: NextRequest) {
  return apiChains.public(req, async () => {
    return NextResponse.json({
      message: "This is a public endpoint with DDoS protection",
      timestamp: new Date().toISOString(),
      rateLimit: {
        limit: 100,
        window: "1 minute",
      },
    });
  });
}

// Admin-only endpoint
export async function PUT(req: NextRequest) {
  return apiChains.admin(req, async () => {
    const data = await req.json();
    
    // Simulate admin operation
    return NextResponse.json({
      success: true,
      message: "Admin operation completed",
      data: {
        operation: data.operation,
        executedBy: (req as any).user?.id,
        timestamp: new Date().toISOString(),
      },
    });
  });
}

// Strict endpoint with multiple protections
export async function DELETE(req: NextRequest) {
  return apiChains.strict(req, async () => {
    const data = await req.json();
    
    // Simulate sensitive operation
    return NextResponse.json({
      success: true,
      message: "Sensitive operation completed",
      data: {
        deletedItems: data.items?.length || 0,
        timestamp: new Date().toISOString(),
      },
    });
  });
}
