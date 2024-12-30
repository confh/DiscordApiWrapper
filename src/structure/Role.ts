import { Client } from "../client";
import { Base } from "../internal/Base";
import PermissionCalculator, {
  PermissionsBitField,
} from "../PermissionCalculator";
import { Guild } from "./Guild";

/** Role object */
export class Role extends Base {
  readonly id: string;
  name: string;
  color: number;
  hoist: boolean;
  icon?: string;
  unicode_emoji?: string;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
  tags?: {
    bot_id?: string;
    integration_id?: string;
  };
  flags: number;
  readonly guild_id: string;

  constructor(options: Role, client: Client) {
    super(client);
    Object.assign(this, options);
  }

  /**
   * Get the guild of the role
   *
   * @returns A guild object
   */
  get guild(): Guild {
    return this.client.guilds.get(this.guild_id) as Guild;
  }

  /**
   * Get the permissions of the role
   *
   * @returns An array of permissions
   */
  getPermissions(): (keyof typeof PermissionsBitField)[] {
    return PermissionCalculator(Number(this.permissions));
  }

  /**
   * Check if the role has a specific permission
   *
   * @param permission The permission name
   * @returns Whether the role has this permission or not
   */
  hasPermission(permission: keyof typeof PermissionsBitField): boolean {
    const permissionArray = this.getPermissions();
    if (permissionArray.find((a) => a === permission)) return true;
    else return false;
  }

  /**
   * Update the role
   *
   * @param data The new data of the role
   */
  _patch(data: Role): void {
    Object.assign(this, data);
  }

  override toJson(): {
    id: string;
    name: string;
    color: number;
    hoist: boolean;
    icon: string;
    unicode_emoji: string;
    position: number;
    permissions: string;
    managed: boolean;
    mentionable: boolean;
    tags: {
      bot_id: string;
      integration_id: string;
    };
    flags: number;
    guild_id: string;
  } {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      hoist: this.hoist,
      icon: this.icon,
      unicode_emoji: this.unicode_emoji,
      position: this.position,
      permissions: this.permissions,
      managed: this.managed,
      mentionable: this.mentionable,
      tags: {
        bot_id: this.tags?.bot_id,
        integration_id: this.tags?.integration_id,
      },
      flags: this.flags,
      guild_id: this.guild_id,
    };
  }
}
