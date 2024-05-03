import fetch from "node-fetch"
import Client, { BaseData, ContentOptions } from "../Client"
import Member from "./Member"
import User from "./User"
import axios from "axios"
import Channel from "./Channel"

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
    channel: Channel

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
        this.channel = client.channels.find(a => a.id === this.channelId) as Channel
    }

    async reply(content: string | ContentOptions): Promise<Message> {
        const embeds: any = []
        if (typeof content !== "string" && content.embeds) {
            if (content.embeds?.length) {
                for (let i = 0; i < content.embeds.length; i++) {
                    const embed = content.embeds[i];
                    embeds.push(embed.toJson())
                }
            }
        }
        return new Promise((resolve, reject) => {
            axios.post(`${this.client.baseURL}/channels/${this.channelId}/messages`, {
                content: typeof content === "string" ? content : content.content,
                embeds,
                tts: false,
                message_reference: {
                    message_id: this.id,
                    channel_id: this.channelId,
                    guild_Id: this.guildId
                },
            }, {
                headers: this.client.getHeaders()
            }).then(async e => {
                if (e.status === 400) throw new Error(e.statusText);
                const json = e.data
                resolve(new Message(json, this.client))
            })
        })
    }

    async edit(content: string | ContentOptions): Promise<Message> {
        const embeds: any = []
        if (typeof content !== "string" && content.embeds) {
            if (content.embeds?.length) {
                for (let i = 0; i < content.embeds.length; i++) {
                    const embed = content.embeds[i];
                    embeds.push(embed.toJson())
                }
            }
        }
        if (this.author.id !== this.client.user.id) throw new Error("This message cannot be editted as it's not owned by the bot.");
        const data = await axios.patch(`${this.client.baseURL}/channels/${this.channelId}/messages/${this.id}`, {
            content: typeof content === "string" ? content : content.content,
            embeds,
        }, {
            headers: this.client.getHeaders()
        })

        if (data.status === 400) throw new Error(data.data.message);

        return data.data
    }

    async delete() {
        const data = await axios.delete(`${this.client.baseURL}/channels/${this.channelId}/messages/${this.id}`, {
            headers: this.client.getHeaders()
        })

        if (data.status === 400) throw new Error(data.data.message)
    }
}