import Client, { BaseData } from "../Client"
import Channel from "./Channel"
import Member from "./Member"

export default class Guild {
    id: string
    name: string
    ownerId: string
    memberCount: number
    joined_at: number
    members: Member[] = []
    channels: Channel[] = []

    constructor(data: BaseData, client: Client) {
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
            this.channels.push(client.channels.find(a => a.id === channel.id) as Channel)
        }
    }
}