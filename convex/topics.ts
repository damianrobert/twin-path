import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

// Simple server-side content validation
const INAPPROPRIATE_WORDS = [
  'fuck', 'fucking', 'shit', 'shitting', 'damn', 'hell', 'bitch', 'bastard',
  'ass', 'asshole', 'crap', 'piss', 'pissing', 'dick', 'cock', 'pussy',
  'slut', 'whore', 'cunt', 'twat', 'wanker', 'bollocks',
  'kill', 'murder', 'suicide', 'terrorist', 'bomb', 'weapon', 'gun',
  'drug', 'drugs', 'overdose', 'addiction', 'illegal', 'criminal',
  'nazi', 'racist', 'nigger', 'kike', 'spic', 'chink', 'faggot',
  'porn', 'porno', 'sex', 'sexual', 'nude', 'naked', 'xxx', 'adult',
  'escort', 'prostitute', 'hooker'
];

function containsInappropriateContent(text: string): boolean {
  if (!text) return false;
  const normalizedText = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = normalizedText.split(/\s+/);
  return words.some(word => 
    INAPPROPRIATE_WORDS.some(badWord => 
      word.includes(badWord) || badWord.includes(word)
    )
  );
}

// Get all topics
export const getAllTopics = query({
  args: {},
  handler: async (ctx) => {
    const topics = await ctx.db.query("topics").collect();
    return topics;
  },
});

// Get topic by name
export const getTopicByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const topic = await ctx.db
      .query("topics")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    return topic;
  },
});

// Create new topic (admin only for now)
export const createTopic = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Server-side content validation
    if (containsInappropriateContent(args.name)) {
      throw new ConvexError("Topic name contains inappropriate content. Please keep it professional.");
    }

    if (args.description && containsInappropriateContent(args.description)) {
      throw new ConvexError("Topic description contains inappropriate content. Please keep it professional.");
    }

    // Length validation
    if (args.name.length < 2) {
      throw new ConvexError("Topic name must be at least 2 characters long.");
    }

    if (args.name.length > 50) {
      throw new ConvexError("Topic name must be less than 50 characters long.");
    }

    if (args.description && args.description.length > 200) {
      throw new ConvexError("Topic description must be less than 200 characters long.");
    }

    // Check if topic already exists
    const existingTopic = await ctx.db
      .query("topics")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existingTopic) {
      throw new ConvexError("Topic already exists");
    }

    const topicId = await ctx.db.insert("topics", {
      name: args.name,
      description: args.description,
    });

    return topicId;
  },
});

// Initialize default topics
export const initializeDefaultTopics = mutation({
  args: {},
  handler: async (ctx) => {
    const defaultTopics = [
      { name: "Web Development", description: "Frontend and backend web development" },
      { name: "Mobile Development", description: "iOS and Android app development" },
      { name: "Data Science", description: "Data analysis, machine learning, and AI" },
      { name: "Cybersecurity", description: "Security best practices and ethical hacking" },
      { name: "DevOps", description: "Infrastructure, deployment, and operations" },
      { name: "UI/UX Design", description: "User interface and experience design" },
      { name: "Career Development", description: "Career guidance and professional growth" },
      { name: "Programming Languages", description: "Learning specific programming languages" },
      { name: "Database Management", description: "Database design and administration" },
      { name: "Cloud Computing", description: "Cloud services and architecture" },
    ];

    for (const topic of defaultTopics) {
      const existing = await ctx.db
        .query("topics")
        .withIndex("by_name", (q) => q.eq("name", topic.name))
        .first();

      if (!existing) {
        await ctx.db.insert("topics", topic);
      }
    }

    return "Default topics initialized";
  },
});
