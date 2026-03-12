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
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Blog Posts
  posts: defineTable({
    title: v.string(),
    body: v.string(),
    authorId: v.id("users"),
    createdAt: v.number(),
  }).index("by_author", ["authorId"]),

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
});
