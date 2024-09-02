import axios from "axios";
import { APIUser, Channel, Client, ContentOptions, Message } from "..";
import { Base } from "../internal/Base";

export class User extends Base {
  public username: string;
  public readonly id: string;
  public displayName: string | null;
  public discriminator: string | null;
  public readonly bot: boolean;
  public avatar: string;
  #dmChannelId?: string;

  constructor(data: APIUser, client: Client) {
    super(client);
    this.username = data.username;
    this.id = data.id;
    this.displayName = data.global_name || this.username;
    this.discriminator = data.discriminator;
    this.bot = data.bot;
    this.avatar = data.avatar;
  }

  getAvatarURL(options?: { size?: number; animated?: boolean }): string {
    let animated = options?.animated || false;
    return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${animated ? "webp" : "png"}?size=${options?.size || 512}`;
  }

  async getDmChannel(): Promise<Channel> {
    if (this.#dmChannelId) {
      return this.client.channels.get(this.#dmChannelId);
    } else {
      const data = await axios.post(
        `${this.client.baseURL}users/@me/channels`,
        {
          recipient_id: this.id,
        },
        {
          headers: this.client.getHeaders(),
        },
      );

      if (data.status === 400) throw new Error(data.data.message);

      this.client.channels.cache(new Channel(data.data, this.client));

      this.#dmChannelId = data.data.id;

      return this.client.channels.get(data.data.id);
    }
  }

  async send(content: string | ContentOptions): Promise<Message> {
    const channel = await this.getDmChannel();
    return await channel.send(content);
  }

  _patch(data: APIUser): void {
    this.username = data.username;
    this.displayName = data.global_name || this.username;
    this.avatar = data.avatar;
  }
}
