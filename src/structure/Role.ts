import { Client } from "../client";
import { Base } from "../internal/Base";
import PermissionCalculator, {
  PermissionsBitField,
} from "../PermissionCalculator";
import { Guild } from "./Guild";

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

  getPermissions() {
    return PermissionCalculator(Number(this.permissions));
  }

  hasPermission(permission: keyof typeof PermissionsBitField) {
    const permissionArray = this.getPermissions();
    if (permissionArray.find((a) => a === permission)) return true;
    else return false;
  }

  get guild() {
    return this.client.guilds.get(this.guild_id) as Guild;
  }

  _patch(data: Role): void {
    Object.assign(this, data);
  }

  override toJson() {
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
