import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { sqlSanitizer, ContentSanitizer } from "../src/lib/validation";

// Server-side validation utilities for Convex functions
export class ServerValidator {
  // Validate and sanitize text input
  static validateText(input: string, fieldName: string, minLength = 1, maxLength = 1000): string {
    if (typeof input !== "string") {
      throw new ConvexError(`${fieldName} must be a string`);
    }

    if (input.length < minLength) {
      throw new ConvexError(`${fieldName} must be at least ${minLength} characters`);
    }

    if (input.length > maxLength) {
      throw new ConvexError(`${fieldName} cannot exceed ${maxLength} characters`);
    }

    // Check for SQL injection attempts
    if (sqlSanitizer.containsSqlInjection(input)) {
      throw new ConvexError(`Invalid characters in ${fieldName}`);
    }

    return ContentSanitizer.sanitizeText(input);
  }

  // Validate and sanitize HTML content
  static validateHtml(input: string, fieldName: string, minLength = 1, maxLength = 50000): string {
    if (typeof input !== "string") {
      throw new ConvexError(`${fieldName} must be a string`);
    }

    if (input.length < minLength) {
      throw new ConvexError(`${fieldName} must be at least ${minLength} characters`);
    }

    if (input.length > maxLength) {
      throw new ConvexError(`${fieldName} cannot exceed ${maxLength} characters`);
    }

    // Check for SQL injection attempts
    if (sqlSanitizer.containsSqlInjection(input)) {
      throw new ConvexError(`Invalid characters in ${fieldName}`);
    }

    return ContentSanitizer.sanitizeHtml(input);
  }

  // Validate email addresses
  static validateEmail(email: string): string {
    if (typeof email !== "string") {
      throw new ConvexError("Email must be a string");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ConvexError("Invalid email address");
    }

    if (email.length > 254) {
      throw new ConvexError("Email address too long");
    }

    return ContentSanitizer.sanitizeEmail(email);
  }

  // Validate URLs
  static validateUrl(url: string, fieldName: string): string {
    if (typeof url !== "string") {
      throw new ConvexError(`${fieldName} must be a string`);
    }

    if (url.length > 2048) {
      throw new ConvexError(`${fieldName} too long`);
    }

    const sanitized = ContentSanitizer.sanitizeUrl(url);
    if (!sanitized && url.length > 0) {
      throw new ConvexError(`Invalid ${fieldName}`);
    }

    return sanitized;
  }

  // Validate file metadata
  static validateFile(file: { name: string; size: number; type: string }, maxSize: number = 10 * 1024 * 1024) {
    if (!file || typeof file !== "object") {
      throw new ConvexError("Invalid file data");
    }

    if (typeof file.name !== "string" || !file.name) {
      throw new ConvexError("Invalid filename");
    }

    if (typeof file.size !== "number" || file.size < 0) {
      throw new ConvexError("Invalid file size");
    }

    if (typeof file.type !== "string" || !file.type) {
      throw new ConvexError("Invalid file type");
    }

    if (file.size > maxSize) {
      throw new ConvexError(`File size exceeds limit of ${maxSize} bytes`);
    }

    // Sanitize filename
    const sanitizedName = ContentSanitizer.sanitizeFilename(file.name);
    
    return {
      name: sanitizedName,
      size: file.size,
      type: file.type,
    };
  }

  // Validate array of strings
  static validateStringArray(input: any[], fieldName: string, maxLength = 100, maxItems = 10): string[] {
    if (!Array.isArray(input)) {
      throw new ConvexError(`${fieldName} must be an array`);
    }

    if (input.length > maxItems) {
      throw new ConvexError(`${fieldName} cannot contain more than ${maxItems} items`);
    }

    return input.map((item, index) => {
      if (typeof item !== "string") {
        throw new ConvexError(`${fieldName}[${index}] must be a string`);
      }

      if (item.length > maxLength) {
        throw new ConvexError(`${fieldName}[${index}] cannot exceed ${maxLength} characters`);
      }

      return ContentSanitizer.sanitizeText(item);
    });
  }

  // Validate numeric input
  static validateNumber(input: any, fieldName: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    if (typeof input !== "number" || isNaN(input)) {
      throw new ConvexError(`${fieldName} must be a valid number`);
    }

    if (input < min || input > max) {
      throw new ConvexError(`${fieldName} must be between ${min} and ${max}`);
    }

    return input;
  }

  // Validate boolean input
  static validateBoolean(input: any, fieldName: string): boolean {
    if (typeof input !== "boolean") {
      throw new ConvexError(`${fieldName} must be true or false`);
    }

    return input;
  }

  // Validate user object for updates
  static validateUserUpdate(data: any) {
    const validated: any = {};

    if (data.name !== undefined) {
      validated.name = this.validateText(data.name, "name", 2, 50);
    }

    if (data.bio !== undefined) {
      validated.bio = this.validateText(data.bio, "bio", 0, 500);
    }

    if (data.professionalExperience !== undefined) {
      validated.professionalExperience = this.validateText(data.professionalExperience, "professional experience", 0, 2000);
    }

    if (data.portfolioUrl !== undefined) {
      validated.portfolioUrl = this.validateUrl(data.portfolioUrl, "portfolio URL");
    }

    if (data.githubUrl !== undefined) {
      validated.githubUrl = this.validateUrl(data.githubUrl, "GitHub URL");
    }

    if (data.linkedinUrl !== undefined) {
      validated.linkedinUrl = this.validateUrl(data.linkedinUrl, "LinkedIn URL");
    }

    if (data.yearsOfExperience !== undefined) {
      validated.yearsOfExperience = this.validateNumber(data.yearsOfExperience, "years of experience", 0, 50);
    }

    if (data.teachingExperience !== undefined) {
      validated.teachingExperience = this.validateText(data.teachingExperience, "teaching experience", 0, 2000);
    }

    if (data.availability !== undefined) {
      validated.availability = this.validateText(data.availability, "availability", 0, 500);
    }

    return validated;
  }

  // Validate blog post data
  static validateBlogPost(data: any) {
    return {
      title: this.validateText(data.title, "title", 1, 100),
      content: this.validateHtml(data.content, "content", 1, 50000),
      excerpt: data.excerpt ? this.validateText(data.excerpt, "excerpt", 0, 500) : undefined,
      tags: data.tags ? this.validateStringArray(data.tags, "tags", 20, 5) : [],
      featuredImage: data.featuredImage ? this.validateUrl(data.featuredImage, "featured image") : undefined,
    };
  }

  // Validate course data
  static validateCourse(data: any) {
    const validated = {
      title: this.validateText(data.title, "title", 1, 100),
      description: this.validateText(data.description, "description", 10, 2000),
      topicId: this.validateText(data.topicId, "topic ID", 1, 50),
      difficulty: data.difficulty,
      estimatedDuration: data.estimatedDuration ? this.validateNumber(data.estimatedDuration, "estimated duration", 1, 10000) : undefined,
      prerequisites: data.prerequisites ? this.validateStringArray(data.prerequisites, "prerequisites", 200, 10) : [],
      learningObjectives: data.learningObjectives ? this.validateStringArray(data.learningObjectives, "learning objectives", 200, 10) : [],
      thumbnail: data.thumbnail ? this.validateUrl(data.thumbnail, "thumbnail") : undefined,
    };

    // Validate difficulty enum
    const validDifficulties = ["beginner", "intermediate", "advanced"];
    if (!validDifficulties.includes(validated.difficulty)) {
      throw new ConvexError("Invalid difficulty level");
    }

    return validated;
  }

  // Validate mentorship request data
  static validateMentorshipRequest(data: any) {
    return {
      mentorId: this.validateText(data.mentorId, "mentor ID", 1, 50),
      topicId: this.validateText(data.topicId, "topic ID", 1, 50),
      message: this.validateText(data.message, "message", 1, 2000),
      learningGoal: this.validateText(data.learningGoal, "learning goal", 10, 2000),
    };
  }

  // Validate message data
  static validateMessage(data: any) {
    return {
      content: this.validateText(data.content, "message content", 1, 2000),
      mentorshipId: this.validateText(data.mentorshipId, "mentorship ID", 1, 50),
    };
  }
}

// Rate limiting utilities for server-side
export class RateLimiter {
  // Simple in-memory rate limiter (for production, use Redis or similar)
  private static requests = new Map<string, number[]>();

  static checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Filter out old timestamps
    const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (recentTimestamps.length >= maxRequests) {
      return false;
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    this.requests.set(key, recentTimestamps);
    
    return true;
  }

  static cleanup() {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    
    for (const [key, timestamps] of this.requests.entries()) {
      const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);
      if (recentTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentTimestamps);
      }
    }
  }
}

// Note: Cleanup should be handled by Convex's built-in memory management
// For production, consider using Redis or external rate limiting service
