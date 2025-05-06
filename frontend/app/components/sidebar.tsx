import {
	Button,
	Center,
	HStack,
	Icon,
	Input,
	InputGroup,
	Spinner,
	VStack,
	Text,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
	RiBook2Line,
	RiPushpinLine,
	RiSearchLine,
	RiSettingsLine,
} from "react-icons/ri";

import { chatClient } from "~/connect";
import { stripProtoMetadata } from "~/types";
import { categorizeConversationsByDate } from "~/utils/conversation";
import { ConversationItem } from "~/components/conversation-item";
import { handleNewChat } from "~/routes/chat";

export function SideBar({
	containerRef,
	closeRef,
}: {
	containerRef?: React.RefObject<HTMLDivElement>;
	closeRef?: React.RefObject<HTMLButtonElement>;
}) {
	const location = useLocation();

	function doWithCloseMenu(fn: () => void) {
		fn();
		closeRef?.current?.click();
	}

	const { data: conversations, isLoading: isLoadingConversations } = useQuery({
		queryKey: ["conversations"],
		queryFn: async () => {
			const response = await chatClient.listConversations({});
			return stripProtoMetadata(response.conversations);
		},
	});

	const pinnedConversations = conversations?.filter(
		(conversation) => conversation.pinned,
	);
	const normalConversations = conversations?.filter(
		(conversation) => !conversation.pinned,
	);

	const categorizedNormalConversations =
		categorizeConversationsByDate(normalConversations);

	const categories = [
		{ label: "Today", data: categorizedNormalConversations.today },
		{ label: "Yesterday", data: categorizedNormalConversations.yesterday },
		{
			label: "Previous 7 days",
			data: categorizedNormalConversations.previous7Days,
		},
		{
			label: "Previous 30 days",
			data: categorizedNormalConversations.previous30Days,
		},
		{ label: "Older", data: categorizedNormalConversations.older },
	];

	return (
		<VStack h="dvh" w={64} gap={0} flexShrink={0} borderRightWidth={1}>
			<VStack w="full" p={2}>
				<Button
					w="full"
					size="sm"
					onClick={() => doWithCloseMenu(handleNewChat)}
				>
					New Chat
				</Button>
				<InputGroup startElement={<Icon as={RiSearchLine} />}>
					<Input placeholder="Search" size="sm" />
				</InputGroup>
			</VStack>
			{isLoadingConversations && (
				<Center flex={1}>
					<Spinner size="sm" />
				</Center>
			)}
			<VStack
				w="full"
				flex={1}
				overflowY="auto"
				hidden={isLoadingConversations}
			>
				<VStack w="full" p={2} gap={0}>
					<HStack
						w="full"
						justifyContent="flex-start"
						mb={1}
						gap={1}
						px={1}
						color="fg.info"
						hidden={pinnedConversations?.length === 0}
					>
						<Icon as={RiPushpinLine} />
						<Text fontSize="xs" fontWeight="bolder">
							Pinned
						</Text>
					</HStack>
					{pinnedConversations?.map((conversation) => (
						<ConversationItem
							key={conversation.id}
							closeRef={closeRef}
							containerRef={containerRef}
							conversation={conversation}
						/>
					))}
					{categories.map(
						(category) =>
							category.data.length > 0 && (
								<VStack key={category.label} w="full" align="stretch" gap={0}>
									<Text
										fontSize="xs"
										fontWeight="bolder"
										color="fg.info"
										my={1}
										px={1}
									>
										{category.label}
									</Text>
									{category.data.map((conversation) => (
										<ConversationItem
											key={conversation.id}
											conversation={conversation}
											containerRef={containerRef}
											closeRef={closeRef}
										/>
									))}
								</VStack>
							),
					)}
				</VStack>
			</VStack>
		</VStack>
	);
}
