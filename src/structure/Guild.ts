import { Client, BaseData } from ".."
import { Channel } from "./Channel"
import { Member } from "./Member"

export class Guild {
    private channelIDs: string[] = []
    private client: Client
    id: string
    name: string
    ownerId: string
    memberCount: number
    joined_at: number
    members: Member[] = []

    constructor(data: BaseData, client: Client) {
        this.client = client
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
            this.channelIDs.push(channel.id)
        }
    }

    get channels() {
        const channels: Channel[] = []
        for (let i = 0; i < this.channelIDs.length; i++) {
            const channelID = this.channelIDs[i];
            channels.push(this.client.channels.find(a => a.id === channelID))
        }
        return channels
    }
}