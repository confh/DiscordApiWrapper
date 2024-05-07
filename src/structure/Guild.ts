import { Client, BaseData } from "../client"
import { Member, Channel, Role } from ".."
import { Base } from "../internal/Base"

export class Guild extends Base {
    readonly #channelIDs: string[] = []
    readonly id: string
    readonly name: string
    readonly ownerId: string
    readonly memberCount: number
    readonly joined_at: number
    readonly members: Member[] = []

    constructor(data: BaseData, client: Client) {
        super(client)
        this.id = data.id
        this.name = data.name
        this.ownerId = data.owner_id
        this.memberCount = data.member_count
        this.joined_at = new Date(data.joined_at).getTime()
        for (let i = 0; i < data.members.length; i++) {
            const member = data.members[i];
            this.members.push(new Member(member, client))
        }
        for (let i = 0; i < data.channels.length; i++) {
            const channel = data.channels[i];
            this.#channelIDs.push(channel.id)
        }
    }

    get roles() {
        return this.client.roles.filter(a => a.guild_id === this.id) as Role[]
    }

    get channels() {
        const channels: Channel[] = []
        for (let i = 0; i < this.#channelIDs.length; i++) {
            const channelID = this.#channelIDs[i];
            channels.push(this.client.channels.find(a => a.id === channelID))
        }
        return channels
    }
}