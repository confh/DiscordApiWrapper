import { PermissionsBitField } from "../PermissionCalculator"
const PermissionCalculator = require("../PermissionCalculator")

export default class Role {
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

    constructor(options: Role) {
        Object.assign(this, options)
    }

    _update(options: Role) {
        Object.assign(this, options)
    }

    hasPermission(permission: keyof typeof PermissionsBitField) {
        const permissionArray = PermissionCalculator(Number(this.permissions))
        if (permissionArray.find(a => a === permission)) return true
        else return false
    }
}