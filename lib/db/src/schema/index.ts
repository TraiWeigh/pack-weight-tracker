// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const shareLinksTable = pgTable("share_links", {
  id:        text("id").primaryKey(),
  payload:   jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShareLink = typeof shareLinksTable.$inferSelect;

/**
 * Server-backed Locker entries.
 * Enables cross-device synchronization for authenticated TrailWeigh users.
 * One row per saved gear-list file, scoped to the Clerk user ID.
 *
 * payload contains: { store, background, bgFade, bgTone, bgSize, chartPaletteKey }
 * (everything in LockerEntry except id, name, savedAt which are top-level columns).
 */
export const lockerEntriesTable = pgTable("locker_entries", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull(),
  name:      text("name").notNull(),
  savedAt:   timestamp("saved_at", { withTimezone: true }).notNull(),
  payload:   jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LockerDbEntry = typeof lockerEntriesTable.$inferSelect;