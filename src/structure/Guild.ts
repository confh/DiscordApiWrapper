import { Member, Channel, Role, Client, BaseData } from "../index";
import { Base } from "../internal/Base";
import { Manager } from "../internal/Manager";
import { Routes } from "../internal/Route";

/** Guild object */
export class Guild extends Base {
  #icon?: string
  readonly #channelIDs: string[] = [];
  readonly id: string;
  readonly name: string;
  readonly ownerId: string;
  readonly memberCount: number;
  readonly joinedAt: Date;
  readonly members: Manager<Member> = new Manager<Member>();

  constructor(data: BaseData, client: Client) {
    super(client);
    this.id = data.id;
    this.name = data.name;
    this.ownerId = data.owner_id;
    this.memberCount = data.member_count;
    this.joinedAt = new Date(data.joined_at);
    this.#icon = data.icon;
    for (let i = 0; i < data.members.length; i++) {
      let member = data.members[i];
      member.guild_id = this.id;
      this.members.cache(new Member(member, client));
    }
    for (let i = 0; i < data.channels.length; i++) {
      const channel = data.channels[i];
      this.#channelIDs.push(channel.id);
    }
  }

  get iconURL(): string {
    return `https://cdn.discordapp.com/icons/${this.id}/${this.#icon}.png`;
  }

  /**
   * Get the current user's member object in this guild
   * @returns The member object
   */
  get me(): Member {
    return this.members.get(this.client.user.id);
  }

  /**
   * Get the roles in the guild
   * @returns An array of roles
   */
  get roles(): Role[] {
    return this.client.roles.array.filter(
      (a) => a.guild_id === this.id,
    ) as Role[];
  }

  /**
   * Get the channels in the guild
   * @returns An array of channels
   */
  get channels(): Channel[] {
    const channels: Channel[] = [];
    for (let i = 0; i < this.#channelIDs.length; i++) {
      const channelID = this.#channelIDs[i];
      channels.push(this.client.channels.get(channelID));
    }
    return channels;
  }

  /**
   * Leave the guild
   */
  async leave() {
    await this.client.rest.delete(Routes.GuildRoute(this.id));
  }
}
