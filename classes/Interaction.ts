import Client, { BaseData, ApplicationCommandTypes, ApplicationCommandOptionTypes, ContentOptions } from "../Client"
import Member from "./Member"
import User from "./User"
import Message from "./Message"
import axios from "axios"
import Channel from "./Channel"
import Guild from "./Guild"

async function wait(ms: number) {
    return new Promise((resolve, reject) => [
        setTimeout(() => {
            resolve(null)
        }, ms)
    ])
}

export default class Interaction {
    private current_message: Message
    token: string
    callbackURL: string
    interaction_id: string
    member: Member
    client: Client
    name: string
    user: User
    id: string
    guildId: string
    channel: Channel
    description: string
    guild: Guild
    type: ApplicationCommandTypes

    constructor(data: BaseData, client: Client) {
        this.client = client
        this.interaction_id = data.id
        this.token = data.token
        this.name = data.data.name
        this.id = data.data.id
        this.guildId = data.guild_id
        this.guild = client.guilds.find(a => a.id === this.guildId) as Guild
        this.user = client.users.find(a => a.id === data.member.user.id) as User
        this.member = client.guilds.find(a => a.id === this.guildId)?.members.find(a => a.id === this.user.id) || new Member(data.member, client)
        this.description = data.description
        this.type = data.type
        this.channel = client.channels.find(a => a.id === data.channel_id) as Channel
        this.callbackURL = `${client.baseURL}interactions/${this.interaction_id}/${this.token}/callback`
    }

    async reply(content: string | ContentOptions) {
        const embeds: any = []
        const components: any[] = []
        if (typeof content !== "string") {
            if (content.embeds && content.embeds?.length) {
                for (let i = 0; i < content.embeds.length; i++) {
                    const embed = content.embeds[i];
                    embeds.push(embed.toJson())
                }
            }

            if (content.components && content.components?.length) {
                for (let i = 0; i < content.components.length; i++) {
                    const component = content.components[i];
                    components.push(component.toJson())
                }
            }
        }

        const data = await axios.post(this.callbackURL, {
            type: 4,
            data: {
                content: typeof content === "string" ? content : content.content,
                embeds,
                components,
                flags: typeof content !== "string" && content.ephemeral ? 64 : 0
            }
        }, {
            headers: this.client.getHeaders()
        })
        if (data.status === 400) throw new Error((data.data).message, {
            cause: "Replying to interaction"
        })

        await wait(1000)

        if (this.current_message) {
            return this.current_message
        } else {
            const originalMsg = await axios.get(`${this.client.baseURL}webhooks/${this.client.user.id}/${this.token}/messages/@original`, {
                headers: this.client.getHeaders()
            })

            this.current_message = new Message(originalMsg.data, this.client)

            return this.current_message
        }
    }

    async defer(options?: {
        ephemeral?: boolean
    }) {
        await axios.post(this.callbackURL, {
            type: 5, data: {
                flags: options?.ephemeral ? 64 : 0
            }
        }, {
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

export class ButtonInteraction extends Interaction {
    message: Message
    custom_id: string

    constructor(data: BaseData, client: Client) {
        super(data, client)
        this.message = new Message(data.message, client)
        this.custom_id = data.data.custom_id
    }

    override async defer() {
        await axios.post(this.callbackURL, { type: 6 }, {
            headers: this.client.getHeaders()
        }).then(async a => {
            if (a.status === 400) throw new Error(a.data.message, {
                cause: "Defering reply to interaction"
            })
        })

    }
}

export class ContextInteraction extends Interaction {
    target_id: string
    message: Message

    constructor(data: BaseData, client: Client) {
        super(data, client)
        this.target_id = data.data.target_id
        this.message = new Message(data.data.resolved.messages[this.target_id], client)
    }
}