import {
  APIUser,
  AvatarDecoration,
  BaseData,
  Channel,
  Client,
  ContentOptions,
  Message,
} from "../index";
import { Base } from "../internal/Base";
import { Routes } from "../internal/Route";

/** User object */
export class User extends Base {
  public username: string;
  public readonly id: string;
  public discriminator: string | null;
  public readonly bot: boolean;
  public avatar: string;
  public avatarDecoration: AvatarDecoration | null;
  #dmChannelId?: string;
  #globalName: string | null;

  constructor(data: APIUser, client: Client) {
    super(client);
    this.username = data.username;
    this.id = data.id;
    this.#globalName = data.global_name;
    this.discriminator = data.discriminator;
    this.bot = data.bot;
    this.avatar = data.avatar;
    this.avatarDecoration = data.avatar_decoration_data;
  }

  /**
   * Get the display name of the user
   *
   * @returns The display name of the user if it exists, otherwise returns the username and discriminator
   */
  get displayName(): string {
    if (!this.#globalName) {
      if (this.bot) {
        return `${this.username}#${this.discriminator}`;
      } else {
        return this.username;
      }
    }

    return this.#globalName;
  }

  /**
   * Get the avatar URL of the user
   *
   * @param options Avatar URL options
   * @returns The url of the user's avatar
   */
  getAvatarURL(options?: { size?: number; animated?: boolean }): string {
    let animated = options?.animated || false;
    return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${animated ? "webp" : "png"}?size=${options?.size || 512}`;
  }

  /**
   * Get the DM channel of the user
   *
   * @returns A channel object
   */
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

  /**
   * Send the user a message
   *
   * @param content The content of the message
   * @returns A message object
   */
  async send(content: string | ContentOptions): Promise<Message> {
    const channel = await this.getDmChannel();
    return await channel.send(content);
  }

  /**
   * Update the user
   *
   * @param data The new data of the user
   */
  _patch(data: APIUser): void {
    this.username = data.username;
    this.#globalName = data.global_name;
    this.avatar = data.avatar;
    this.avatarDecoration = data.avatar_decoration_data;
  }
}
