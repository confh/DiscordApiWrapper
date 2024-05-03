import fetch from "node-fetch"
import Client, { BaseData } from "../Client"
import Member from "./Member"
import User from "./User"

export default class Message {
    client: Client
    id: string
    channelId: string
    author: User
    member?: Member
    content: string
    timestamp: number
    edited_timestamp: number | null
    mentions: User[] = []
    mention_everyone: boolean
    guildId: string
    pinned: boolean
    type: number

    constructor(data: BaseData, client: Client) {
        this.id = data.id
        this.client = client
        this.channelId = data.channel_id
        this.guildId = data.guild_id
        this.author = client.users.find(a => a.id === data.author.id) || new User(data.author.user)
        this.member = client.guilds.find(a => a.id === this.guildId)?.members.find(a => a.id === this.author.id)
        this.content = data.content
        this.timestamp = new Date(data.timestamp).getTime()
        this.edited_timestamp = data.edited_timestamp ? new Date(data.edited_timestamp).getTime() : null
        for (let i = 0; i < data.mentions.length; i++) {
            this.mentions.push(client.users.find(a => a.id === data.mentions[i].id) || new User(data.mentions[i]))
        }
        this.mention_everyone = data.mention_everyone
        this.pinned = data.pinned
        this.type = data.type
    }

    async reply(text: string): Promise<Message> {
        return new Promise((resolve, reject) => {
             fetch(`${this.client.baseURL}/channels/${this.channelId}/messages`, {
                method: "POST",
                headers: this.client.getHeaders(),
                body: JSON.stringify({
                    content: text,
                    tts: false,
                    message_reference: {
                        message_id: this.id,
                        channel_id: this.channelId,
                        guild_Id: this.guildId
                    },
                })
            }).then(async e => {
                if (e.status === 400) throw new Error(e.statusText);
                const json = await e.json()
                resolve(new Message(json, this.client))
            })
        })
    }
}