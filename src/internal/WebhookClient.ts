import axios from "axios";
import {
  Client,
  JSONCache,
  JSONToFormDataWithFile,
  Message,
  WebhookContentOptions,
} from "..";
import { Base } from "./Base";

export class WebhookClient extends Base {
  readonly id: string;
  readonly token: string;

  constructor(
    options: {
      id: string;
      token: string;
    },
    client: Client,
  ) {
    super(client);
    Object.assign(this, options);
  }

  async send(content: string | WebhookContentOptions) {
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

    if (typeof content !== "string" && content.username)
      payload.username = content.username;

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await axios.post(
      `${this.client.baseURL}webhooks/${this.id}/${this.token}?wait=true`,
      payload,
      {
        headers: this.client.getHeaders(
          files ? "multipart/form-data" : "application/json",
        ),
        validateStatus: () => true,
      },
    );

    if (data.status === 400) {
      throw new Error(data.data.message);
    }

    return new Message(data.data, this.client);
  }
}
