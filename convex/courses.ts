import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

// Create a new course
export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    topicId: v.id("topics"),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedDuration: v.optional(v.number()),
    prerequisites: v.optional(v.array(v.string())),
    learningObjectives: v.optional(v.array(v.string())),
    thumbnail: v.optional(v.string()),
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

    // Check if user is a mentor or both
    if (userProfile.role !== "mentor" && userProfile.role !== "both") {
      throw new ConvexError("Only mentors can create courses");
    }

    // Verify topic exists
    const topic = await ctx.db.get(args.topicId);
    if (!topic) {
      throw new ConvexError("Topic not found");
    }

    // Create the course
    const courseId = await ctx.db.insert("courses", {
      title: args.title,
      description: args.description,
      instructorId: userProfile._id,
      topicId: args.topicId,
      status: "draft",
      difficulty: args.difficulty,
      estimatedDuration: args.estimatedDuration,
      prerequisites: args.prerequisites,
      learningObjectives: args.learningObjectives,
      thumbnail: args.thumbnail,
      enrollmentCount: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: Date.now(),
    });

    return courseId;
  },
});

// Get courses for the current user (instructor)
export const getInstructorCourses = query({
  handler: async (ctx) => {
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

    // Only mentors can have courses
    if (userProfile.role !== "mentor" && userProfile.role !== "both") {
      return [];
    }

    // Get courses by instructor
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_instructor", (q) => q.eq("instructorId", userProfile._id))
      .order("desc")
      .collect();

    // Populate with topic and instructor info
    const populatedCourses = await Promise.all(
      courses.map(async (course) => {
        const topic = await ctx.db.get(course.topicId);
        return {
          ...course,
          topic,
          instructor: {
            _id: userProfile._id,
            name: userProfile.name,
            email: userProfile.email,
            bio: userProfile.bio,
          },
        };
      })
    );

    return populatedCourses;
  },
});

// Get all published courses (for course discovery)
export const getPublishedCourses = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    let coursesQuery = ctx.db
      .query("courses")
      .withIndex("by_published", (q) => q.eq("status", "published"))
      .order("desc");

    if (args.cursor) {
      // For pagination, we'd need to implement cursor-based pagination
      // For now, just return the first batch
    }

    const courses = await coursesQuery.take(limit);

    // Populate with instructor and topic info
    const populatedCourses = await Promise.all(
      courses.map(async (course) => {
        const instructor = await ctx.db.get(course.instructorId);
        const topic = await ctx.db.get(course.topicId);
        return {
          ...course,
          instructor: instructor ? {
            _id: instructor._id,
            name: instructor.name,
            bio: instructor.bio,
            professionalExperience: instructor.professionalExperience,
            yearsOfExperience: instructor.yearsOfExperience,
          } : null,
          topic,
        };
      })
    );

    return populatedCourses;
  },
});

// Get course by ID with modules and enrollment info
export const getCourseById = query({
  args: {
    courseId: v.id("courses"),
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

    // Get the course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return null;
    }

    // Get instructor and topic info
    const instructor = await ctx.db.get(course.instructorId);
    const topic = await ctx.db.get(course.topicId);

    if (!instructor || !topic) {
      return null;
    }

    // Get modules for this course
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .order("asc")
      .collect();

    // Check if user is enrolled (for mentees)
    let enrollment = null;
    if (userProfile.role === "mentee" || userProfile.role === "both") {
      enrollment = await ctx.db
        .query("courseEnrollments")
        .withIndex("by_course_student", (q) => 
          q.eq("courseId", args.courseId).eq("studentId", userProfile._id)
        )
        .first();
    }

    // Check if user is the instructor
    const isInstructor = course.instructorId === userProfile._id;
    const canAccess = isInstructor || course.status === "published" || enrollment;

    if (!canAccess) {
      return null;
    }

    return {
      ...course,
      instructor: {
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        bio: instructor.bio,
        professionalExperience: instructor.professionalExperience,
        yearsOfExperience: instructor.yearsOfExperience,
      },
      topic,
      modules,
      enrollment,
      isInstructor,
    };
  },
});

// Update course
export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    estimatedDuration: v.optional(v.number()),
    prerequisites: v.optional(v.array(v.string())),
    learningObjectives: v.optional(v.array(v.string())),
    thumbnail: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
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
      throw new ConvexError("Only the course instructor can update the course");
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Add provided fields to update data
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.difficulty !== undefined) updateData.difficulty = args.difficulty;
    if (args.estimatedDuration !== undefined) updateData.estimatedDuration = args.estimatedDuration;
    if (args.prerequisites !== undefined) updateData.prerequisites = args.prerequisites;
    if (args.learningObjectives !== undefined) updateData.learningObjectives = args.learningObjectives;
    if (args.thumbnail !== undefined) updateData.thumbnail = args.thumbnail;
    if (args.status !== undefined) {
      updateData.status = args.status;
      if (args.status === "published" && course.status !== "published") {
        updateData.publishedAt = Date.now();
      }
    }

    await ctx.db.patch(args.courseId, updateData);

    return args.courseId;
  },
});

// Delete course (only if draft and no enrollments)
export const deleteCourse = mutation({
  args: {
    courseId: v.id("courses"),
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
      throw new ConvexError("Only the course instructor can delete the course");
    }

    // Can only delete draft courses
    if (course.status !== "draft") {
      throw new ConvexError("Can only delete draft courses");
    }

    // Check if there are any enrollments
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    if (enrollments.length > 0) {
      throw new ConvexError("Cannot delete course with enrollments");
    }

    // Delete all modules first
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    for (const module of modules) {
      await ctx.db.delete(module._id);
    }

    // Delete the course
    await ctx.db.delete(args.courseId);

    return args.courseId;
  },
});

// Enroll in a course
export const enrollInCourse = mutation({
  args: {
    courseId: v.id("courses"),
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

    // Only mentees can enroll
    if (userProfile.role !== "mentee" && userProfile.role !== "both") {
      throw new ConvexError("Only mentees can enroll in courses");
    }

    // Get the course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    // Course must be published
    if (course.status !== "published") {
      throw new ConvexError("Can only enroll in published courses");
    }

    // Check if already enrolled
    const existingEnrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course_student", (q) => 
        q.eq("courseId", args.courseId).eq("studentId", userProfile._id)
      )
      .first();

    if (existingEnrollment) {
      throw new ConvexError("Already enrolled in this course");
    }

    // Create enrollment
    const enrollmentId = await ctx.db.insert("courseEnrollments", {
      courseId: args.courseId,
      studentId: userProfile._id,
      enrolledAt: Date.now(),
      progress: 0,
      completedModules: [],
    });

    // Update course enrollment count
    await ctx.db.patch(args.courseId, {
      enrollmentCount: (course.enrollmentCount || 0) + 1,
    });

    return enrollmentId;
  },
});

// Get user's course enrollments
export const getUserEnrollments = query({
  handler: async (ctx) => {
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

    // Only mentees can have enrollments
    if (userProfile.role !== "mentee" && userProfile.role !== "both") {
      return [];
    }

    // Get enrollments
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_student", (q) => q.eq("studentId", userProfile._id))
      .order("desc")
      .collect();

    // Populate with course, instructor, and modules info
    const populatedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId);
        if (!course) return null;

        const instructor = await ctx.db.get(course.instructorId);
        const topic = await ctx.db.get(course.topicId);

        // Get course modules
        const modules = await ctx.db
          .query("courseModules")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .order("asc")
          .collect();

        return {
          ...enrollment,
          course: {
            ...course,
            instructor: instructor ? {
              _id: instructor._id,
              name: instructor.name,
              bio: instructor.bio,
            } : null,
            topic,
            modules,
          },
        };
      })
    );

    return populatedEnrollments.filter(Boolean);
  },
});
