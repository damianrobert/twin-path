import { v } from "convex/values";
import {
  mutation,
  query,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  MutationCtx,
  QueryCtx,
} from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

const SKILL_LEVELS = [
  v.literal("beginner"),
  v.literal("some_experience"),
  v.literal("intermediate"),
  v.literal("advanced"),
] as const;

const TIME_BUDGETS = [
  v.literal("1-3h"),
  v.literal("3-5h"),
  v.literal("5-10h"),
  v.literal("10+h"),
] as const;

const LEARNING_STYLES = [
  v.literal("video"),
  v.literal("text"),
  v.literal("mixed"),
] as const;

const VIDEO_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
];

async function getAuthedUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first();
  if (!user) throw new Error("User not found");
  return user;
}

// ---------- QUERIES ----------

export const getMyRoadmaps = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return [];

    const roadmaps = await ctx.db
      .query("roadmaps")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const withProgress = await Promise.all(
      roadmaps.map(async (roadmap) => {
        const steps = await ctx.db
          .query("roadmapSteps")
          .withIndex("by_roadmap", (q) => q.eq("roadmapId", roadmap._id))
          .collect();
        const completed = steps.filter((s) => s.completedAt).length;
        const progress = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;
        return {
          ...roadmap,
          stepCount: steps.length,
          completedCount: completed,
          progress,
        };
      })
    );

    return withProgress;
  },
});

export const getRoadmapWithSteps = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return null;

    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) return null;
    if (roadmap.userId !== user._id) return null;

    const steps = await ctx.db
      .query("roadmapSteps")
      .withIndex("by_roadmap_order", (q) => q.eq("roadmapId", roadmap._id))
      .collect();

    const stepsWithResources = await Promise.all(
      steps.map(async (step) => {
        const resources = await ctx.db
          .query("roadmapResources")
          .withIndex("by_step_order", (q) => q.eq("stepId", step._id))
          .collect();
        return { ...step, resources: resources.sort((a, b) => a.order - b.order) };
      })
    );

    const sortedSteps = stepsWithResources.sort((a, b) => a.order - b.order);
    const completed = sortedSteps.filter((s) => s.completedAt).length;
    const progress = sortedSteps.length > 0
      ? Math.round((completed / sortedSteps.length) * 100)
      : 0;

    return {
      ...roadmap,
      steps: sortedSteps,
      progress,
      completedCount: completed,
    };
  },
});

// ---------- MUTATIONS ----------

export const toggleStepComplete = mutation({
  args: { stepId: v.id("roadmapSteps") },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    const step = await ctx.db.get(args.stepId);
    if (!step) throw new Error("Step not found");

    const roadmap = await ctx.db.get(step.roadmapId);
    if (!roadmap || roadmap.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.stepId, {
      completedAt: step.completedAt ? undefined : Date.now(),
    });
  },
});

export const deleteRoadmap = mutation({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap not found");
    if (roadmap.userId !== user._id) throw new Error("Unauthorized");

    const resources = await ctx.db
      .query("roadmapResources")
      .withIndex("by_roadmap", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();
    for (const r of resources) await ctx.db.delete(r._id);

    const steps = await ctx.db
      .query("roadmapSteps")
      .withIndex("by_roadmap", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();
    for (const s of steps) await ctx.db.delete(s._id);

    await ctx.db.delete(args.roadmapId);
  },
});

// ---------- INTERNAL MUTATIONS (called from actions) ----------

export const createEmptyRoadmap = internalMutation({
  args: {
    userId: v.id("users"),
    goal: v.string(),
    skillLevel: v.union(...SKILL_LEVELS),
    timeBudget: v.union(...TIME_BUDGETS),
    learningStyle: v.union(...LEARNING_STYLES),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("roadmaps", {
      userId: args.userId,
      goal: args.goal,
      title: "Generating roadmap…",
      description: "",
      skillLevel: args.skillLevel,
      timeBudget: args.timeBudget,
      learningStyle: args.learningStyle,
      status: "generating",
      createdAt: Date.now(),
    });
    return id;
  },
});

export const saveRoadmapStructure = internalMutation({
  args: {
    roadmapId: v.id("roadmaps"),
    title: v.string(),
    description: v.string(),
    estimatedWeeks: v.number(),
    steps: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        difficulty: v.union(
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced"),
        ),
        estimatedHours: v.number(),
        searchQueries: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roadmapId, {
      title: args.title,
      description: args.description,
      estimatedWeeks: args.estimatedWeeks,
      status: "enriching",
    });

    const stepIds: Id<"roadmapSteps">[] = [];
    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i];
      const stepId = await ctx.db.insert("roadmapSteps", {
        roadmapId: args.roadmapId,
        order: i + 1,
        title: step.title,
        description: step.description,
        difficulty: step.difficulty,
        estimatedHours: step.estimatedHours,
        searchQueries: step.searchQueries,
        resourcesStatus: "pending",
      });
      stepIds.push(stepId);
    }
    return stepIds;
  },
});

export const markRoadmapFailed = internalMutation({
  args: {
    roadmapId: v.id("roadmaps"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roadmapId, {
      status: "failed",
      error: args.error,
    });
  },
});

export const getStepForEnrichment = internalQuery({
  args: { stepId: v.id("roadmapSteps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.stepId);
  },
});

export const saveStepResources = internalMutation({
  args: {
    stepId: v.id("roadmapSteps"),
    roadmapId: v.id("roadmaps"),
    resources: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        description: v.optional(v.string()),
        type: v.union(v.literal("article"), v.literal("video")),
        source: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.resources.length; i++) {
      const r = args.resources[i];
      await ctx.db.insert("roadmapResources", {
        stepId: args.stepId,
        roadmapId: args.roadmapId,
        title: r.title,
        url: r.url,
        description: r.description,
        type: r.type,
        source: r.source,
        order: i,
      });
    }
    await ctx.db.patch(args.stepId, { resourcesStatus: "ready" });
  },
});

export const markStepEnrichmentFailed = internalMutation({
  args: { stepId: v.id("roadmapSteps") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.stepId, { resourcesStatus: "failed" });
  },
});

export const finalizeRoadmapIfReady = internalMutation({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("roadmapSteps")
      .withIndex("by_roadmap", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();
    const allDone = steps.every((s) => s.resourcesStatus !== "pending");
    if (allDone) {
      await ctx.db.patch(args.roadmapId, { status: "ready" });
    }
  },
});

// ---------- ACTIONS ----------

export const generateRoadmap = action({
  args: {
    goal: v.string(),
    skillLevel: v.union(...SKILL_LEVELS),
    timeBudget: v.union(...TIME_BUDGETS),
    learningStyle: v.union(...LEARNING_STYLES),
  },
  handler: async (ctx, args): Promise<{ roadmapId: Id<"roadmaps"> }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user: Doc<"users"> | null = await ctx.runQuery(internal.roadmaps.getUserByEmail, {
      email: identity.email!,
    });
    if (!user) throw new Error("User not found");

    const recent: Doc<"roadmaps">[] = await ctx.runQuery(internal.roadmaps.getRecentRoadmapCount, {
      userId: user._id,
      since: Date.now() - 24 * 60 * 60 * 1000,
    });
    if (recent.length >= 3) {
      throw new Error("Daily limit reached. You can create up to 3 roadmaps per day.");
    }

    const roadmapId: Id<"roadmaps"> = await ctx.runMutation(internal.roadmaps.createEmptyRoadmap, {
      userId: user._id,
      goal: args.goal,
      skillLevel: args.skillLevel,
      timeBudget: args.timeBudget,
      learningStyle: args.learningStyle,
    });

    // Kick off generation in the background so the user can be redirected immediately.
    // The detail page watches roadmap.status via a live query and updates as work completes.
    await ctx.scheduler.runAfter(0, internal.roadmaps.runGeneration, {
      roadmapId,
      goal: args.goal,
      skillLevel: args.skillLevel,
      timeBudget: args.timeBudget,
      learningStyle: args.learningStyle,
    });

    return { roadmapId };
  },
});

export const runGeneration = internalAction({
  args: {
    roadmapId: v.id("roadmaps"),
    goal: v.string(),
    skillLevel: v.union(...SKILL_LEVELS),
    timeBudget: v.union(...TIME_BUDGETS),
    learningStyle: v.union(...LEARNING_STYLES),
  },
  handler: async (ctx, args) => {
    try {
      const structure = await callGeminiForRoadmap({
        goal: args.goal,
        skillLevel: args.skillLevel,
        timeBudget: args.timeBudget,
        learningStyle: args.learningStyle,
      });

      const stepIds: Id<"roadmapSteps">[] = await ctx.runMutation(
        internal.roadmaps.saveRoadmapStructure,
        {
          roadmapId: args.roadmapId,
          title: structure.title,
          description: structure.description,
          estimatedWeeks: structure.estimatedWeeks,
          steps: structure.steps,
        }
      );

      for (const stepId of stepIds) {
        await ctx.scheduler.runAfter(0, internal.roadmaps.enrichStep, {
          stepId,
          roadmapId: args.roadmapId,
          learningStyle: args.learningStyle,
        });
      }
    } catch (error) {
      console.error("Roadmap generation error:", error);
      await ctx.runMutation(internal.roadmaps.markRoadmapFailed, {
        roadmapId: args.roadmapId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

export const enrichStep = internalAction({
  args: {
    stepId: v.id("roadmapSteps"),
    roadmapId: v.id("roadmaps"),
    learningStyle: v.union(...LEARNING_STYLES),
  },
  handler: async (ctx, args) => {
    const step: Doc<"roadmapSteps"> | null = await ctx.runQuery(
      internal.roadmaps.getStepForEnrichment,
      { stepId: args.stepId }
    );
    if (!step) return;

    try {
      const resources = await searchBraveForStep(
        step.searchQueries || [],
        args.learningStyle
      );
      await ctx.runMutation(internal.roadmaps.saveStepResources, {
        stepId: args.stepId,
        roadmapId: args.roadmapId,
        resources,
      });
    } catch (error) {
      console.error("Step enrichment error:", error);
      await ctx.runMutation(internal.roadmaps.markStepEnrichmentFailed, {
        stepId: args.stepId,
      });
    } finally {
      await ctx.runMutation(internal.roadmaps.finalizeRoadmapIfReady, {
        roadmapId: args.roadmapId,
      });
    }
  },
});

// ---------- INTERNAL HELPER QUERIES ----------

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getRecentRoadmapCount = internalQuery({
  args: { userId: v.id("users"), since: v.number() },
  handler: async (ctx, args) => {
    const roadmaps = await ctx.db
      .query("roadmaps")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", args.userId).gte("createdAt", args.since)
      )
      .collect();
    return roadmaps;
  },
});

// ---------- AI + SEARCH HELPERS (pure functions) ----------

type RoadmapStructure = {
  title: string;
  description: string;
  estimatedWeeks: number;
  steps: Array<{
    title: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedHours: number;
    searchQueries: string[];
  }>;
};

async function callGeminiForRoadmap(args: {
  goal: string;
  skillLevel: string;
  timeBudget: string;
  learningStyle: string;
}): Promise<RoadmapStructure> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `You are an expert career and learning coach. Create a detailed, actionable learning roadmap for the following learner.

Learner goal: "${args.goal}"
Current skill level: ${args.skillLevel}
Time budget per week: ${args.timeBudget}
Preferred learning style: ${args.learningStyle}

Produce a roadmap with 8 to 14 steps, ordered from foundational to advanced. Each step must be concrete and sequential — the learner should be able to follow them in order.

For each step you MUST provide:
- title: short action-oriented title (max 60 chars, e.g. "Master Linux Fundamentals")
- description: 1-2 sentences explaining what the learner will do and why it matters
- difficulty: "beginner" | "intermediate" | "advanced"
- estimatedHours: realistic number of hours to complete this step (5-80)
- searchQueries: exactly 3 specific, focused web search queries that would surface the best articles and videos for this step. Queries should be concrete terms a real learner would type, not generic ("kubernetes networking for beginners" not "learn kubernetes").

Also provide at the top level:
- title: a compelling roadmap name (e.g. "Become a DevOps Engineer")
- description: 1-2 sentence overview of the whole roadmap
- estimatedWeeks: realistic total duration given the time budget

Return ONLY valid JSON matching this exact shape, no markdown, no preamble:
{
  "title": "string",
  "description": "string",
  "estimatedWeeks": number,
  "steps": [
    {
      "title": "string",
      "description": "string",
      "difficulty": "beginner" | "intermediate" | "advanced",
      "estimatedHours": number,
      "searchQueries": ["string", "string", "string"]
    }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  type RawStep = {
    title?: unknown;
    description?: unknown;
    difficulty?: unknown;
    estimatedHours?: unknown;
    searchQueries?: unknown;
  };
  type RawRoadmap = {
    title?: unknown;
    description?: unknown;
    estimatedWeeks?: unknown;
    steps?: unknown;
  };

  let parsed: RawRoadmap;
  try {
    parsed = JSON.parse(text) as RawRoadmap;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse JSON from Gemini response");
    parsed = JSON.parse(match[0]) as RawRoadmap;
  }

  if (!parsed.title || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new Error("Invalid roadmap structure from Gemini");
  }

  const steps = (parsed.steps as RawStep[])
    .slice(0, 14)
    .map((s) => ({
      title: String(s.title || "Untitled step").slice(0, 120),
      description: String(s.description || ""),
      difficulty:
        s.difficulty === "beginner" || s.difficulty === "intermediate" || s.difficulty === "advanced"
          ? (s.difficulty as "beginner" | "intermediate" | "advanced")
          : ("beginner" as const),
      estimatedHours: Math.max(1, Math.min(200, Number(s.estimatedHours) || 10)),
      searchQueries: Array.isArray(s.searchQueries)
        ? (s.searchQueries as unknown[])
            .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
            .slice(0, 3)
        : [],
    }))
    .filter((s) => s.searchQueries.length > 0);

  return {
    title: String(parsed.title).slice(0, 120),
    description: String(parsed.description || ""),
    estimatedWeeks: Math.max(1, Math.min(104, Number(parsed.estimatedWeeks) || 12)),
    steps,
  };
}

async function searchBraveForStep(
  queries: string[],
  learningStyle: string
): Promise<
  Array<{
    title: string;
    url: string;
    description?: string;
    type: "article" | "video";
    source: string;
  }>
> {
  const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY;
  if (!BRAVE_KEY) {
    throw new Error("BRAVE_SEARCH_API_KEY is not configured");
  }

  type BraveResult = {
    url: string;
    title: string;
    description?: string;
  };

  const allResults: BraveResult[] = [];
  for (const query of queries) {
    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query
      )}&count=5&safesearch=strict`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": BRAVE_KEY,
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { web?: { results?: BraveResult[] } };
      const webResults = data?.web?.results || [];
      for (const r of webResults) {
        if (!r?.url || !r?.title) continue;
        allResults.push(r);
      }
    } catch (e) {
      console.error("Brave search error for query:", query, e);
    }
  }

  // Dedupe by URL
  const seen = new Set<string>();
  const deduped = allResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  // Classify + enrich
  const classified = deduped.map((r) => {
    const domain = extractDomain(r.url);
    const isVideo = VIDEO_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
    return {
      title: cleanTitle(r.title),
      url: r.url,
      description: typeof r.description === "string" ? stripHtml(r.description) : undefined,
      type: isVideo ? ("video" as const) : ("article" as const),
      source: domain,
    };
  });

  // Rank: preferred type first based on learning style
  const preferred = learningStyle === "video" ? "video" : learningStyle === "text" ? "article" : null;
  const sorted = [...classified].sort((a, b) => {
    if (preferred) {
      if (a.type === preferred && b.type !== preferred) return -1;
      if (b.type === preferred && a.type !== preferred) return 1;
    }
    return 0;
  });

  return sorted.slice(0, 5);
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase();
  } catch {
    return "";
  }
}

function cleanTitle(title: string): string {
  return String(title)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function stripHtml(s: string): string {
  return String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 280);
}
