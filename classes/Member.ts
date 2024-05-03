import Client, { BaseData } from "../Client";
import User from "./User";

export default class Member {
    id: string
    user: User
    nick: string | null
    displayName: string | null
    roles: string[]

    constructor(data: BaseData, client: Client) {
        this.id = data.user.id
        this.user = client.users.find(a => a.id === this.id) || new User(data.user)
        this.nick = data.nick
        this.displayName = this.nick || this.user.displayName
        this.roles = data.roles
    }
}