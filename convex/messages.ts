import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { authComponent } from "./auth";

// Generate upload URL for chat file
export const generateChatUploadUrl = mutation({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Validate file size (10MB limit)
    if (args.fileSize > 10 * 1024 * 1024) {
      throw new ConvexError("File size must be less than 10MB");
    }

    // Generate upload URL
    const uploadUrl = await ctx.storage.generateUploadUrl();
    
    return { uploadUrl };
  },
});

// Store uploaded chat file
export const storeChatFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get the storage URL
    const url = await ctx.storage.getUrl(args.storageId);
    
    return {
      url,
      name: args.fileName,
      size: args.fileSize,
      type: args.fileType,
    };
  },
});

// Send a message within an active mentorship
export const sendMessage = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
    content: v.string(),
    attachments: v.optional(v.array(v.union(
      v.string(), // Legacy format (URL only)
      v.object({
        url: v.string(),
        name: v.string(),
        size: v.number(),
        type: v.string(),
      })
    ))), // File attachments
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }
    const userId = userProfile._id;

    // Get the mentorship to verify it's active and user is part of it
    const mentorship = await ctx.db.get(args.mentorshipId);
    if (!mentorship) {
      throw new Error("Mentorship not found");
    }

    if (mentorship.status !== "active") {
      throw new Error("Can only send messages in active mentorships");
    }

    // Verify user is either mentor or mentee
    if (userId !== mentorship.mentorId && userId !== mentorship.menteeId) {
      throw new Error("Not part of this mentorship");
    }

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      mentorshipId: args.mentorshipId,
      senderId: userId,
      content: args.content,
      createdAt: Date.now(),
      seenBy: [userId], // Sender has seen their own message
      attachments: args.attachments || [], // Include file attachments
    });

    return messageId;
  },
});

// Get messages for a mentorship
export const getMessages = query({
  args: {
    mentorshipId: v.id("mentorships"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return [];
    }
    const userId = userProfile._id;

    // Get the mentorship to verify user is part of it
    const mentorship = await ctx.db.get(args.mentorshipId);
    if (!mentorship) {
      return [];
    }

    // Verify user is either mentor or mentee
    if (userId !== mentorship.mentorId && userId !== mentorship.menteeId) {
      return [];
    }

    // Get messages for this mentorship, ordered by creation time
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_mentorship", (q) => q.eq("mentorshipId", args.mentorshipId))
      .order("asc")
      .collect();

    // Get sender information for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: {
            _id: sender!._id,
            name: sender!.name,
            role: sender!.role,
          },
        };
      })
    );

    return messagesWithSenders;
  },
});

// Send a DM request (for users without active mentorship)
export const sendDMRequest = mutation({
  args: {
    recipientId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }
    const userId = userProfile._id;

    if (userId === args.recipientId) {
      return {
        success: false,
        error: "Cannot send DM to yourself",
      };
    }

    // Get current user and recipient
    const currentUser = await ctx.db.get(userId);
    const recipient = await ctx.db.get(args.recipientId);

    if (!currentUser || !recipient) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check if they already have an active mentorship
    const existingMentorship = await ctx.db
      .query("mentorships")
      .withIndex("by_mentee", (q) => q.eq("menteeId", userId))
      .filter((q) => q.eq(q.field("mentorId"), args.recipientId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingMentorship) {
      return {
        success: false,
        error: "You already have an active mentorship with this person",
      };
    }

    // Check if there's already a pending DM request
    const existingRequest = await ctx.db
      .query("dmRequests")
      .withIndex("by_sender", (q) => q.eq("senderId", userId))
      .filter((q) => q.eq(q.field("recipientId"), args.recipientId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingRequest) {
      return {
        success: false,
        error: "You already have a pending DM request to this person",
      };
    }

    // Create DM request
    const requestId = await ctx.db.insert("dmRequests", {
      senderId: userId,
      recipientId: args.recipientId,
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      success: true,
      requestId,
    };
  },
});

// Get DM requests for current user
export const getDMRequests = query({
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return [];
    }
    const userId = userProfile._id;

    // Get requests where user is recipient
    const receivedRequests = await ctx.db
      .query("dmRequests")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get sender information for each request
    const requestsWithSenders = await Promise.all(
      receivedRequests.map(async (request) => {
        const sender = await ctx.db.get(request.senderId);
        return {
          ...request,
          sender: {
            _id: sender!._id,
            name: sender!.name,
            role: sender!.role,
            bio: sender!.bio,
          },
        };
      })
    );

    return requestsWithSenders;
  },
});

// Accept/Reject DM request
export const respondToDMRequest = mutation({
  args: {
    requestId: v.id("dmRequests"),
    action: v.union(v.literal("accept"), v.literal("reject")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }
    const userId = userProfile._id;

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.recipientId !== userId) {
      throw new Error("Not authorized to respond to this request");
    }

    if (request.status !== "pending") {
      throw new Error("Request already processed");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: args.action === "accept" ? "accepted" : "rejected",
      respondedAt: Date.now(),
    });

    if (args.action === "accept") {
      // Create a temporary chat session (could be implemented as a special mentorship or separate chat table)
      const chatSessionId = await ctx.db.insert("chatSessions", {
        participant1Id: request.senderId,
        participant2Id: request.recipientId,
        createdAt: Date.now(),
      });

      return { success: true, chatSessionId };
    }

    return { success: true };
  },
});

// Search users by name
export const searchUsers = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Get current user profile
    const currentUserProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!currentUserProfile) {
      return [];
    }

    // Search users by name (case-insensitive)
    const allUsers = await ctx.db.query("users").collect();
    
    const filteredUsers = [];
    
    for (const profile of allUsers) {
      // Exclude current user
      if (profile._id === currentUserProfile._id) continue;
      
      // Check if name contains search query (case-insensitive)
      const nameMatch = profile.name.toLowerCase().includes(args.searchQuery.toLowerCase());
      
      if (!nameMatch) continue;

      // Check if they already have an active mentorship
      const existingMentorshipAsMentor = await ctx.db
        .query("mentorships")
        .withIndex("by_mentor", (q) => q.eq("mentorId", currentUserProfile._id))
        .filter((q) => q.eq(q.field("menteeId"), profile._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      const existingMentorshipAsMentee = await ctx.db
        .query("mentorships")
        .withIndex("by_mentee", (q) => q.eq("menteeId", currentUserProfile._id))
        .filter((q) => q.eq(q.field("mentorId"), profile._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      // Don't show users they already have active mentorships with
      if (existingMentorshipAsMentor || existingMentorshipAsMentee) continue;

      filteredUsers.push(profile);
    }

    return filteredUsers.map((profile) => ({
      _id: profile._id,
      name: profile.name,
      role: profile.role,
      bio: profile.bio,
    }));
  },
});

// Send a message in DM chat
export const sendDMMessage = mutation({
  args: {
    chatSessionId: v.id("chatSessions"),
    content: v.string(),
    attachments: v.optional(v.array(v.union(
      v.string(), // Legacy format (URL only)
      v.object({
        url: v.string(),
        name: v.string(),
        size: v.number(),
        type: v.string(),
      })
    ))), // File attachments
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }
    const userId = userProfile._id;

    // Get the chat session to verify user is part of it
    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) {
      return {
        success: false,
        error: "Chat session not found",
      };
    }

    // Verify user is either participant1 or participant2
    if (userId !== chatSession.participant1Id && userId !== chatSession.participant2Id) {
      return {
        success: false,
        error: "Not authorized to send messages in this chat",
      };
    }

    // Create the DM message
    const messageId = await ctx.db.insert("dmMessages", {
      chatSessionId: args.chatSessionId,
      senderId: userId,
      content: args.content,
      createdAt: Date.now(),
      seenBy: [userId], // Sender has seen their own message
      attachments: args.attachments || [], // Include file attachments
    });

    return {
      success: true,
      messageId,
    };
  },
});

// Get messages for a DM chat session
export const getDMMessages = query({
  args: {
    chatSessionId: v.id("chatSessions"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return [];
    }
    const userId = userProfile._id;

    // Get the chat session to verify user is part of it
    const chatSession = await ctx.db.get(args.chatSessionId);
    if (!chatSession) {
      return [];
    }

    // Verify user is either participant1 or participant2
    if (userId !== chatSession.participant1Id && userId !== chatSession.participant2Id) {
      return [];
    }

    // Get messages for this chat session, ordered by creation time
    const messages = await ctx.db
      .query("dmMessages")
      .withIndex("by_chatSession", (q) => q.eq("chatSessionId", args.chatSessionId))
      .order("asc")
      .collect();

    // Get sender information for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: {
            _id: sender!._id,
            name: sender!.name,
            role: sender!.role,
          },
        };
      })
    );

    return messagesWithSenders;
  },
});

// Mark messages as seen
export const markMessagesAsSeen = mutation({
  args: {
    mentorshipId: v.optional(v.id("mentorships")),
    chatSessionId: v.optional(v.id("chatSessions")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }
    const userId = userProfile._id;

    if (args.mentorshipId) {
      // Mark mentorship messages as seen
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_mentorship", (q) => q.eq("mentorshipId", args.mentorshipId!))
        .collect();

      for (const message of messages) {
        // Don't mark own messages as seen
        if (message.senderId === userId) continue;

        // Check if already seen
        if (message.seenBy && message.seenBy.includes(userId)) continue;

        // Mark as seen
        await ctx.db.patch(message._id, {
          seenBy: [...(message.seenBy || []), userId],
        });
      }
    } else if (args.chatSessionId) {
      // Mark DM messages as seen
      const messages = await ctx.db
        .query("dmMessages")
        .withIndex("by_chatSession", (q) => q.eq("chatSessionId", args.chatSessionId!))
        .collect();

      for (const message of messages) {
        // Don't mark own messages as seen
        if (message.senderId === userId) continue;

        // Check if already seen
        if (message.seenBy && message.seenBy.includes(userId)) continue;

        // Mark as seen
        await ctx.db.patch(message._id, {
          seenBy: [...(message.seenBy || []), userId],
        });
      }
    }
  },
});

// Get unseen message count
export const getUnseenMessageCount = query({
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return { mentorshipUnseen: 0, dmUnseen: 0 };
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return { mentorshipUnseen: 0, dmUnseen: 0 };
    }
    const userId = userProfile._id;

    // Get active mentorships
    const mentorshipsAsMentor = await ctx.db
      .query("mentorships")
      .withIndex("by_mentor", (q) => q.eq("mentorId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const mentorshipsAsMentee = await ctx.db
      .query("mentorships")
      .withIndex("by_mentee", (q) => q.eq("menteeId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get DM chat sessions
    const chatSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_participant1", (q) => q.eq("participant1Id", userId))
      .collect();

    const chatSessions2 = await ctx.db
      .query("chatSessions")
      .withIndex("by_participant2", (q) => q.eq("participant2Id", userId))
      .collect();

    // Count unseen mentorship messages
    let mentorshipUnseen = 0;
    for (const mentorship of [...mentorshipsAsMentor, ...mentorshipsAsMentee]) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_mentorship", (q) => q.eq("mentorshipId", mentorship._id))
        .collect();

      for (const message of messages) {
        // Count messages not sent by current user and not seen
        if (message.senderId !== userId && (!message.seenBy || !message.seenBy.includes(userId))) {
          mentorshipUnseen++;
        }
      }
    }

    // Count unseen DM messages
    let dmUnseen = 0;
    for (const chatSession of [...chatSessions, ...chatSessions2]) {
      const messages = await ctx.db
        .query("dmMessages")
        .withIndex("by_chatSession", (q) => q.eq("chatSessionId", chatSession._id))
        .collect();

      for (const message of messages) {
        // Count messages not sent by current user and not seen
        if (message.senderId !== userId && (!message.seenBy || !message.seenBy.includes(userId))) {
          dmUnseen++;
        }
      }
    }

    return { mentorshipUnseen, dmUnseen };
  },
});

// Get unseen message count for a specific session
export const getUnseenCountForSession = query({
  args: {
    mentorshipId: v.optional(v.id("mentorships")),
    chatSessionId: v.optional(v.id("chatSessions")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return 0;
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return 0;
    }
    const userId = userProfile._id;

    let unseenCount = 0;

    if (args.mentorshipId) {
      // Count unseen mentorship messages
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_mentorship", (q) => q.eq("mentorshipId", args.mentorshipId!))
        .collect();

      for (const message of messages) {
        // Count messages not sent by current user and not seen
        if (message.senderId !== userId && (!message.seenBy || !message.seenBy.includes(userId))) {
          unseenCount++;
        }
      }
    } else if (args.chatSessionId) {
      // Count unseen DM messages
      const messages = await ctx.db
        .query("dmMessages")
        .withIndex("by_chatSession", (q) => q.eq("chatSessionId", args.chatSessionId!))
        .collect();

      for (const message of messages) {
        // Count messages not sent by current user and not seen
        if (message.senderId !== userId && (!message.seenBy || !message.seenBy.includes(userId))) {
          unseenCount++;
        }
      }
    }

    return unseenCount;
  },
});

// Get chat sessions for current user
export const getChatSessions = query({
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Get user profile from database using email
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return [];
    }
    const userId = userProfile._id;

    // Get active mentorships
    const mentorshipsAsMentor = await ctx.db
      .query("mentorships")
      .withIndex("by_mentor", (q) => q.eq("mentorId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const mentorshipsAsMentee = await ctx.db
      .query("mentorships")
      .withIndex("by_mentee", (q) => q.eq("menteeId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get chat sessions from DM requests
    const chatSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_participant1", (q) => q.eq("participant1Id", userId))
      .collect();

    const chatSessions2 = await ctx.db
      .query("chatSessions")
      .withIndex("by_participant2", (q) => q.eq("participant2Id", userId))
      .collect();

    // Combine all chat sessions
    const allSessions = [
      ...mentorshipsAsMentor.map((m) => ({ ...m, type: "mentorship" as const })),
      ...mentorshipsAsMentee.map((m) => ({ ...m, type: "mentorship" as const })),
      ...chatSessions.map((c) => ({ ...c, type: "dm" as const })),
      ...chatSessions2.map((c) => ({ ...c, type: "dm" as const })),
    ];

    // Get participant information for each session
    const sessionsWithParticipants = await Promise.all(
      allSessions.map(async (session) => {
        let otherParticipantId;
        if (session.type === "mentorship") {
          otherParticipantId = session.mentorId === userId ? session.menteeId : session.mentorId;
        } else {
          otherParticipantId = session.participant1Id === userId ? session.participant2Id : session.participant1Id;
        }

        const otherParticipant = await ctx.db.get(otherParticipantId);
        return {
          ...session,
          otherParticipant: {
            _id: otherParticipant!._id,
            name: otherParticipant!.name,
            role: otherParticipant!.role,
          },
        };
      })
    );

    return sessionsWithParticipants;
  },
});
