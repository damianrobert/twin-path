import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users and Profiles
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("mentor"), v.literal("mentee"), v.literal("both")),
    isAdmin: v.optional(v.boolean()), // Admin rights flag (optional during migration)
    bio: v.optional(v.string()),
    availability: v.optional(v.string()),
    // Mentor-specific fields
    professionalExperience: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    yearsOfExperience: v.optional(v.number()),
    teachingExperience: v.optional(v.string()),
    // Presence fields
    isOnline: v.optional(v.boolean()), // Make optional for existing users
    lastSeen: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_email", ["email"])
   .index("by_admin", ["isAdmin"]), // For finding admin users,

  // Blog Posts
  posts: defineTable({
    title: v.string(),
    slug: v.string(), // URL-friendly slug for SEO
    excerpt: v.optional(v.string()), // Short description/summary
    content: v.string(), // Full blog content (rich text)
    authorId: v.id("users"),
    status: v.union(v.literal("draft"), v.literal("published")), // Draft/Published status
    featuredImage: v.optional(v.string()), // Featured image URL
    readingTime: v.optional(v.number()), // Estimated reading time in minutes
    tags: v.optional(v.array(v.string())), // Additional tags
    viewCount: v.optional(v.number()), // View counter
    likeCount: v.optional(v.number()), // Like counter
    createdAt: v.number(),
    updatedAt: v.optional(v.number()), // Last updated timestamp
    publishedAt: v.optional(v.number()), // When it was published
  }).index("by_author", ["authorId"])
   .index("by_status", ["status"])
   .index("by_slug", ["slug"])
   .index("by_published", ["status", "publishedAt"]), // For listing published posts

  // Blog post - topic associations (many-to-many)
  postTopics: defineTable({
    postId: v.id("posts"),
    topicId: v.id("topics"),
  }).index("by_post", ["postId"]).index("by_topic", ["topicId"]),

  // Blog post likes
  postLikes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  }).index("by_user_post", ["userId", "postId"]).index("by_post", ["postId"]),

  // Topics
  topics: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
  }).index("by_name", ["name"]),

  // User-Topic associations
  userTopics: defineTable({
    userId: v.id("users"),
    topicId: v.id("topics"),
    type: v.union(v.literal("expertise"), v.literal("interest")),
    skillLevel: v.optional(v.string()),
  }).index("by_user", ["userId"]).index("by_topic", ["topicId"]),

  // Mentorship Requests
  mentorshipRequests: defineTable({
    menteeId: v.id("users"),
    mentorId: v.id("users"),
    topicId: v.id("topics"),
    message: v.string(),
    learningGoal: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
  }).index("by_mentee", ["menteeId"]).index("by_mentor", ["mentorId"]),

  // Active Mentorships
  mentorships: defineTable({
    requestId: v.id("mentorshipRequests"),
    menteeId: v.id("users"),
    mentorId: v.id("users"),
    topicId: v.id("topics"),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("closed")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    closedBy: v.optional(v.id("users")), // Who initiated the closure
    closureReason: v.optional(v.string()), // Reason for closure
    finalFeedback: v.optional(v.string()), // Final feedback from mentor
  }).index("by_mentee", ["menteeId"]).index("by_mentor", ["mentorId"]),

  // Messages
  messages: defineTable({
    mentorshipId: v.id("mentorships"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    seenBy: v.optional(v.array(v.id("users"))), // Track which users have seen this message
    attachments: v.optional(v.array(v.union(
      v.string(), // Legacy format (URL only)
      v.object({
        url: v.string(),
        name: v.string(),
        size: v.number(),
        type: v.string(),
      })
    ))), // File attachments
  }).index("by_mentorship", ["mentorshipId"]),

  // Goals
  goals: defineTable({
    mentorshipId: v.id("mentorships"),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("active"), v.literal("completed")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_mentorship", ["mentorshipId"]),

  // Tasks
  tasks: defineTable({
    goalId: v.id("goals"),
    title: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_goal", ["goalId"]),

  // Assignments
  assignments: defineTable({
    mentorshipId: v.id("mentorships"),
    title: v.string(),
    description: v.string(),
    mentorFiles: v.array(v.union(
      v.string(), // Legacy format (URL only)
      v.object({
        url: v.string(),
        name: v.string(),
        size: v.number(),
        type: v.string(),
      })
    )),
    menteeFiles: v.array(v.union(
      v.string(), // Legacy format (URL only)
      v.object({
        url: v.string(),
        name: v.string(),
        size: v.number(),
        type: v.string(),
      })
    )),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("reviewed")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    grade: v.optional(v.number()), // Grade/score out of 100
    feedback: v.optional(v.string()), // Mentor feedback
  }).index("by_mentorship", ["mentorshipId"]),

  // Reviews
  reviews: defineTable({
    mentorshipId: v.id("mentorships"),
    reviewerId: v.id("users"),
    revieweeId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_mentorship", ["mentorshipId"]).index("by_reviewee", ["revieweeId"]),

  // DM Requests (for users without active mentorship)
  dmRequests: defineTable({
    senderId: v.id("users"),
    recipientId: v.id("users"),
    message: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  }).index("by_sender", ["senderId"]).index("by_recipient", ["recipientId"]),

  // Chat Sessions (for DM chats)
  chatSessions: defineTable({
    participant1Id: v.id("users"),
    participant2Id: v.id("users"),
    createdAt: v.number(),
  }).index("by_participant1", ["participant1Id"]).index("by_participant2", ["participant2Id"]),

  // DM Messages (for DM chats)
  dmMessages: defineTable({
    chatSessionId: v.id("chatSessions"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    seenBy: v.optional(v.array(v.id("users"))), // Track which users have seen this message
    attachments: v.optional(v.array(v.union(
      v.string(), // Legacy format (URL only)
      v.object({
        url: v.string(),
        name: v.string(),
        size: v.number(),
        type: v.string(),
      })
    ))), // File attachments
  }).index("by_chatSession", ["chatSessionId"]),

  // Blog Reports
  blogReports: defineTable({
    postId: v.id("posts"),
    reporterId: v.id("users"),
    reason: v.union(
      v.literal("inappropriate_content"),
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("copyright"),
      v.literal("misinformation"),
      v.literal("offensive_language"),
      v.literal("other")
    ),
    message: v.string(), // Detailed message from the reporter
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved"), v.literal("dismissed")),
    reviewedBy: v.optional(v.id("users")), // Admin who reviewed the report
    reviewNotes: v.optional(v.string()), // Admin notes about the review
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
  }).index("by_post", ["postId"])
   .index("by_reporter", ["reporterId"])
   .index("by_status", ["status"])
   .index("by_post_status", ["postId", "status"]), // For checking if user already reported

  // Platform Settings
  platformSettings: defineTable({
    maintenanceMode: v.boolean(),
    maintenanceMessage: v.string(),
    siteName: v.string(),
    siteDescription: v.string(),
    allowUserRegistration: v.boolean(),
    requireEmailVerification: v.boolean(),
    allowPublicProfiles: v.boolean(),
    enableContentModeration: v.boolean(),
    autoApprovePosts: v.boolean(),
    enableMessaging: v.boolean(),
    maxFileSize: v.number(),
    allowedFileTypes: v.array(v.string()),
    defaultUserRole: v.union(v.literal("mentee"), v.literal("mentor"), v.literal("both")),
    enableNotifications: v.boolean(),
    notificationEmail: v.string(),
    enableAnalytics: v.boolean(),
    dataRetentionDays: v.number(),
    enableBackup: v.boolean(),
    backupFrequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Support Cases
  supportCases: defineTable({
    caseNumber: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.union(v.literal("technical"), v.literal("account"), v.literal("billing"), v.literal("content"), v.literal("other")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    status: v.union(v.literal("opened"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    userId: v.id("users"),
    assignedToId: v.optional(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_priority", ["priority"]),

  // Support Case Messages
  supportCaseMessages: defineTable({
    caseId: v.id("supportCases"),
    senderId: v.id("users"),
    message: v.string(),
    isInternal: v.boolean(), // true for admin-only messages, false for visible to user
    createdAt: v.number(),
  })
    .index("by_caseId", ["caseId"])
    .index("by_senderId", ["senderId"]),

  // Courses
  courses: defineTable({
    title: v.string(),
    description: v.string(),
    instructorId: v.id("users"), // The mentor who created the course
    topicId: v.id("topics"), // Primary topic for the course
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    thumbnail: v.optional(v.string()), // Course thumbnail image URL
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedDuration: v.optional(v.number()), // Estimated completion time in minutes
    prerequisites: v.optional(v.array(v.string())), // Course prerequisites
    learningObjectives: v.optional(v.array(v.string())), // Learning objectives
    enrollmentCount: v.optional(v.number()), // Number of enrolled students
    rating: v.optional(v.number()), // Average rating (0-5)
    reviewCount: v.optional(v.number()), // Number of reviews
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  }).index("by_instructor", ["instructorId"])
   .index("by_topic", ["topicId"])
   .index("by_status", ["status"])
   .index("by_published", ["status", "publishedAt"]), // For listing published courses

  // Course Modules
  courseModules: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    order: v.number(), // Module order within the course
    videoUrl: v.optional(v.string()), // Video file URL
    videoName: v.optional(v.string()), // Original video file name
    videoSize: v.optional(v.number()), // Video file size in bytes
    videoType: v.optional(v.string()), // Video MIME type
    fileUrl: v.optional(v.string()), // Additional file URL (PDF, documents, etc.)
    fileName: v.optional(v.string()), // Original file name
    fileSize: v.optional(v.number()), // File size in bytes
    fileType: v.optional(v.string()), // File MIME type
    isPublished: v.boolean(), // Whether this module is published
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_course", ["courseId"])
   .index("by_course_order", ["courseId", "order"]), // For ordered module listing

  // Course Enrollments
  courseEnrollments: defineTable({
    courseId: v.id("courses"),
    studentId: v.id("users"), // The mentee enrolled in the course
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()), // When the course was completed
    progress: v.number(), // Progress percentage (0-100)
    lastAccessedAt: v.optional(v.number()), // Last time the student accessed the course
    completedModules: v.array(v.id("courseModules")), // List of completed module IDs
    currentModule: v.optional(v.id("courseModules")), // Currently active module
  }).index("by_course", ["courseId"])
   .index("by_student", ["studentId"])
   .index("by_course_student", ["courseId", "studentId"]), // For checking enrollment status

  // Course Progress Tracking
  moduleProgress: defineTable({
    enrollmentId: v.id("courseEnrollments"),
    moduleId: v.id("courseModules"),
    studentId: v.id("users"),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.number()),
    watchTime: v.optional(v.number()), // For video modules - time watched in seconds
    lastPosition: v.optional(v.number()), // For video modules - last position in seconds
  }).index("by_enrollment", ["enrollmentId"])
   .index("by_student_module", ["studentId", "moduleId"])
   .index("by_module", ["moduleId"]), // For module completion statistics

  // Course Reviews
  courseReviews: defineTable({
    courseId: v.id("courses"),
    studentId: v.id("users"),
    rating: v.number(), // 1-5 rating
    comment: v.optional(v.string()),
    isPublic: v.boolean(), // Whether review is public
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_course", ["courseId"])
   .index("by_student", ["studentId"])
   .index("by_course_student", ["courseId", "studentId"]), // For checking if user already reviewed
});
