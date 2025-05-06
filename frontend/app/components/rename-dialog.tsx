import { Button, CloseButton, Dialog, Input, Portal } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { chatClient } from "~/connect";
import { useUIStore } from "~/stores/ui";
import { updateConversationTitle } from "~/utils/query";

export function RenameDialog() {
	const { renameConversation, setRenameConversation } = useUIStore();
	const [title, setTitle] = useState(renameConversation?.title);

	const renameMutation = useMutation({
		mutationFn: async ({
			conversationId,
			title,
		}: {
			conversationId: string;
			title: string;
		}) => {
			await chatClient.renameConversation({
				conversationId: conversationId,
				title: title,
			});
		},
		onSettled(data, error, variables, context) {
			setRenameConversation(null);
			if (error) {
				console.error(error);
				return;
			}
			updateConversationTitle(variables.conversationId, variables.title);
		},
	});

	async function handleSave() {
		const conversationId = renameConversation?.id;
		if (!conversationId || !title || title === renameConversation?.title) {
			return;
		}
		renameMutation.mutate({
			conversationId: conversationId,
			title: title,
		});
	}

	return (
		<Dialog.Root
			placement="center"
			lazyMount
			open={!!renameConversation}
			onOpenChange={(e) =>
				setRenameConversation(e.open ? renameConversation : null)
			}
		>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content mx={4}>
						<Dialog.Header>
							<Dialog.Title>Rename Conversation</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body>
							<Input
								defaultValue={renameConversation?.title}
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</Dialog.Body>
						<Dialog.Footer>
							<Dialog.ActionTrigger asChild>
								<Button variant="outline">Cancel</Button>
							</Dialog.ActionTrigger>
							<Button onClick={handleSave} loading={renameMutation.isPending}>
								Save
							</Button>
						</Dialog.Footer>
						<Dialog.CloseTrigger asChild>
							<CloseButton size="sm" />
						</Dialog.CloseTrigger>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}
