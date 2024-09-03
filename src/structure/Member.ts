import { PermissionsBitField } from "../PermissionCalculator";
import { User, Role, APIMember, Client, BaseData, Guild } from "../index";
import { Base } from "../internal/Base";
import { Routes } from "../internal/Route";

/** Member object */
export class Member extends Base {
  readonly #guildId: string;
  #rolesIDs: string[] = [];
  readonly id: string;
  nick: string | null;
  readonly joined_at: number;

  constructor(data: BaseData, client: Client) {
    super(client);
    this.joined_at = new Date(data.joined_at).getTime();
    this.id = data.user.id;
    this.nick = data.nick;
    this.#guildId = data.guild_id;
    this.#rolesIDs = data.roles;
  }

  /**
   * Get the guild of the member
   *
   * @returns A guild object
   */
  get guild(): Guild {
    return this.client.guilds.get(this.#guildId);
  }

  /**
   * Get the display name of the member
   *
   * @returns The display name of the member
   */
  get displayName(): string {
    return this.nick || this.user.displayName;
  }

  /**
   * Get the roles of the member
   *
   * @returns An array of roles
   */
  get roles(): Role[] {
    const roles: Role[] = [];
    for (let i = 0; i < this.#rolesIDs.length; i++) {
      const role = this.#rolesIDs[i];
      const roleObject = this.client.roles.get(role);
      if (roleObject) {
        roles.push(roleObject);
      }
    }
    return roles;
  }

  /**
   * Get the user object for the member
   *
   * @returns A user object
   */
  get user(): User {
    return this.client.users.get(this.id) as User;
  }

  /**
   * Get the permissions of the member
   *
   * @returns An array of permissions
   */
  get permissions(): (keyof typeof PermissionsBitField)[] {
    let perms: (keyof typeof PermissionsBitField)[] = [];
    if (this.id === this.guild.ownerId) {
      for (const key in PermissionsBitField) {
        perms.push(key as keyof typeof PermissionsBitField);
      }
    } else {
      for (let i = 0; i < this.roles.length; i++) {
        const permissions = this.roles[i].getPermissions();
        for (let i = 0; i < permissions.length; i++) {
          const permission = permissions[i];
          if (!perms.find((a) => a === permission)) {
            perms.push(permission as keyof typeof PermissionsBitField);
          }
        }
      }
    }

    return perms;
  }

  /**
   * Update the member
   *
   * @param data New member data
   */
  override _patch(data: APIMember): void {
    Object.defineProperty(this, "roleIDs", {
      writable: true,
      configurable: true,
    });
    this.#rolesIDs = [];
    for (let i = 0; i < data.roles.length; i++) {
      const role = data.roles[i];
      this.#rolesIDs.push(role.id);
    }
  }

  /**
   * Bans the member from the guild.
   *
   * @param [delete_message_seconds=0] Number of seconds to delete messages for.
   */
  async ban(delete_message_seconds = 0): Promise<void> {
    await this.client.rest.put(Routes.GuildBan(this.#guildId, this.id), {
      delete_message_seconds,
    });
  }

  /**
   * Kicks the member from the guild.
   *
   * @param [delete_message_seconds=0] Number of seconds to delete messages for.
   */
  async kick(): Promise<void> {
    await this.client.rest.delete(Routes.GuildBan(this.#guildId, this.id));
  }

  /**
   * Sets the nickname of the member.
   *
   * @param nickname The new nickname for the member.
   */
  async setNick(nickname: string) {
    await this.client.rest.patch(
      Routes.GuildMember(
        this.#guildId,
        this.id === this.client.user.id ? "@me" : this.id,
      ),
      {
        nick: nickname,
      },
    );
  }
}
