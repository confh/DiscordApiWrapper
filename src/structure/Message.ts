import {
  Channel,
  Guild,
  Collector,
  Member,
  User,
  wait,
  APIMessage,
  APIMessageAttachment,
  APIWebhookMessage,
  Client,
  ComponentTypes,
  ContentOptions,
  JSONCache,
} from "../index";
import { Base } from "../internal/Base";
import { Routes } from "../internal/Route";

export class Message extends Base {
  readonly #authorID?: string;
  readonly #mentionsIDs: string[] = [];
  readonly id: string;
  readonly channelId: string;
  readonly content: string;
  readonly timestamp: number;
  readonly edited_timestamp: number | null;
  readonly mention_everyone: boolean;
  readonly guildId: string;
  readonly pinned: boolean;
  readonly type: number;
  readonly referenced_message?: Message;
  readonly attachments: APIMessageAttachment[];

  constructor(data: APIMessage, client: Client) {
    super(client);
    this.id = data.id;
    this.channelId = data.channel_id;
    this.guildId = data.guild_id;
    if (data.author) this.#authorID = data.author.id;
    this.content = data.content;
    this.timestamp = new Date(data.timestamp).getTime();
    this.edited_timestamp = data.edited_timestamp
      ? new Date(data.edited_timestamp).getTime()
      : null;
    if (data.mentions) {
      for (let i = 0; i < data.mentions.length; i++) {
        this.#mentionsIDs.push(data.mentions[i].id);
      }
    }
    this.mention_everyone = data.mention_everyone;
    this.pinned = data.pinned;
    this.type = data.type;
    this.attachments = data.attachments;
    if (data.referenced_message) {
      this.referenced_message = new Message(data.referenced_message, client);
    }
  }

  get jumpLink(): string {
    return `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.id}`;
  }

  get mentions(): User[] {
    const users: User[] = [];
    for (let i = 0; i < this.#mentionsIDs.length; i++) {
      const userID = this.#mentionsIDs[i];
      const user = this.client.users.get(userID);
      if (user) users.push(user);
    }
    return users;
  }

  get channel(): Channel | null {
    return this.client.channels.get(this.channelId) ?? null;
  }

  get author(): User | null {
    return this.client.users.get(this.#authorID) ?? null;
  }

  get member(): Member | null {
    return (
      this.client.guilds.get(this.guildId).members.get(this.#authorID) ?? null
    );
  }

  get guild(): Guild {
    return this.client.guilds.get(this.guildId) as Guild;
  }

  createComponentCollector(options?: {
    timeout?: number;
    component_type?: ComponentTypes;
  }): Collector {
    const index =
      this.client.collectors.push(new Collector(this, this.client, options)) -
      1;
    return this.client.collectors[index];
  }

  get componentCollectors(): Collector[] {
    return this.client.collectors.filter(
      (collector) => collector.messageId == this.id,
    );
  }

  /**
   * Sends a reply message.
   *
   * @param {string | ContentOptions} content - The content of the message or options for the message.
   * @return {Promise<Message>} A promise that resolves to the sent message.
   */
  async reply(content: string | ContentOptions): Promise<Message> {
    return await this.client.rest.sendReplyChannelMessage(
      content,
      this.channelId,
      this.id,
      this.guildId,
    );
  }

  /**
   * Edits the content of a message.
   *
   * @param {string | ContentOptions} content - The new content of the message. It can be a string or an object with
   * the following properties:
   *   - content: The new content of the message.
   *   - file: An optional file to attach to the message. It can be a single file or an array of files.
   *   - embeds: An optional array of embeds to include in the message.
   *   - components: An optional array of components to include in the message.
   * @return {Promise<Message>} A promise that resolves to the edited message.
   * @throws {Error} If the message is not owned by the bot.
   */
  async edit(content: string | ContentOptions): Promise<Message> {
    if (this.author.id !== this.client.user.id)
      throw new Error(
        "This message cannot be editted as it's not owned by the bot.",
      );
    return await this.client.rest.editMessage(this.id, this.channelId, content);
  }

  /**
   * Deletes a message from the specified channel.
   *
   * @return {Promise<void>} - A Promise that resolves when the message is successfully deleted.
   * @throws {Error} - If the request to delete the message fails, an Error is thrown with the error message.
   */
  async delete(): Promise<void> {
    await this.client.rest.delete(
      Routes.MessageDelete(this.channelId, this.id),
    );
  }
}

export class WebhookMessage extends Message {
  readonly webhook_id: string;
  readonly authorData: JSONCache;

  constructor(data: APIWebhookMessage, client: Client) {
    super(data as unknown as APIMessage, client);
    this.webhook_id = data.webhook_id;
    this.authorData = data.author as JSONCache;
  }
}
