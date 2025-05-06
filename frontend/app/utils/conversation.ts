import type { Conversation } from "~/types";

// Helper function to categorize conversations
export const categorizeConversationsByDate = (
	conversations: Conversation[] | undefined,
) => {
	if (!conversations) {
		return {
			today: [],
			yesterday: [],
			previous7Days: [],
			previous30Days: [],
			older: [],
		};
	}

	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterdayStart = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() - 1,
	);
	const sevenDaysAgoStart = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() - 7,
	);
	const thirtyDaysAgoStart = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() - 30,
	);

	const categorized = {
		today: [] as Conversation[],
		yesterday: [] as Conversation[],
		previous7Days: [] as Conversation[],
		previous30Days: [] as Conversation[],
		older: [] as Conversation[],
	};

	conversations.forEach((conv) => {
		// Use updatedAt for categorization, fallback to createdAt
		const comparisonDate = new Date(conv.updatedAt || conv.createdAt);

		if (comparisonDate >= todayStart) {
			categorized.today.push(conv);
		} else if (comparisonDate >= yesterdayStart) {
			categorized.yesterday.push(conv);
		} else if (comparisonDate >= sevenDaysAgoStart) {
			categorized.previous7Days.push(conv);
		} else if (comparisonDate >= thirtyDaysAgoStart) {
			categorized.previous30Days.push(conv);
		} else {
			categorized.older.push(conv);
		}
	});

	// Sort each category by updatedAt descending (most recent first)
	Object.values(categorized).forEach((category) => {
		// Assuming updatedAt exists and is an ISO string or Date object
		category.sort(
			(a, b) =>
				new Date(b.updatedAt || b.createdAt).getTime() -
				new Date(a.updatedAt || a.createdAt).getTime(),
		);
	});

	return categorized;
};
