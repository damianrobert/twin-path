/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as assignments from "../assignments.js";
import type * as auth from "../auth.js";
import type * as blogReports from "../blogReports.js";
import type * as courseModules from "../courseModules.js";
import type * as courses from "../courses.js";
import type * as emergency from "../emergency.js";
import type * as http from "../http.js";
import type * as lumen from "../lumen.js";
import type * as mentorshipRequests from "../mentorshipRequests.js";
import type * as mentorships from "../mentorships.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as platformSettings from "../platformSettings.js";
import type * as posts from "../posts.js";
import type * as presence from "../presence.js";
import type * as roadmaps from "../roadmaps.js";
import type * as runMigration from "../runMigration.js";
import type * as supportCases from "../supportCases.js";
import type * as topics from "../topics.js";
import type * as users from "../users.js";
import type * as validation from "../validation.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  assignments: typeof assignments;
  auth: typeof auth;
  blogReports: typeof blogReports;
  courseModules: typeof courseModules;
  courses: typeof courses;
  emergency: typeof emergency;
  http: typeof http;
  lumen: typeof lumen;
  mentorshipRequests: typeof mentorshipRequests;
  mentorships: typeof mentorships;
  messages: typeof messages;
  migrations: typeof migrations;
  platformSettings: typeof platformSettings;
  posts: typeof posts;
  presence: typeof presence;
  roadmaps: typeof roadmaps;
  runMigration: typeof runMigration;
  supportCases: typeof supportCases;
  topics: typeof topics;
  users: typeof users;
  validation: typeof validation;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
