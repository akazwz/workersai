import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export interface McpClientInitializeOptions {
	name: string;
	version: string;
	serverUrl: string;
}

export class McpClient {
	private static instance: McpClient | null = null;
	private _sdkClient: Client;
	private _isConnected: boolean = false; // Internal flag to track connection status

	private constructor(sdkClient: Client) {
		this._sdkClient = sdkClient;
	}

	public static async initialize(
		options: McpClientInitializeOptions,
	): Promise<void> {
		if (McpClient.instance) {
			console.warn(
				"McpClient already initialized. Ignoring subsequent initialize call.",
			);
			return;
		}
		if (!options || !options.serverUrl || !options.name || !options.version) {
			throw new Error(
				"McpClient initialization options (name, version, serverUrl) must be provided.",
			);
		}

		const { name, version, serverUrl } = options;

		const sdkClientInstance = new Client({ name, version });
		const transportUrl = new URL(serverUrl);
		const transport = new StreamableHTTPClientTransport(transportUrl);

		try {
			await sdkClientInstance.connect(transport);
			McpClient.instance = new McpClient(sdkClientInstance);
			McpClient.instance._isConnected = true; // Set connected status
		} catch (error) {
			console.error(
				"McpClient initialization failed (connection error):",
				error,
			);
			// Ensure instance remains null if connection fails, so getInstance throws correctly.
			McpClient.instance = null;
			throw error; // Re-throw the error for the caller to handle
		}
	}

	public static getInstance(): McpClient {
		if (!McpClient.instance) {
			throw new Error(
				"McpClient not initialized. Call McpClient.initialize(options) first.",
			);
		}
		return McpClient.instance;
	}

	// Expose the rpc interface of the underlying SDK client
	public get rpc() {
		if (!this._isConnected) {
			// Optionally, you could throw an error or return a dummy/null RPC interface
			// if strictness is required regarding connection status before RPC calls.
			console.warn(
				"Attempting to use RPC while McpClient might not be fully connected or was disconnected.",
			);
		}
		// Assuming RPC methods are directly available on the _sdkClient instance itself,
		// or that the instance is directly callable for RPC.
		return this._sdkClient;
	}

	public get isConnected(): boolean {
		return this._isConnected;
	}

	public async disconnect(): Promise<void> {
		if (!McpClient.instance) {
			return; // Not initialized or already disconnected
		}

		// Attempt to call disconnect on the SDK client if it exists
		// The MCP SDK Client might have a `disconnect()` or `close()` method.
		// Adjust if the method name is different or if it's not an async operation.
		const sdkDisconnect =
			(this._sdkClient as any).disconnect || (this._sdkClient as any).close;

		if (typeof sdkDisconnect === "function") {
			try {
				await sdkDisconnect.call(this._sdkClient);
			} catch (error) {
				console.error("Error during McpClient SDK disconnect:", error);
				// Even if SDK disconnect throws, proceed to mark our client as disconnected.
			}
		}

		this._isConnected = false;
		McpClient.instance = null; // Clear the singleton instance
	}
}
