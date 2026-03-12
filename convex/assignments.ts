import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

// Upload files to Convex storage
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Store file URL after upload
export const storeUploadedFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Create a new assignment
export const createAssignment = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
    title: v.string(),
    description: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Get user profile
    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      throw new ConvexError("User profile not found");
    }

    // Get the mentorship
    const mentorship = await ctx.db.get(args.mentorshipId);
    
    if (!mentorship) {
      throw new ConvexError("Mentorship not found");
    }

    // Check if user is the mentor
    if (mentorship.mentorId !== userProfile._id) {
      throw new ConvexError("Only mentors can create assignments");
    }

    // Check if mentorship is active
    if (mentorship.status !== "active") {
      throw new ConvexError("Can only create assignments for active mentorships");
    }

    // Create the assignment
    const assignmentId = await ctx.db.insert("assignments", {
      mentorshipId: args.mentorshipId,
      title: args.title,
      description: args.description,
      mentorFiles: [],
      menteeFiles: [],
      status: "pending",
      createdAt: Date.now(),
      dueDate: args.dueDate,
    });

    return assignmentId;
  },
});

// Get assignments for a mentorship
export const getAssignmentsForMentorship = query({
  args: {
    mentorshipId: v.id("mentorships"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      return [];
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return [];
    }

    // Get the mentorship
    const mentorship = await ctx.db.get(args.mentorshipId);
    
    if (!mentorship) {
      return [];
    }

    // Check if user is part of this mentorship
    if (mentorship.menteeId !== userProfile._id && mentorship.mentorId !== userProfile._id) {
      return [];
    }

    // Get assignments
    const assignments = await ctx.db
      .query("assignments")
      .filter((q) => q.eq(q.field("mentorshipId"), args.mentorshipId))
      .order("asc")
      .collect();

    return assignments;
  },
});

// Update assignment status
export const updateAssignmentStatus = mutation({
  args: {
    assignmentId: v.id("assignments"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("reviewed")),
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

    // Get the assignment
    const assignment = await ctx.db.get(args.assignmentId);
    
    if (!assignment) {
      throw new ConvexError("Assignment not found");
    }

    // Get the mentorship
    const mentorship = await ctx.db.get(assignment.mentorshipId);
    
    if (!mentorship) {
      throw new ConvexError("Mentorship not found");
    }

    // Check if user is part of this mentorship
    if (mentorship.menteeId !== userProfile._id && mentorship.mentorId !== userProfile._id) {
      throw new ConvexError("You are not part of this mentorship");
    }

    // Validate status transitions
    const isMentor = mentorship.mentorId === userProfile._id;
    const isMentee = mentorship.menteeId === userProfile._id;

    if (isMentee) {
      // Mentees can only mark as in_progress or completed
      if (args.status !== "in_progress" && args.status !== "completed") {
        throw new ConvexError("Mentees can only mark assignments as in progress or completed");
      }
    } else if (isMentor) {
      // Mentors can only mark as reviewed
      if (args.status !== "reviewed") {
        throw new ConvexError("Mentors can only mark assignments as reviewed");
      }
    }

    // Update assignment
    const updateData: any = {
      status: args.status,
    };

    if (args.status === "completed" || args.status === "reviewed") {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(args.assignmentId, updateData);

    return args.assignmentId;
  },
});

// Upload files for assignment
export const uploadAssignmentFiles = mutation({
  args: {
    assignmentId: v.id("assignments"),
    files: v.array(v.object({
      url: v.string(),
      name: v.string(),
      size: v.number(),
      type: v.string(),
    })),
    isMentor: v.boolean(),
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

    // Get the assignment
    const assignment = await ctx.db.get(args.assignmentId);
    
    if (!assignment) {
      throw new ConvexError("Assignment not found");
    }

    // Get the mentorship
    const mentorship = await ctx.db.get(assignment.mentorshipId);
    
    if (!mentorship) {
      throw new ConvexError("Mentorship not found");
    }

    // Check if user is part of this mentorship
    if (mentorship.menteeId !== userProfile._id && mentorship.mentorId !== userProfile._id) {
      throw new ConvexError("You are not part of this mentorship");
    }

    // Validate user role matches file upload type
    const isMentor = mentorship.mentorId === userProfile._id;
    const isMentee = mentorship.menteeId === userProfile._id;

    if (args.isMentor && !isMentor) {
      throw new ConvexError("Only mentors can upload mentor files");
    }

    if (!args.isMentor && !isMentee) {
      throw new ConvexError("Only mentees can upload mentee files");
    }

    // Update assignment files
    const fieldName = args.isMentor ? "mentorFiles" : "menteeFiles";
    const currentFiles = assignment[fieldName] || [];
    
    await ctx.db.patch(args.assignmentId, {
      [fieldName]: [...currentFiles, ...args.files],
    });

    return args.assignmentId;
  },
});

// Update assignment grade and feedback
export const updateAssignmentGrade = mutation({
  args: {
    assignmentId: v.id("assignments"),
    grade: v.number(),
    feedback: v.optional(v.string()),
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

    // Get the assignment
    const assignment = await ctx.db.get(args.assignmentId);
    
    if (!assignment) {
      throw new ConvexError("Assignment not found");
    }

    // Get the mentorship
    const mentorship = await ctx.db.get(assignment.mentorshipId);
    
    if (!mentorship) {
      throw new ConvexError("Mentorship not found");
    }

    // Check if user is the mentor
    if (mentorship.mentorId !== userProfile._id) {
      throw new ConvexError("Only mentors can grade assignments");
    }

    // Check if assignment is reviewed (can only grade reviewed assignments)
    if (assignment.status !== "reviewed") {
      throw new ConvexError("Can only grade reviewed assignments");
    }

    // Update assignment with grade and feedback
    await ctx.db.patch(args.assignmentId, {
      grade: args.grade,
      feedback: args.feedback,
    });

    return args.assignmentId;
  },
});

// Get assignment by ID
export const getAssignmentById = query({
  args: {
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if (!user) {
      return null;
    }

    const userProfile = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (!userProfile) {
      return null;
    }

    // Get the assignment
    const assignment = await ctx.db.get(args.assignmentId);
    
    if (!assignment) {
      return null;
    }

    // Get the mentorship
    const mentorship = await ctx.db.get(assignment.mentorshipId);
    
    if (!mentorship) {
      return null;
    }

    // Check if user is part of this mentorship
    if (mentorship.menteeId !== userProfile._id && mentorship.mentorId !== userProfile._id) {
      return null;
    }

    // Get mentor and mentee profiles
    const mentor = await ctx.db.get(mentorship.mentorId);
    const mentee = await ctx.db.get(mentorship.menteeId);
    const topic = await ctx.db.get(mentorship.topicId);

    if (!mentor || !mentee || !topic) {
      return null;
    }

    // Return assignment with populated mentorship data
    return {
      ...assignment,
      mentorship: {
        mentor: {
          _id: mentor._id,
          name: mentor.name,
          email: mentor.email,
          bio: mentor.bio,
          role: mentor.role,
          professionalExperience: mentor.professionalExperience,
          portfolioUrl: mentor.portfolioUrl,
          githubUrl: mentor.githubUrl,
          linkedinUrl: mentor.linkedinUrl,
          yearsOfExperience: mentor.yearsOfExperience,
          teachingExperience: mentor.teachingExperience,
          availability: mentor.availability,
        },
        mentee: {
          _id: mentee._id,
          name: mentee.name,
          email: mentee.email,
          bio: mentee.bio,
          role: mentee.role,
          professionalExperience: mentee.professionalExperience,
          portfolioUrl: mentee.portfolioUrl,
          githubUrl: mentee.githubUrl,
          linkedinUrl: mentee.linkedinUrl,
          yearsOfExperience: mentee.yearsOfExperience,
          teachingExperience: mentee.teachingExperience,
          availability: mentee.availability,
        },
        topic: {
          _id: topic._id,
          name: topic.name,
          description: topic.description,
        },
      },
    };
  },
});
