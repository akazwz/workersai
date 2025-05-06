import type {
	Conversation as ConversationProto,
	Message as MessageProto,
} from "~/gen/chat/v1/chat_pb";

export type RemoveProtoMetadata<T> = T extends object
	? T extends Array<infer U>
		? Array<RemoveProtoMetadata<U>>
		: {
				[K in keyof T as K extends "$typeName" | "$unknown"
					? never
					: K]: RemoveProtoMetadata<T[K]>;
			}
	: T;

export type Message = RemoveProtoMetadata<MessageProto>;

export type Conversation = RemoveProtoMetadata<ConversationProto>;

/**
 * 运行时从对象中移除 protobuf 元数据字段 ($typeName, $unknown)
 */
export function stripProtoMetadata<T>(data: T): RemoveProtoMetadata<T> {
	if (data === null || data === undefined || typeof data !== "object") {
		return data as RemoveProtoMetadata<T>;
	}

	if (Array.isArray(data)) {
		return data.map(stripProtoMetadata) as RemoveProtoMetadata<T>;
	}

	const result: Record<string, unknown> = {};
	for (const key in data) {
		if (key !== "$typeName" && key !== "$unknown") {
			result[key] = stripProtoMetadata(data[key]);
		}
	}

	return result as RemoveProtoMetadata<T>;
}
