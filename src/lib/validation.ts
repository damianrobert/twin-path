import z from "zod";

// XSS protection and content sanitization
export class ContentSanitizer {
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(content: string): string {
    if (!content) return "";
    
    // Basic HTML sanitization without external dependencies
    return content
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove dangerous event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^"'\s>]+/gi, '')
      // Remove javascript: protocols
      .replace(/javascript:/gi, '')
      // Remove data: URLs that could execute scripts
      .replace(/data:(?!image\/)/gi, '')
      // Remove vbscript: protocols
      .replace(/vbscript:/gi, '')
      // Remove object and embed tags
      .replace(/<(object|embed|applet|meta|link|style)[^>]*>/gi, '')
      // Remove iframe tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      // Remove form tags
      .replace(/<form[^>]*>.*?<\/form>/gi, '')
      // Remove input tags
      .replace(/<input[^>]*>/gi, '')
      // Remove dangerous attributes
      .replace(/\s+(on\w+|javascript:|vbscript:|data:)[^>]*>/gi, '>')
      // Allow safe HTML tags only
      .replace(/<(?!\/?(p|br|strong|em|u|ol|ul|li|h1|h2|h3|h4|h5|h6|blockquote|code|pre|a|img|div|span|b|i))[^>]*>/gi, '');
  }

  // Sanitize plain text content
  static sanitizeText(content: string): string {
    if (!content) return "";
    
    // Remove potentially dangerous characters
    return content
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  // Sanitize URLs
  static sanitizeUrl(url: string): string {
    if (!url) return "";
    
    try {
      const parsed = new URL(url);
      // Only allow http, https, and relative URLs
      if (['http:', 'https:'].includes(parsed.protocol)) {
        return parsed.toString();
      }
      return "";
    } catch {
      // Invalid URL, return empty string
      return "";
    }
  }

  // Sanitize email addresses
  static sanitizeEmail(email: string): string {
    if (!email) return "";
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w@.-]/g, ''); // Only allow email-safe characters
  }

  // Sanitize filenames
  static sanitizeFilename(filename: string): string {
    if (!filename) return "";
    
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace dangerous chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 255); // Limit length
  }
}

// Common validation schemas with security enhancements
export const commonSchemas = {
  // Enhanced name validation
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .transform(val => ContentSanitizer.sanitizeText(val)),

  // Enhanced email validation
  email: z.string()
    .email("Please enter a valid email address")
    .max(254, "Email address too long")
    .transform(val => ContentSanitizer.sanitizeEmail(val)),

  // Enhanced password validation
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")
    .regex(/^[^\s<>]{8,128}$/, "Password cannot contain spaces or HTML tags"),

  // Username validation
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .transform(val => ContentSanitizer.sanitizeText(val)),

  // URL validation
  url: z.string()
    .url("Please enter a valid URL")
    .max(2048, "URL too long")
    .transform(val => ContentSanitizer.sanitizeUrl(val)),

  // Phone number validation
  phone: z.string()
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number")
    .max(20, "Phone number too long")
    .transform(val => ContentSanitizer.sanitizeText(val)),

  // Bio/description validation
  bio: z.string()
    .max(500, "Bio cannot exceed 500 characters")
    .transform(val => ContentSanitizer.sanitizeText(val)),

  // Message content validation
  message: z.string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters")
    .transform(val => ContentSanitizer.sanitizeText(val)),

  // Title validation
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .transform(val => ContentSanitizer.sanitizeText(val)),

  // Description validation
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters")
    .transform(val => ContentSanitizer.sanitizeText(val)),

  // HTML content validation (for blog posts, etc.)
  htmlContent: z.string()
    .min(1, "Content is required")
    .max(50000, "Content too long")
    .transform(val => ContentSanitizer.sanitizeHtml(val)),

  // File validation
  filename: z.string()
    .max(255, "Filename too long")
    .transform(val => ContentSanitizer.sanitizeFilename(val)),
};

// Specific form schemas
export const authSchemas = {
  signUp: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
  }),

  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, "Password is required"),
  }),

  passwordReset: z.object({
    email: commonSchemas.email,
  }),

  newPassword: z.object({
    token: z.string().min(1, "Invalid reset token"),
    password: commonSchemas.password,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
};

export const userSchemas = {
  profile: z.object({
    name: commonSchemas.name,
    bio: commonSchemas.bio.optional(),
    professionalExperience: commonSchemas.description.optional(),
    portfolioUrl: commonSchemas.url.optional().or(z.literal("")),
    githubUrl: commonSchemas.url.optional().or(z.literal("")),
    linkedinUrl: commonSchemas.url.optional().or(z.literal("")),
    yearsOfExperience: z.number()
      .min(0, "Experience cannot be negative")
      .max(50, "Experience seems unrealistic")
      .optional(),
    teachingExperience: commonSchemas.description.optional(),
    availability: commonSchemas.description.optional(),
  }),

  settings: z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    publicProfile: z.boolean(),
  }),
};

export const contentSchemas = {
  blogPost: z.object({
    title: commonSchemas.title,
    content: commonSchemas.htmlContent,
    excerpt: commonSchemas.description.optional(),
    tags: z.array(z.string().max(20)).max(5, "Maximum 5 tags allowed"),
    featuredImage: commonSchemas.url.optional().or(z.literal("")),
  }),

  course: z.object({
    title: commonSchemas.title,
    description: commonSchemas.description,
    topicId: z.string().min(1, "Topic is required"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    estimatedDuration: z.number().min(1).optional(),
    prerequisites: z.array(z.string().min(1, "Prerequisite cannot be empty").max(100, "Prerequisite cannot exceed 100 characters")).optional(),
    learningObjectives: z.array(z.string().min(1, "Learning objective cannot be empty").max(200, "Learning objective cannot exceed 200 characters")).optional(),
    thumbnail: commonSchemas.url.optional().or(z.literal("")),
  }),

  assignment: z.object({
    title: commonSchemas.title,
    description: commonSchemas.description,
    dueDate: z.number().optional(),
    maxScore: z.number().min(1).max(100).optional(),
  }),
};

export const mentorshipSchemas = {
  request: z.object({
    mentorId: z.string().min(1, "Mentor is required"),
    topicId: z.string().min(1, "Topic is required"),
    message: commonSchemas.message,
    learningGoal: commonSchemas.description,
  }),

  message: z.object({
    content: commonSchemas.message,
    mentorshipId: z.string().min(1, "Mentorship is required"),
  }),

  goal: z.object({
    title: commonSchemas.title,
    description: commonSchemas.description,
    mentorshipId: z.string().min(1, "Mentorship is required"),
  }),
};

export const adminSchemas = {
  userEdit: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    role: z.enum(["mentor", "mentee", "both"]),
    isAdmin: z.boolean(),
  }),

  platformSettings: z.object({
    maintenanceMode: z.boolean(),
    maintenanceMessage: commonSchemas.description,
    siteName: commonSchemas.name,
    siteDescription: commonSchemas.description,
    allowUserRegistration: z.boolean(),
    requireEmailVerification: z.boolean(),
    allowPublicProfiles: z.boolean(),
    enableContentModeration: z.boolean(),
    autoApprovePosts: z.boolean(),
    enableMessaging: z.boolean(),
    maxFileSize: z.number().min(1).max(100 * 1024 * 1024), // 100MB max
    allowedFileTypes: z.array(z.string()).max(20),
    defaultUserRole: z.enum(["mentee", "mentor", "both"]),
    enableNotifications: z.boolean(),
    notificationEmail: commonSchemas.email,
    enableAnalytics: z.boolean(),
    dataRetentionDays: z.number().min(30).max(3650),
    enableBackup: z.boolean(),
    backupFrequency: z.enum(["daily", "weekly", "monthly"]),
  }),
};

// File upload validation
export const fileValidation = {
  // Validate file type
  isValidFileType: (filename: string, allowedTypes: string[]): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(`.${extension}`) : false;
  },

  // Validate file size
  isValidFileSize: (size: number, maxSize: number): boolean => {
    return size <= maxSize;
  },

  // Sanitize filename
  sanitizeFilename: ContentSanitizer.sanitizeFilename,

  // Check for dangerous file extensions
  isDangerousFile: (filename: string): boolean => {
    const dangerous = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.php', '.asp', '.jsp',
      '.sh', '.ps1', '.py', '.pl', '.rb', '.cgi'
    ];
    
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? dangerous.includes(`.${extension}`) : false;
  },
};

// SQL injection prevention for database queries
export const sqlSanitizer = {
  // Escape single quotes in SQL strings
  escapeString: (str: string): string => {
    return str.replace(/'/g, "''");
  },

  // Validate that input doesn't contain SQL patterns
  containsSqlInjection: (str: string): boolean => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\*\/|\/\*)/,
      /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\b\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"])/i,
    ];
    
    return sqlPatterns.some(pattern => pattern.test(str));
  },
};

// Rate limiting validation
export const rateLimitValidation = {
  // Check if request frequency is acceptable
  checkFrequency: (timestamps: number[], maxRequests: number, windowMs: number): boolean => {
    const now = Date.now();
    const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);
    return recentTimestamps.length < maxRequests;
  },

  // Generate rate limit key
  generateKey: (identifier: string, action: string): string => {
    return `rate_limit:${identifier}:${action}`;
  },
};

export type AuthSignUpSchema = z.infer<typeof authSchemas.signUp>;
export type AuthLoginSchema = z.infer<typeof authSchemas.login>;
export type UserProfileSchema = z.infer<typeof userSchemas.profile>;
export type BlogPostSchema = z.infer<typeof contentSchemas.blogPost>;
export type CourseSchema = z.infer<typeof contentSchemas.course>;
export type MentorshipRequestSchema = z.infer<typeof mentorshipSchemas.request>;
