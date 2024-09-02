import axios from "axios";
import {
  ChannelTypes,
  OverwriteObjectTypes,
  Client,
  BaseData,
  ContentOptions,
  JSONCache,
  JSONToFormDataWithFile,
  PollRequestObject,
  APIWebhookObject,
  wait,
} from "../client";
import { Message } from "./Message";
import { Base } from "../internal/Base";

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

  get guild() {
    return this.client.guilds.get(this.#guild_id);
  }

  async sendTyping() {
    const data = await axios.post(
      `${this.client.baseURL}channels/${this.id}/typing`,
      {},
      {
        headers: this.client.getHeaders(),
        validateStatus: () => true,
      },
    );

    if (data.status === 400) return new Error(data.data.message);
  }

  async send(content: string | ContentOptions): Promise<Message> {
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
      allowed_mentions: {
        parse: [],
        replied_user: true,
      },
    };

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await axios.post(
      `${this.client.baseURL}/channels/${this.id}/messages`,
      payload,
      {
        headers: this.client.getHeaders(
          files ? "multipart/form-data" : "application/json",
        ),
        validateStatus: () => true,
      },
    );

    if (data.status === 400) {
      if (data.data.retry_after !== null) {
        await wait(data.data.retry_after * 1000);
        return await this.send(content);
      } else {
        throw new Error(data.data.message);
      }
    }

    return new Message(data.data, this.client);
  }

  async getWebhooks(): Promise<APIWebhookObject[]> {
    if (!this.guild.me.permissions.includes("MANAGE_WEBHOOKS"))
      throw new Error("Missing access");
    const webhooks: APIWebhookObject[] = [];
    const data = await axios.get(
      `${this.client.baseURL}channels/${this.id}/webhooks`,
      {
        headers: this.client.getHeaders(),
        validateStatus: () => true,
      },
    );

    if (data.status === 400) {
      if (data.data.retry_after !== null) {
        await wait(data.data.retry_after * 1000);
        return await this.getWebhooks();
      } else {
        throw new Error(data.data.message);
      }
    }

    for (let i = 0; i < data.data.length; i++) {
      webhooks.push(data.data[i]);
    }

    return webhooks;
  }
}
