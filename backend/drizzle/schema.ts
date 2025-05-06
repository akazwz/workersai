import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const conversations = sqliteTable(
	"conversations",
	{
		id: text()
			.primaryKey()
			.$default(() => crypto.randomUUID()),
		user_id: text().notNull(),
		title: text(),
		pinned: integer({ mode: "boolean" }).default(false),
		created_at: text().$default(() => new Date().toISOString()),
		updated_at: text().$default(() => new Date().toISOString()),
	},
	(table) => [
		index("conversation_user_id").on(table.user_id),
		index("conversation_pinned").on(table.pinned),
	],
);

export const messages = sqliteTable(
	"messages",
	{
		id: text()
			.primaryKey()
			.$default(() => crypto.randomUUID()),
		user_id: text().notNull(),
		conversation_id: text().notNull(),
		role: text({ enum: ["user", "assistant"] }).notNull(),
		content: text().notNull(),
		created_at: text().$default(() => new Date().toISOString()),
		updated_at: text().$default(() => new Date().toISOString()),
	},
	(table) => [
		index("message_conversation_id").on(table.conversation_id),
		index("message_user_id").on(table.user_id),
	],
);
