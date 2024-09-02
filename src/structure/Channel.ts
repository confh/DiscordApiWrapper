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
import { Routes } from "../internal/Route";

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
    await this.client.rest.post(Routes.ChannelTyping(this.id), {});
  }

  async send(content: string | ContentOptions): Promise<Message> {
    return await this.client.rest.sendChannelMessage(content, this.id);
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
