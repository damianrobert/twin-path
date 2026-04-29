import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

async function getAuthUserId(ctx: any) {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) return null;

  const profile = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", user.email))
    .first();

  return profile?._id ?? null;
}

export const getSessions = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const rows = await ctx.db
      .query("lumenSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    return rows
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt)
      .map((r: any) => ({
        id: r.clientId,
        title: r.title,
        messages: r.messages,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
  },
});

export const syncSession = mutation({
  args: {
    clientId: v.string(),
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("model")),
        content: v.string(),
        canvasType: v.optional(
          v.union(v.literal("component"), v.literal("markdown"))
        ),
        timestamp: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("lumenSessions")
      .withIndex("by_user_clientid", (q: any) =>
        q.eq("userId", userId).eq("clientId", args.clientId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        messages: args.messages,
        updatedAt: args.updatedAt,
      });
    } else {
      await ctx.db.insert("lumenSessions", {
        userId,
        clientId: args.clientId,
        title: args.title,
        messages: args.messages,
        createdAt: args.createdAt,
        updatedAt: args.updatedAt,
      });
    }
  },
});

export const deleteSession = mutation({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("lumenSessions")
      .withIndex("by_user_clientid", (q: any) =>
        q.eq("userId", userId).eq("clientId", args.clientId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
