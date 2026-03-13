import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users and Profiles
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("mentor"), v.literal("mentee"), v.literal("both")),
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
  }).index("by_email", ["email"]),

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
});
