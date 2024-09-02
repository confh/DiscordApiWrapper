import axios from "axios";
import {
  Client,
  ComponentTypes,
  ContentOptions,
  JSONCache,
  JSONToFormDataWithFile,
} from "../client";
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
} from "..";
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

  get jumpLink() {
    return `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.id}`;
  }

  get mentions() {
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

  get guild() {
    return this.client.guilds.get(this.guildId) as Guild;
  }

  createComponentCollector(options?: {
    timeout?: number;
    component_type?: ComponentTypes;
  }) {
    const index =
      this.client.collectors.push(new Collector(this, this.client, options)) -
      1;
    return this.client.collectors[index];
  }

  get componentCollectors() {
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
    const embeds: any = [];
    const components: any[] = [];
    const files =
      typeof content !== "string" && content.file
        ? Array.isArray(content.file)
          ? content.file
          : [content.file]
        : null;

    if (typeof content !== "string") {
      if (content.embeds && content.embeds?.length) {
        for (let i = 0; i < content.embeds.length; i++) {
          const embed = content.embeds[i];
          embeds.push(embed.toJson());
        }
      }

      if (content.components && content.components?.length) {
        for (let i = 0; i < content.components.length; i++) {
          const component = content.components[i];
          components.push(component.toJson());
        }
      }
    }

    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
      embeds,
      components,
      message_reference: {
        message_id: this.id,
        channel_id: this.channelId,
        guild_Id: this.guildId,
      },
      allowed_mentions: {
        parse: [],
        replied_user: true,
      },
    };

    if (files && files.length) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await axios.post(
      `${this.client.baseURL}channels/${this.channelId}/messages`,
      payload,
      {
        headers: this.client.getHeaders(
          files && files.length ? "multipart/form-data" : "application/json",
        ),
        validateStatus: () => true,
      },
    );

    if (data.status === 400 || data.status === 404) {
      if (data.data.retry_after !== null) {
        await wait(data.data.retry_after * 1000);
        return await this.reply(content);
      } else {
        throw new Error(data.data.message);
      }
    }
    return new Message(data.data, this.client);
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
    const embeds: any[] = [];
    const components: any[] = [];
    const files =
      typeof content !== "string" && content.file
        ? Array.isArray(content.file)
          ? content.file
          : [content.file]
        : null;

    if (typeof content !== "string") {
      if (content.embeds && content.embeds?.length) {
        for (let i = 0; i < content.embeds.length; i++) {
          const embed = content.embeds[i];
          embeds.push(embed.toJson());
        }
      }

      if (content.components && content.components?.length) {
        for (let i = 0; i < content.components.length; i++) {
          const component = content.components[i];
          components.push(component.toJson());
        }
      }
    }

    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
    };

    if (typeof content !== "string" && content.embeds) payload.embeds = embeds;
    if (typeof content !== "string" && content.components)
      payload.components = components;

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await axios.patch(
      `${this.client.baseURL}/channels/${this.channelId}/messages/${this.id}`,
      payload,
      {
        headers: this.client.getHeaders(
          files ? "multipart/form-data" : "application/json",
        ),
      },
    );

    if (data.status === 400) {
      if (data.data.retry_after !== null) {
        await wait(data.data.retry_after * 1000);
        return await this.edit(content);
      } else {
        throw new Error(data.data.message);
      }
    }

    return data.data;
  }

  /**
   * Deletes a message from the specified channel.
   *
   * @return {Promise<void>} - A Promise that resolves when the message is successfully deleted.
   * @throws {Error} - If the request to delete the message fails, an Error is thrown with the error message.
   */
  async delete() {
    await this.client.rest.delete(
      Routes.MessageDelete(this.channelId, this.id),
    );
    const data = await axios.delete(
      `${this.client.baseURL}/channels/${this.channelId}/messages/${this.id}`,
      {
        headers: this.client.getHeaders(),
      },
    );

    if (data.status === 400) throw new Error(data.data.message);
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
