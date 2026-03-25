import { useCallback } from "react";
import { z } from "zod";
import { toast } from "sonner";

interface ValidationOptions {
  schema: z.ZodSchema;
  onSuccess?: (data: any) => void;
  onError?: (error: z.ZodError) => void;
  showToast?: boolean;
}

export const useValidation = () => {
  const validateAndExecute = useCallback(
    async <T>(
      data: unknown,
      { schema, onSuccess, onError, showToast = true }: ValidationOptions
    ): Promise<boolean> => {
      try {
        const validatedData = await schema.parseAsync(data);
        
        if (onSuccess) {
          await onSuccess(validatedData);
        }
        
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          if (showToast) {
            const firstError = error.issues[0];
            toast.error(firstError?.message || "Validation failed");
          }
          
          if (onError) {
            onError(error);
          }
          
          console.error("Validation error:", error.issues);
        } else {
          if (showToast) {
            toast.error("An unexpected error occurred");
          }
          console.error("Unexpected validation error:", error);
        }
        
        return false;
      }
    },
    []
  );

  const validateField = useCallback(
    <T>(value: unknown, schema: z.ZodSchema): { isValid: boolean; error?: string } => {
      try {
        schema.parse(value);
        return { isValid: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return { isValid: false, error: firstError?.message };
        }
        return { isValid: false, error: "Validation failed" };
      }
    },
    []
  );

  const sanitizeInput = useCallback((input: string, type: 'text' | 'email' | 'url' | 'html' = 'text'): string => {
    switch (type) {
      case 'email':
        return input.toLowerCase().trim().replace(/[^\w@.-]/g, '');
      case 'url':
        try {
          const url = new URL(input);
          return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
        } catch {
          return '';
        }
      case 'html':
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/<(?!\/?(p|br|strong|em|u|ol|ul|li|h1|h2|h3|h4|h5|h6|blockquote|code|pre|a|img|div|span|b|i))[^>]*>/gi, '');
      default:
        return input
          .replace(/[\x00-\x1F\x7F]/g, '')
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
    }
  }, []);

  return {
    validateAndExecute,
    validateField,
    sanitizeInput,
  };
};

// Rate limiting hook
export const useRateLimit = () => {
  const checkRateLimit = useCallback(
    (key: string, maxRequests: number, windowMs: number): boolean => {
      const now = Date.now();
      const storageKey = `rate_limit_${key}`;
      
      try {
        const stored = localStorage.getItem(storageKey);
        const timestamps: number[] = stored ? JSON.parse(stored) : [];
        
        // Filter out old timestamps
        const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);
        
        if (recentTimestamps.length >= maxRequests) {
          return false;
        }
        
        // Add current timestamp
        recentTimestamps.push(now);
        localStorage.setItem(storageKey, JSON.stringify(recentTimestamps));
        
        return true;
      } catch {
        // If localStorage fails, allow the request
        return true;
      }
    },
    []
  );

  const resetRateLimit = useCallback((key: string) => {
    const storageKey = `rate_limit_${key}`;
    localStorage.removeItem(storageKey);
  }, []);

  return {
    checkRateLimit,
    resetRateLimit,
  };
};

// Form validation hook for React Hook Form integration
export const useFormValidation = () => {
  const getErrorMessage = useCallback((error: any): string => {
    if (!error) return "";
    
    if (typeof error === "string") {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (Array.isArray(error) && error.length > 0) {
      return error[0]?.message || "Validation failed";
    }
    
    return "Validation failed";
  }, []);

  const validateOnSubmit = useCallback(
    async (
      data: any,
      schema: z.ZodSchema,
      onSubmit: (data: any) => Promise<void>
    ) => {
      try {
        const validatedData = await schema.parseAsync(data);
        await onSubmit(validatedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Let React Hook Form handle the field errors
          throw error;
        }
        throw new Error("Validation failed");
      }
    },
    []
  );

  return {
    getErrorMessage,
    validateOnSubmit,
  };
};
