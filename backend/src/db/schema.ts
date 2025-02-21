import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// export const NotesTable = pgTable("notes", {
//   id: integer().primaryKey().generatedAlwaysAsIdentity(),
//   title: varchar({ length: 255 }).notNull(),
//   content: varchar({ length: 255 }).notNull(),
//   dateCreated: timestamp({ mode: "date" }).notNull(),
//   dateModified: timestamp({ mode: "date" }).notNull(),
// });
