import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convex = new ConvexHttpClient("http://localhost:30001");

async function seedSampleCourse() {
  try {
    console.log("Seeding sample course...");

    // Get or create a mentor user
    const users = await convex.query(api.users.getAllUsers || (() => []));
    let mentorUser = users.find(u => u.role === "mentor" || u.role === "both");
    
    if (!mentorUser) {
      console.log("No mentor user found. Please create a mentor user first.");
      return;
    }

    // Get a topic
    const topics = await convex.query(api.topics.getAllTopics);
    if (topics.length === 0) {
      console.log("No topics found. Please initialize topics first.");
      return;
    }

    const topic = topics[0];

    // Create a sample course
    const courseId = await convex.mutation(api.courses.createCourse, {
      title: "Introduction to Web Development",
      description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript. This comprehensive course covers everything you need to know to build modern web applications.",
      topicId: topic._id,
      difficulty: "beginner",
      estimatedDuration: 180, // 3 hours
      prerequisites: ["Basic computer skills", "Understanding of how websites work"],
      learningObjectives: [
        "Understand HTML structure and semantic markup",
        "Style web pages with CSS including flexbox and grid",
        "Add interactivity with JavaScript",
        "Build responsive web applications",
        "Use modern development tools and workflows"
      ]
    });

    console.log("Created course:", courseId);

    // Create sample modules
    const module1Id = await convex.mutation(api.courseModules.createModule, {
      courseId,
      title: "Module 1: HTML Fundamentals",
      description: "Learn the building blocks of the web - HTML5 semantic markup, forms, and accessibility.",
      order: 1
    });

    const module2Id = await convex.mutation(api.courseModules.createModule, {
      courseId,
      title: "Module 2: CSS Styling",
      description: "Master CSS including selectors, layouts, animations, and responsive design.",
      order: 2
    });

    const module3Id = await convex.mutation(api.courseModules.createModule, {
      courseId,
      title: "Module 3: JavaScript Basics",
      description: "Introduction to JavaScript programming, DOM manipulation, and event handling.",
      order: 3
    });

    console.log("Created modules:", [module1Id, module2Id, module3Id]);

    // Publish the course
    await convex.mutation(api.courses.updateCourse, {
      courseId,
      status: "published"
    });

    console.log("Published course successfully!");
    console.log("Course ID:", courseId);
    console.log("You can now view this course at /courses");

  } catch (error) {
    console.error("Error seeding sample course:", error);
  }
}

seedSampleCourse();
