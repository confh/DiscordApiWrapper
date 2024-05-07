import { Client, BaseData } from "../client"
import PermissionCalculator, { PermissionsBitField } from "../PermissionCalculator"
import { User, Role, APIMember } from ".."
import { Base } from "../internal/Base"

export class Member extends Base {
    #rolesIDs: string[] = []
    readonly id: string
    nick: string | null
    readonly joined_at: number

    constructor(data: BaseData, client: Client) {
        super(client)
        this.joined_at = new Date(data.joined_at).getTime()
        this.id = data.user.id
        this.nick = data.nick
    }

    get displayName() {
        return this.nick || this.user.displayName
    }

    get roles() {
        const roles: Role[] = []
        for (let i = 0; i < this.#rolesIDs.length; i++) {
            const role = this.#rolesIDs[i];
            const roleObject = this.client.roles.find(a => a.id === role)
            if (roleObject) {
                roles.push(roleObject)
            }
        }

        return roles
    }

    get user() {
        return this.client.users.get(this.id) as User
    }

    get permissions() {
        const perms: (keyof typeof PermissionsBitField)[] = []
        for (let i = 0; i < this.roles.length; i++) {
            const permissions = PermissionCalculator(Number(this.roles[i].permissions))
            for (let i = 0; i < permissions.length; i++) {
                const permission = permissions[i];
                if (!perms.find(a => a === permission)) {
                    perms.push(permission)
                }
            }
        }

        return perms
    }

    override _patch(data: APIMember) {
        Object.defineProperty(this, "roleIDs", {
            writable: true,
            configurable: true,
        })
        this.#rolesIDs = []
        for (let i = 0; i < data.roles.length; i++) {
            const role = data.roles[i];
            this.#rolesIDs.push(role.id)
        }
    }
}