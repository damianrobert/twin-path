"use client";

import React, { useState, useCallback } from "react";
import { useForm, UseFormReturn, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useValidation, useRateLimit } from "@/hooks/useValidation";
import { toast } from "sonner";

interface ValidatedFormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  defaultValues?: Partial<T>;
  className?: string;
  rateLimitKey?: string;
  maxRequests?: number;
  windowMs?: number;
  disabled?: boolean;
}

export function ValidatedForm<T extends FieldValues>({
  schema,
  onSubmit,
  children,
  defaultValues,
  className = "",
  rateLimitKey,
  maxRequests = 10,
  windowMs = 60000, // 1 minute
  disabled = false,
}: ValidatedFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateAndExecute, sanitizeInput } = useValidation();
  const { checkRateLimit } = useRateLimit();

  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const handleSubmit = useCallback(
    async (data: T) => {
      if (disabled) return;

      // Check rate limit if key is provided
      if (rateLimitKey && !checkRateLimit(rateLimitKey, maxRequests, windowMs)) {
        toast.error("Too many requests. Please wait before trying again.");
        return;
      }

      setIsSubmitting(true);

      try {
        await validateAndExecute(data, {
          schema,
          onSuccess: async (validatedData) => {
            await onSubmit(validatedData);
            toast.success("Form submitted successfully!");
          },
          onError: (error) => {
            console.error("Form validation error:", error);
          },
        });
      } catch (error) {
        toast.error("An unexpected error occurred. Please try again.");
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [disabled, rateLimitKey, maxRequests, windowMs, checkRateLimit, validateAndExecute, onSubmit]
  );

  return (
    <form
      onSubmit={methods.handleSubmit(handleSubmit)}
      className={className}
      noValidate
    >
      {children(methods)}
    </form>
  );
}

// Enhanced input field with built-in validation
interface ValidatedInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "url" | "tel" | "textarea";
  required?: boolean;
  disabled?: boolean;
  className?: string;
  sanitize?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  helpText?: string;
}

export function ValidatedInput({
  name,
  label,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  className = "",
  sanitize = true,
  maxLength,
  showCharCount = false,
  helpText,
}: ValidatedInputProps) {
  const { sanitizeInput } = useValidation();

  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const value = watch(name) || "";
  const error = errors[name];

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let newValue = e.target.value;
      
      if (sanitize) {
        const sanitizeType = type === "email" ? "email" : type === "url" ? "url" : "text";
        newValue = sanitizeInput(newValue, sanitizeType);
      }

      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      setValue(name, newValue as any);
    },
    [name, sanitize, sanitizeInput, maxLength, setValue, type]
  );

  const InputComponent = type === "textarea" ? "textarea" : "input";

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <InputComponent
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-red-500 focus-visible:ring-red-500" : ""
        }`}
        {...register(name, {
          onChange: sanitize ? handleChange : undefined,
        })}
      />
      
      {showCharCount && maxLength && (
        <div className="text-xs text-muted-foreground">
          {value.length}/{maxLength} characters
        </div>
      )}
      
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-500">{error.message as string}</p>
      )}
    </div>
  );
}

// Form field wrapper for custom validation
interface ValidatedFieldProps {
  name: string;
  children: (field: {
    value: any;
    onChange: (value: any) => void;
    error?: any;
    onBlur: () => void;
  }) => React.ReactNode;
  validate?: (value: any) => string | undefined;
}

export function ValidatedField({ name, children, validate }: ValidatedFieldProps) {
  const { validateField } = useValidation();
  const {
    register,
    formState: { errors },
    setValue,
    trigger,
  } = useForm();

  const [localError, setLocalError] = useState<string>();

  const field = register(name, {
    validate: validate ? (value) => {
      const error = validate(value);
      if (error) {
        setLocalError(error);
        return error;
      }
      setLocalError(undefined);
      return true;
    } : undefined,
  });

  const error = errors[name] || localError;

  const handleChange = useCallback(
    async (value: any) => {
      setValue(name, value);
      await trigger(name);
      
      if (validate) {
        const validationError = validate(value);
        setLocalError(validationError);
      }
    },
    [name, setValue, trigger, validate]
  );

  return (
    <div>
      {children({
        value: field.value,
        onChange: handleChange,
        error,
        onBlur: field.onBlur,
      })}
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error.message as string}</p>
      )}
    </div>
  );
}

// Security indicators for forms
export function SecurityIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted/50 rounded">
      <svg
        className="w-4 h-4 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      <span>This form is protected with security validation</span>
    </div>
  );
}

// Rate limit indicator
export function RateLimitIndicator({
  current,
  max,
  resetTime,
}: {
  current: number;
  max: number;
  resetTime: number;
}) {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 100;

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${
            isDanger ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={`text-muted-foreground ${isDanger ? "text-red-500" : isWarning ? "text-yellow-500" : ""}`}>
        {current}/{max} requests
      </span>
      <span className="text-muted-foreground">
        Resets in {Math.ceil((resetTime - Date.now()) / 1000 / 60)}m
      </span>
    </div>
  );
}
