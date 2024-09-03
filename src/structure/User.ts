import {
  APIUser,
  BaseData,
  Channel,
  Client,
  ContentOptions,
  Message,
} from "../index";
import { Base } from "../internal/Base";
import { Routes } from "../internal/Route";

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
      const request = await this.client.rest.post<BaseData>(
        Routes.DMChannel(),
        {
          recipient_id: this.id,
        },
        false,
      );

      this.client.channels.cache(new Channel(request, this.client));

      this.#dmChannelId = request.id;

      return this.client.channels.get(request.id);
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
