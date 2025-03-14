import {
  Channel,
  Guild,
  Collector,
  Member,
  User,
  APIMessage,
  APIMessageAttachment,
  APIWebhookMessage,
  Client,
  ComponentTypes,
  ContentOptions,
  JSONCache,
  APIMessageSnapshot,
  APIUser,
  Interaction,
  APIEmbed,
  APIMessageTypes,
} from "../index";
import { Base } from "../internal/Base";
import { Routes } from "../internal/Route";

/** Forwarded message object */
export class MessageSnapshot {
  readonly type: number;
  readonly content: string;
  readonly attachments: APIMessageAttachment[];
  readonly timestamp: number;
  readonly editedTimestamp: Date | null;

  constructor(data: APIMessageSnapshot) {
    (this.type = data.message.type),
      (this.content = data.message.content),
      (this.attachments = data.message.attachments);
    this.timestamp = new Date(data.message.timestamp).getTime();
    this.editedTimestamp = new Date(data.message.edited_timestamp);
  }
}

/** Message object */
export class Message extends Base {
  readonly #authorID?: string;
  readonly #mentionsIDs: string[] = [];
  readonly #messageSnapshots?: APIMessageSnapshot[];
  readonly id: string;
  readonly channelID: string;
  readonly content: string;
  readonly timestamp: Date;
  readonly editedTimestamp: Date | null;
  readonly mentionEveryone: boolean;
  readonly guildID: string;
  readonly pinned: boolean;
  readonly type: APIMessageTypes;
  readonly referencedMessage?: Message;
  readonly attachments: APIMessageAttachment[];
  readonly embeds: APIEmbed[];

  constructor(data: APIMessage, client: Client) {
    super(client);
    this.id = data.id;
    this.channelID = data.channel_id;
    if (!this.client.channels.get(this.channelID)) {
      this.client.channels.cache(new Channel(data.channel, client));
    }
    this.guildID = data.guild_id;
    this.#authorID = data.author ? data.author.id : null;
    this.referencedMessage = data.referenced_message
      ? new Message(data.referenced_message, client)
      : null;
    this.#messageSnapshots = data.message_snapshots
      ? data.message_snapshots
      : [];
    this.content = data.content;
    this.timestamp = new Date(data.timestamp);
    this.editedTimestamp = data.edited_timestamp
      ? new Date(data.edited_timestamp)
      : null;
    if (data.mentions) {
      for (let i = 0; i < data.mentions.length; i++) {
        this.#mentionsIDs.push(data.mentions[i].id);
      }
    }
    this.mentionEveryone = data.mention_everyone;
    this.pinned = data.pinned;
    this.type = data.type;
    this.attachments = data.attachments;
    this.embeds = data.embeds;
  }

  /**
   * Get the link of the message
   */
  get jumpLink(): string {
    return `https://discord.com/channels/${this.guildID}/${this.channelID}/${this.id}`;
  }

  /**
   * Returns if the message is forwarded
   */
  get forwarded(): boolean {
    return Boolean(this.#messageSnapshots.length);
  }

  /**
   * Returns the forwarded message if it exists
   */
  get forwardedMessage(): MessageSnapshot | null {
    return Boolean(this.#messageSnapshots.length)
      ? new MessageSnapshot(this.#messageSnapshots[0])
      : null;
  }

  /**
   * Get all the mentioned users in the message
   *
   * @returns An array of users
   */
  get mentions(): User[] {
    const users: User[] = [];
    for (let i = 0; i < this.#mentionsIDs.length; i++) {
      const userID = this.#mentionsIDs[i];
      const user = this.client.users.get(userID);
      if (user) users.push(user);
    }
    return users;
  }

  /**
   * Get the channel of the message
   *
   * @returns A channel object
   */
  get channel(): Channel | null {
    return this.client.channels.get(this.channelID) ?? null;
  }

  /**
   * Get the author of the message
   *
   * @returns A user object
   */
  get author(): User | null {
    return this.client.users.get(this.#authorID) ?? null;
  }

  /**
   * Get the member object of the author of the message
   *
   * @returns A member object
   */
  get member(): Member | null {
    return (
      this.client.guilds.get(this.guildID).members.get(this.#authorID) ?? null
    );
  }

  /**
   * Get the guild the message was sent in
   *
   * @returns A guild object
   */
  get guild(): Guild {
    return this.client.guilds.get(this.guildID) as Guild;
  }

  /**
   * Get the content of the message
   */
  toString(): string {
    return this.content;
  }

  /**
   * Create a collector for this message
   *
   * @param options Collector options
   * @returns A collector object
   */
  createComponentCollector(options?: {
    timeout?: number;
    component_type?: ComponentTypes[];
    filter?: (i: Interaction) => boolean;
  }): Collector {
    const index =
      this.client.collectors.push(new Collector(this, this.client, {
        ...options,
        component_type: options?.component_type ? options.component_type : undefined
      })) -
      1;
    return this.client.collectors[index];
  }

  /**
   * Get all the collectors associated with this message
   *
   * @returns An array of collectors
   */
  get componentCollectors(): Collector[] {
    return this.client.collectors.filter(
      (collector) => collector.messageID == this.id,
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
      this.channelID,
      this.id,
      this.guildID,
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
    return await this.client.rest.editMessage(this.id, this.channelID, content);
  }

  /**
   * Deletes this message from the channel.
   * 
   * @param options - Optional configuration for deletion
   * @param options.throwError - Whether to throw an error if deletion fails (default: true)
   * @return {Promise<void>} A promise that resolves when the message is deleted
   * @throws {Error} If throwError is true and the deletion request fails
   */
  async delete(options: { throwError?: boolean } = { throwError: true }): Promise<void> {
    if (options.throwError) {
      await this.client.rest.delete(Routes.Message(this.channelID, this.id));
    } else {
      try {
        await this.client.rest.delete(Routes.Message(this.channelID, this.id));
      } catch { }
    }
  }

  /**
   * React to a message with an emoji.
   *
   * @return {Promise<void>} - A Promise that resolves when the reaction has been successfully added.
   * @throws {Error} - If the request to react to the message fails, an Error is thrown with the error message.
   * @param emoji The emoji to react with.
   */
  async react(emoji: string): Promise<void> {
    if (emoji.startsWith("<:") && emoji.endsWith(">")) {
      const splitted = emoji.split(":");
      emoji = `${splitted[1]}:${splitted[2].replace(">", "")}`;
    }

    await this.client.rest.put<any>(
      Routes.Reaction(this.channelID, this.id, emoji),
      {},
    );
  }

  /**
   * Remove the bot's reaction from the message.
   *
   * @return {Promise<void>} - A Promise that resolves when the reaction has been successfully removed.
   * @throws {Error} - If the request to remove the reaction from the message fails, an Error is thrown with the error message.
   * @param emoji The emoji to remove its reaction.
   */
  async removeReaction(emoji: string): Promise<void> {
    if (emoji.startsWith("<:") && emoji.endsWith(">")) {
      const splitted = emoji.split(":");
      emoji = `${splitted[1]}:${splitted[2].replace(">", "")}`;
    }

    await this.client.rest.delete<any>(
      Routes.Reaction(this.channelID, this.id, emoji),
    );
  }

  /**
   * Remove a user's reaction from the message.
   *
   * @return {Promise<void>} - A Promise that resolves when the reaction has been successfully removed.
   * @throws {Error} - If the request to remove the reaction from the message fails, an Error is thrown with the error message.
   * @param emoji The emoji to remove its reaction.
   * @param userID The user ID
   */
  async deleteUserReaction(emoji: string, userID: string): Promise<void> {
    if (emoji.startsWith("<:") && emoji.endsWith(">")) {
      const splitted = emoji.split(":");
      emoji = `${splitted[1]}:${splitted[2].replace(">", "")}`;
    }

    await this.client.rest.delete<any>(
      Routes.UserReaction(this.channelID, this.id, emoji, userID),
    );
  }

  /**
   * Get all of the reactions of an emoji in the message.
   *
   * @param emoji The emoji to get the reactions of.
   * @returns An array of users.
   */
  async getReactions(emoji: string): Promise<User[]> {
    if (emoji.startsWith("<:") && emoji.endsWith(">")) {
      const splitted = emoji.split(":");
      emoji = `${splitted[1]}:${splitted[2].replace(">", "")}`;
    }

    const data = await this.client.rest.get<APIUser[]>(
      Routes.GetReaction(this.channelID, this.id, emoji),
    );

    const users: User[] = [];

    for (let i = 0; i < data.length; i++) {
      const user = data[i];
      users.push(new User(user, this.client));
    }

    return users;
  }
}

/** Webhook message object */
export class WebhookMessage extends Message {
  readonly webhookID: string;
  readonly authorData: JSONCache;

  constructor(data: APIWebhookMessage, client: Client) {
    super(data as unknown as APIMessage, client);
    this.webhookID = data.webhook_id;
    this.authorData = data.author as JSONCache;
  }
}
