import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

// Create a new course module
export const createModule = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
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

    // Get the course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    // Check if user is the instructor
    if (course.instructorId !== userProfile._id) {
      throw new ConvexError("Only the course instructor can create modules");
    }

    // Create the module
    const moduleId = await ctx.db.insert("courseModules", {
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      order: args.order,
      isPublished: false,
      createdAt: Date.now(),
    });

    return moduleId;
  },
});

// Get modules for a course
export const getCourseModules = query({
  args: {
    courseId: v.id("courses"),
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

    // Get the course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return [];
    }

    // Check if user is the instructor or if course is published
    const isInstructor = course.instructorId === userProfile._id;
    const canAccess = isInstructor || course.status === "published";

    if (!canAccess) {
      return [];
    }

    // Get modules
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .order("asc")
      .collect();

    // If not instructor, only return published modules
    if (!isInstructor) {
      return modules.filter(module => module.isPublished);
    }

    return modules;
  },
});

// Update a module
export const updateModule = mutation({
  args: {
    moduleId: v.id("courseModules"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
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

    // Get the module
    const module = await ctx.db.get(args.moduleId);
    if (!module) {
      throw new ConvexError("Module not found");
    }

    // Get the course
    const course = await ctx.db.get(module.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    // Check if user is the instructor
    if (course.instructorId !== userProfile._id) {
      throw new ConvexError("Only the course instructor can update modules");
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Add provided fields to update data
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.order !== undefined) updateData.order = args.order;
    if (args.isPublished !== undefined) updateData.isPublished = args.isPublished;

    await ctx.db.patch(args.moduleId, updateData);

    return args.moduleId;
  },
});

// Delete a module
export const deleteModule = mutation({
  args: {
    moduleId: v.id("courseModules"),
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

    // Get the module
    const module = await ctx.db.get(args.moduleId);
    if (!module) {
      throw new ConvexError("Module not found");
    }

    // Get the course
    const course = await ctx.db.get(module.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    // Check if user is the instructor
    if (course.instructorId !== userProfile._id) {
      throw new ConvexError("Only the course instructor can delete modules");
    }

    // Delete the module
    await ctx.db.delete(args.moduleId);

    return args.moduleId;
  },
});

// Upload video for module
export const uploadModuleVideo = mutation({
  args: {
    moduleId: v.id("courseModules"),
    videoUrl: v.string(),
    videoName: v.string(),
    videoSize: v.number(),
    videoType: v.string(),
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

    // Get the module
    const module = await ctx.db.get(args.moduleId);
    if (!module) {
      throw new ConvexError("Module not found");
    }

    // Get the course
    const course = await ctx.db.get(module.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    // Check if user is the instructor
    if (course.instructorId !== userProfile._id) {
      throw new ConvexError("Only the course instructor can upload videos");
    }

    // Update module with video info
    await ctx.db.patch(args.moduleId, {
      videoUrl: args.videoUrl,
      videoName: args.videoName,
      videoSize: args.videoSize,
      videoType: args.videoType,
      updatedAt: Date.now(),
    });

    return args.moduleId;
  },
});

// Upload file for module
export const uploadModuleFile = mutation({
  args: {
    moduleId: v.id("courseModules"),
    fileUrl: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
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

    // Get the module
    const module = await ctx.db.get(args.moduleId);
    if (!module) {
      throw new ConvexError("Module not found");
    }

    // Get the course
    const course = await ctx.db.get(module.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    // Check if user is the instructor
    if (course.instructorId !== userProfile._id) {
      throw new ConvexError("Only the course instructor can upload files");
    }

    // Update module with file info
    await ctx.db.patch(args.moduleId, {
      fileUrl: args.fileUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileType: args.fileType,
      updatedAt: Date.now(),
    });

    return args.moduleId;
  },
});

// Get module by ID with progress info
export const getModuleById = query({
  args: {
    moduleId: v.id("courseModules"),
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

    // Get the module
    const module = await ctx.db.get(args.moduleId);
    if (!module) {
      return null;
    }

    // Get the course
    const course = await ctx.db.get(module.courseId);
    if (!course) {
      return null;
    }

    // Check if user is the instructor or if course is published and module is published
    const isInstructor = course.instructorId === userProfile._id;
    const canAccess = isInstructor || (course.status === "published" && module.isPublished);

    if (!canAccess) {
      return null;
    }

    // Get progress info if student
    let progress = null;
    if (!isInstructor && (userProfile.role === "mentee" || userProfile.role === "both")) {
      const enrollment = await ctx.db
        .query("courseEnrollments")
        .withIndex("by_course_student", (q) => 
          q.eq("courseId", module.courseId).eq("studentId", userProfile._id)
        )
        .first();

      if (enrollment) {
        progress = await ctx.db
          .query("moduleProgress")
          .withIndex("by_student_module", (q) => 
            q.eq("studentId", userProfile._id).eq("moduleId", args.moduleId)
          )
          .first();
      }
    }

    return {
      ...module,
      course: {
        _id: course._id,
        title: course.title,
        instructorId: course.instructorId,
      },
      progress,
      isInstructor,
    };
  },
});

// Update module progress
export const updateModuleProgress = mutation({
  args: {
    moduleId: v.id("courseModules"),
    isCompleted: v.boolean(),
    watchTime: v.optional(v.number()),
    lastPosition: v.optional(v.number()),
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

    // Only mentees can update progress
    if (userProfile.role !== "mentee" && userProfile.role !== "both") {
      throw new ConvexError("Only mentees can update progress");
    }

    // Get the module
    const module = await ctx.db.get(args.moduleId);
    if (!module) {
      throw new ConvexError("Module not found");
    }

    // Get enrollment
    const enrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course_student", (q) => 
        q.eq("courseId", module.courseId).eq("studentId", userProfile._id)
      )
      .first();

    if (!enrollment) {
      throw new ConvexError("Not enrolled in this course");
    }

    // Get or create progress record
    let progress = await ctx.db
      .query("moduleProgress")
      .withIndex("by_student_module", (q) => 
        q.eq("studentId", userProfile._id).eq("moduleId", args.moduleId)
      )
      .first();

    const updateData: any = {
      isCompleted: args.isCompleted,
    };

    if (args.isCompleted && !progress?.isCompleted) {
      updateData.completedAt = Date.now();
    }

    if (args.watchTime !== undefined) updateData.watchTime = args.watchTime;
    if (args.lastPosition !== undefined) updateData.lastPosition = args.lastPosition;

    if (progress) {
      await ctx.db.patch(progress._id, updateData);
    } else {
      await ctx.db.insert("moduleProgress", {
        enrollmentId: enrollment._id,
        moduleId: args.moduleId,
        studentId: userProfile._id,
        isCompleted: args.isCompleted,
        completedAt: args.isCompleted ? Date.now() : undefined,
        watchTime: args.watchTime,
        lastPosition: args.lastPosition,
      });
    }

    // Update enrollment progress
    const allProgress = await ctx.db
      .query("moduleProgress")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", enrollment._id))
      .collect();

    const totalModules = await ctx.db
      .query("courseModules")
      .withIndex("by_course", (q) => q.eq("courseId", module.courseId))
      .collect();

    const completedModules = allProgress.filter(p => p.isCompleted);
    const progressPercentage = Math.round((completedModules.length / totalModules.length) * 100);

    const completedModuleIds = completedModules.map(p => p.moduleId);

    await ctx.db.patch(enrollment._id, {
      progress: progressPercentage,
      completedModules: completedModuleIds,
      lastAccessedAt: Date.now(),
      currentModule: args.moduleId,
    });

    // Check if course is completed
    if (progressPercentage === 100 && !enrollment.completedAt) {
      await ctx.db.patch(enrollment._id, {
        completedAt: Date.now(),
      });
    }

    return args.moduleId;
  },
});

// Generate upload URL for course files
export const generateCourseUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Store uploaded course file
export const storeCourseUploadedFile = mutation({
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
