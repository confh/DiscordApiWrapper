import Client, { BaseData } from "../Client";
import { PermissionsBitField } from "../PermissionCalculator";
const PermissionCalculator = require("../PermissionCalculator")
import Role from "./Role";
import User from "./User";

export default class Member {
    id: string
    user: User
    nick: string | null
    displayName: string | null
    roles: Role[] = []
    joined_at: number
    permissions: (keyof typeof PermissionsBitField)[] = []

    constructor(data: BaseData, client: Client) {
        this.joined_at = new Date(data.joined_at).getTime()
        this.id = data.user.id
        this.user = client.users.find(a => a.id === this.id) || new User(data.user)
        this.nick = data.nick
        this.displayName = this.nick || this.user.displayName
        for (let i = 0; i < data.roles.length; i++) {
            const roleObject = client.roles.find(a => a.id === data.roles[i])
            if (roleObject) {
                this.roles.push(roleObject)
            }
        }
        this._refreshRoles()
    }

    _refreshRoles() {
        for (let i = 0; i < this.roles.length; i++) {
            const permissions = PermissionCalculator(Number(this.roles[i].permissions))
            for (let i = 0; i < permissions.length; i++) {
                const permission = permissions[i];
                if (!this.permissions.find(a => a === permission)) {
                    this.permissions.push(permission)
                }
            }
        }
    }
}