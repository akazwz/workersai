import {
	Button,
	Center,
	Icon,
	Input,
	InputGroup,
	Menu,
	Portal,
	Spinner,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RiArrowDropRightLine, RiSearchLine } from "react-icons/ri";

import { chatClient } from "~/connect";
import { useChatStore } from "~/stores/chat";

export function ModelsMenu() {
	const { model, setModel } = useChatStore();

	function formatModelName(model: string) {
		return model.split("/").length > 1
			? model.split("/")[model.split("/").length - 1]
			: model;
	}

	const [search, setSearch] = useState("");
	const { data: models, isLoading: isLoadingModels } = useQuery({
		queryKey: ["models"],
		queryFn: () => chatClient.listModels({}),
	});

	const filteredModels = models?.models.filter((model) =>
		model.name.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<Menu.Root size="sm">
			<Menu.Trigger asChild>
				<Button variant="ghost" size="xs">
					<Text>{formatModelName(model)}</Text>
					<Icon as={RiArrowDropRightLine} size="md" flexShrink={0} />
				</Button>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content h={96} as={VStack} w={72}>
						<InputGroup startElement={<Icon as={RiSearchLine} />}>
							<Input
								placeholder="Search models"
								flexShrink={0}
								value={search}
								size="xs"
								onChange={(e) => setSearch(e.target.value)}
							/>
						</InputGroup>
						{isLoadingModels ? (
							<Center h="full" flex={1}>
								<Spinner />
							</Center>
						) : (
							<VStack overflowY="auto" h="full" w="full" flex={1}>
								{filteredModels?.map((model) => (
									<Menu.Item
										key={model.id}
										value={model.id}
										onClick={() => setModel(model.name)}
									>
										{formatModelName(model.name)}
									</Menu.Item>
								))}
							</VStack>
						)}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
}
