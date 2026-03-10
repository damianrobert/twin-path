import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

// Create or update user profile
export const createOrUpdateProfile = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Check if user profile already exists
    const existingProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        name: args.name,
        role: args.role,
        bio: args.bio,
        availability: args.availability,
        professionalExperience: args.professionalExperience,
        portfolioUrl: args.portfolioUrl,
        githubUrl: args.githubUrl,
        linkedinUrl: args.linkedinUrl,
        yearsOfExperience: args.yearsOfExperience,
        teachingExperience: args.teachingExperience,
      });
      return existingProfile._id;
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("users", {
        email: user.email,
        name: args.name,
        role: args.role,
        bio: args.bio,
        availability: args.availability,
        professionalExperience: args.professionalExperience,
        portfolioUrl: args.portfolioUrl,
        githubUrl: args.githubUrl,
        linkedinUrl: args.linkedinUrl,
        yearsOfExperience: args.yearsOfExperience,
        teachingExperience: args.teachingExperience,
        createdAt: Date.now(),
      });
      return profileId;
    }
  },
});

// Get user profile with name from auth
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    // If no profile exists, return user info from auth for profile creation
    if (!profile) {
      return {
        _id: null,
        email: user.email,
        name: user.name || user.email.split('@')[0], // Use name from auth or fallback to email prefix
        role: null,
        bio: null,
        availability: null,
        professionalExperience: null,
        portfolioUrl: null,
        githubUrl: null,
        linkedinUrl: null,
        yearsOfExperience: null,
        teachingExperience: null,
        createdAt: null,
      };
    }

    return profile;
  },
});

// Get user profile by ID
export const getProfileById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.userId);
    return profile;
  },
});

// Get all mentors
export const getMentors = query({
  args: {},
  handler: async (ctx) => {
    const mentors = await ctx.db
      .query("users")
      .filter((q) => 
        q.or(q.eq(q.field("role"), "mentor"), q.eq(q.field("role"), "both"))
      )
      .collect();
    return mentors;
  },
});

// Get user topics
export const getUserTopics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userTopics = await ctx.db
      .query("userTopics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const topics = await Promise.all(
      userTopics.map(async (userTopic) => {
        const topic = await ctx.db.get(userTopic.topicId);
        return {
          ...userTopic,
          topic,
        };
      })
    );

    return topics;
  },
});

// Add user topic
export const addUserTopic = mutation({
  args: {
    topicId: v.id("topics"),
    type: v.union(v.literal("expertise"), v.literal("interest")),
    skillLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Check if association already exists for the same type
    const existingAssociation = await ctx.db
      .query("userTopics")
      .withIndex("by_user", (q) => q.eq("userId", userProfile._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("topicId"), args.topicId),
          q.eq(q.field("type"), args.type)
        )
      )
      .first();

    if (existingAssociation) {
      throw new ConvexError(`Topic already added as ${args.type}`);
    }

    const userTopicId = await ctx.db.insert("userTopics", {
      userId: userProfile._id,
      topicId: args.topicId,
      type: args.type,
      skillLevel: args.skillLevel,
    });

    return userTopicId;
  },
});

// Remove user topic
export const removeUserTopic = mutation({
  args: { userTopicId: v.id("userTopics") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const userTopic = await ctx.db.get(args.userTopicId);
    if (!userTopic) {
      throw new ConvexError("User topic association not found");
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile || userTopic.userId !== userProfile._id) {
      throw new ConvexError("Not authorized to remove this topic");
    }

    await ctx.db.delete(args.userTopicId);
    return args.userTopicId;
  },
});
