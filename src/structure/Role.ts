import { Client } from "../client"
import PermissionCalculator, { PermissionsBitField } from "../PermissionCalculator"
import { Guild } from "./Guild"

export class Role {
    private client: Client
    id: string
    name: string
    color: number
    hoist: boolean
    icon?: string
    unicode_emoji?: string
    position: number
    permissions: string
    managed: boolean
    mentionable: boolean
    tags?: {
        bot_id?: string,
        integration_id?: string
    }
    flags: number
    guild_id: string

    constructor(options: Role, client: Client) {
        this.client = client
        Object.assign(this, options)
    }

    hasPermission(permission: keyof typeof PermissionsBitField) {
        const permissionArray: string[] = PermissionCalculator(Number(this.permissions))
        if (permissionArray.find(a => a === permission)) return true
        else return false
    }

    get guild() {
        return this.client.guilds.find(a => a.id === this.guild_id) as Guild
    }

    toJson() {
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
                integration_id: this.tags?.integration_id
            },
            flags: this.flags,
            guild_id: this.guild_id
        }
    }
}