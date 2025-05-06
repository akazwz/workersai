import { Drawer, Icon, IconButton, Portal } from "@chakra-ui/react";
import { useRef } from "react";
import { RiMenu2Line } from "react-icons/ri";

import { SideBar } from "~/components/sidebar";

export function MobileDrawer() {
	const containerRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);

	return (
		<Drawer.Root placement="start">
			<Drawer.Trigger asChild hideFrom="md">
				<IconButton variant="ghost" size="xs">
					<Icon as={RiMenu2Line} />
				</IconButton>
			</Drawer.Trigger>
			<Portal>
				<Drawer.Backdrop />
				<Drawer.Positioner>
					<Drawer.Content w={64} gap={2} ref={containerRef}>
						<Drawer.Body asChild>
							<SideBar
								containerRef={containerRef as React.RefObject<HTMLDivElement>}
								closeRef={closeRef as React.RefObject<HTMLButtonElement>}
							/>
						</Drawer.Body>
					</Drawer.Content>
				</Drawer.Positioner>
			</Portal>
			<Drawer.CloseTrigger ref={closeRef} />
		</Drawer.Root>
	);
}
