import {
  ChannelTypes,
  OverwriteObjectTypes,
  Client,
  BaseData,
  ContentOptions,
  Guild,
  APIWebhookObject,
  APIMessage,
} from "../index";
import { Message } from "./Message";
import { Base } from "../internal/Base";
import { Routes } from "../internal/Route";
import assert from "assert";

/** Channel object */
export class Channel extends Base {
  readonly #guild_id: string;
  readonly id: string;
  readonly type: ChannelTypes;
  position?: number;
  name?: string;
  permissions?: {
    id: string;
    type: OverwriteObjectTypes;
    allow: string;
    deny: string;
  }[];
  topic?: string | null;
  parent?: string | null;

  constructor(data: BaseData, client: Client) {
    super(client);
    this.id = data.id;
    this.type = data.type;
    this.position = data.position;
    this.name = data.name;
    this.permissions = data.permission_overwrites;
    this.parent = data.parent_id;
    this.topic = data.topic;
    this.#guild_id = data.guild_id;
  }

  /**
   * Get the guild of this channel
   * @returns A guild object
   */
  get guild(): Guild | undefined {
    return this.client.guilds.get(this.#guild_id);
  }

  /**
   * Send a typing indicator to the channel
   */
  async sendTyping(): Promise<void> {
    await this.client.rest.post(Routes.ChannelTyping(this.id), {});
  }

  /**
   * Send a message to the channel
   * @param content The content of the message
   * @returns A message object
   */
  async send(content: string | ContentOptions): Promise<Message> {
    return await this.client.rest.sendChannelMessage(content, this.id);
  }

  /**
   * Get all webhooks in the channel
   * @returns An array of webhook objects
   */
  async getWebhooks(): Promise<APIWebhookObject[]> {
    const webhooks: APIWebhookObject[] = [];
    const data = await this.client.rest.get<APIWebhookObject[]>(
      Routes.ChannelWebhooks(this.id),
    );

    for (let i = 0; i < data.length; i++) {
      webhooks.push(data[i]);
    }

    return webhooks;
  }

  /**
   * Get a message from the channel by its ID.
   *
   * @param id ID of the message to get.
   * @returns A message object.
   */
  async getMessage(id: string): Promise<Message> {
    const data = await this.client.rest.get<APIMessage>(
      Routes.Message(this.id, id),
    );

    return new Message(data, this.client);
  }

  /**
   * Fetches messages from the channel
   * 
   * @param limit - The number of messages to fetch (minimum: 1, default: 50, max: 100)
   * @returns A Promise that resolves to an array of Message objects
   * @throws {AssertionError} If limit is greater than 100 or less than 1
   * 
   * @example
   * ```typescript
   * // Get the last 50 messages
   * const messages = await channel.getMessages();
   * 
   * // Get the last 10 messages
   * const messages = await channel.getMessages(10);
   * ```
   */
  async getMessages(limit = 50): Promise<Message[]> {
    assert(limit <= 100, "Limit must be less than or equal to 100");
    assert(limit >= 1, "Limit must be greater than or equal to 1");
    const messages = await this.client.rest.get<APIMessage[]>(
      `${Routes.SendChannelMessage(this.id)}?limit=${limit}`
    );

    return messages.map((m) => new Message(m, this.client));
  }

  /**
   * Update the channel
   *
   * @param data The new data of the channel
   */
  _patch(data: Channel): void {
    Object.assign(this, data);
  }
}
