import { Client, Message, WebhookContentOptions } from "../index";
import { Base } from "./Base";

/**
 * Represents a webhook client.
 */
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

  /**
   * Sends a message to the webhook.
   * @param content The content of the message. Can be a string or a WebhookContentOptions object.
   * @returns A Promise that resolves with the sent message.
   */
  async send(content: string | WebhookContentOptions): Promise<Message> {
    return await this.client.rest.sendWebhookMessage(
      content,
      this.id,
      this.token,
    );
  }
}
