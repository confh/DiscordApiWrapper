import fetch from "node-fetch"
import Client, { BaseData, ApplicationCommandTypes, ApplicationCommandOptionTypes, ContentOptions } from "../Client"
import Member from "./Member"
import User from "./User"
import Message from "./Message"
import axios from "axios"
import Channel from "./Channel"

export default class Interaction {
    private token: string
    private callbackURL: string
    private client: Client
    private interaction_id: string
    member: Member
    name: string
    user: User
    id: string
    guildId: string
    channel: Channel
    description: string
    type: ApplicationCommandTypes

    constructor(data: BaseData, client: Client) {
        this.client = client
        this.interaction_id = data.id
        this.token = data.token
        this.name = data.data.name
        this.id = data.data.id
        this.guildId = data.guild_id
        this.user = client.users.find(a => a.id === data.member.id) || new User(data.member.user)
        this.member = client.guilds.find(a => a.id === this.guildId)?.members.find(a => a.id === this.user.id) || new Member(data.member, client)
        this.description = data.description
        this.type = data.type
        this.channel = client.channels.find(a => a.id === data.channel_id) as Channel
        this.callbackURL = `${client.baseURL}interactions/${this.interaction_id}/${this.token}/callback`
    }

    async reply(content: string | ContentOptions) {
        const embeds: any = []
        if (typeof content !== "string" && content.embeds) {
            if (content.embeds?.length) {
                for (let i = 0; i < content.embeds.length; i++) {
                    const embed = content.embeds[i];
                    embeds.push(embed.toJson())
                }
            }
        }
        const data = await axios.post(this.callbackURL, {
            type: 4,
            data: {
                content: typeof content === "string" ? content : content.content,
                embeds,
                flags: typeof content !== "string" && content.ephemeral ? 64 : 0
            }
        }, {
            headers: this.client.getHeaders()
        })
        if (data.status === 400) throw new Error((data.data).message, {
            cause: "Replying to interaction"
        })

        const originalMsg = await axios.get(`${this.client.baseURL}/webhooks/${this.client.user.id}/${this.token}/messages/@original`, {
            headers: this.client.getHeaders()
        })


        return new Message(originalMsg.data, this.client)
    }

    async defer() {
        await axios.post(this.callbackURL, { type: 5 }, {
            headers: this.client.getHeaders()
        }).then(async a => {
            if (a.status === 400) throw new Error(a.data.message, {
                cause: "Defering reply to interaction"
            })
        })

    }

    async edit(content: string | ContentOptions) {
        const embeds: any = []
        if (typeof content !== "string" && content.embeds) {
            if (content.embeds?.length) {
                for (let i = 0; i < content.embeds.length; i++) {
                    const embed = content.embeds[i];
                    embeds.push(embed.toJson())
                }
            }
        }
        await axios.patch(`${this.client.baseURL}/webhooks/${this.client.user.id}/${this.token}/messages/@original`, {
            content: typeof content === "string" ? content : content.content,
            embeds,
        }, {
            headers: this.client.getHeaders()
        }).then(async a => {
            if (a.status === 400) throw new Error("Bad Request in editing interaction message", {
                cause: "Editing interaction original message"
            })
        })
    }
}

export class SlashCommandInteraction extends Interaction {
    options: {
        value: string,
        type: ApplicationCommandOptionTypes,
        name: string
    }[]
    resolved?: any

    constructor(data: BaseData, client: Client) {
        super(data, client)
        this.options = data.data.options
        this.resolved = data.data.resolved
    }

    getString(name: string) {
        return this.options.find(a => a.type === ApplicationCommandOptionTypes.STRING && a.name === name)
    }

    getAttachment(name: string) {
        const attachmentId = this.options.find(a => a.type === ApplicationCommandOptionTypes.ATTACHMENT && a.name === name)
        if (!attachmentId) return undefined
        return this.resolved.attachments[attachmentId.value] as {
            width: number,
            url: string,
            size: number,
            proxy_url: string,
            placeholder_version: number,
            placeholder: string,
            id: string,
            height: number,
            filename: string,
            ephemeral: boolean,
            content_type: string
        }
    }
}