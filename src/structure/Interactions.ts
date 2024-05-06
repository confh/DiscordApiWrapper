import axios from "axios"
import { Client, ApplicationCommandTypes, BaseData, ContentOptions, JSONCache, JSONToFormDataWithFile, ApplicationCommandOptionTypes } from ".."
import { Guild, Channel } from ".."
import { Member } from "./Member"
import { Message } from "./Message"
import { User } from "./User"

export class Interaction {
    private channelId: string
    private userID: string
    token: string
    callbackURL: string
    interaction_id: string
    client: Client
    name: string
    id: string
    guildId: string
    description: string
    type: ApplicationCommandTypes
    acknowledged: boolean = false

    constructor(data: BaseData, client: Client) {
        this.client = client
        this.interaction_id = data.id
        this.token = data.token
        this.name = data.data.name
        this.id = data.data.id
        this.guildId = data.guild_id
        this.userID = data.member.user.id
        this.description = data.description
        this.type = data.type
        this.channelId = data.channel_id
        this.callbackURL = `${client.baseURL}interactions/${this.interaction_id}/${this.token}/callback`
    }

    get guild() {
        return this.client.guilds.find(a => a.id === this.guildId) as Guild
    }

    get channel() {
        return this.client.channels.find(a => a.id === this.channelId) as Channel
    }

    get user() {
        return this.client.users.find(a => a.id === this.userID) as User
    }

    get member() {
        return this.client.guilds.find(a => a.id === this.guildId).members.find(a => a.id === this.userID) as Member
    }

    async getOriginalMessage() {
        const data = await axios.get(`${this.client.baseURL}webhooks/${this.client.user.id}/${this.token}/messages/@original`, {
            headers: this.client.getHeaders()
        })

        if (data.status === 400) throw new Error(data.data.message)

        return new Message(data.data, this.client)
    }

    async reply(content: string | ContentOptions) {
        this.acknowledged = true
        const embeds: any = []
        const components: any[] = []
        const files = typeof content !== "string" && content.file ? Array.isArray(content.file) ? content.file : [content.file] : null

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
        let payload: JSONCache | FormData = {
            type: 4,
            data: {
                content: typeof content === "string" ? content : content.content,
                embeds,
                components,
                allowed_mentions: {
                    parse: [],
                    replied_user: true
                },
                flags: typeof content !== "string" && content.ephemeral ? 64 : 0
            }
        }

        if (files) {
            payload = JSONToFormDataWithFile(payload, ...files)
        }

        const data = await axios.post(this.callbackURL, payload, {
            headers: this.client.getHeaders(files ? "multipart/form-data" : "application/json")
        })

        if (data.status === 400) throw new Error(data.data.message, {
            cause: "Replying to interaction"
        })

        const originalMsg = await axios.get(`${this.client.baseURL}webhooks/${this.client.user.id}/${this.token}/messages/@original`, {
            headers: this.client.getHeaders(),
            validateStatus: () => true
        })

        if (originalMsg.status === 400) throw new Error(originalMsg.data.message)

        return new Message(originalMsg.data, this.client)
    }

    async defer(options?: {
        ephemeral?: boolean
    }) {
        this.acknowledged = true
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
        const embeds: any[] = []
        const files = typeof content !== "string" && content.file ? Array.isArray(content.file) ? content.file : [content.file] : null
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
        let payload: JSONCache | FormData = {
            content: typeof content === "string" ? content : content.content,
            allowed_mentions: {
                parse: [],
                replied_user: true
            },
            flags: typeof content !== "string" && content.ephemeral ? 64 : 0
        }

        if (typeof content !== "string" && content.embeds) payload.embeds = embeds
        if (typeof content !== "string" && content.components) payload.components = components

        if (files) {
            payload = JSONToFormDataWithFile(payload, ...files)
        }

        const data = await axios.patch(`${this.client.baseURL}webhooks/${this.client.user.id}/${this.token}/messages/@original`, payload, {
            headers: this.client.getHeaders(files ? "multipart/form-data" : "application/json")
        })

        if (data.status === 400) throw new Error("Bad Request in editing interaction message", {
            cause: "Editing interaction original message"
        })

        return new Message(data.data, this.client)
    }

    async followUp(content: string | ContentOptions) {
        const embeds: any[] = []
        const files = typeof content !== "string" && content.file ? Array.isArray(content.file) ? content.file : [content.file] : null
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
        let payload: JSONCache | FormData = {
            content: typeof content === "string" ? content : content.content,
            embeds,
            components,
            allowed_mentions: {
                parse: [],
                replied_user: true
            },
            flags: typeof content !== "string" && content.ephemeral ? 64 : 0
        }

        if (files) {
            payload = JSONToFormDataWithFile(payload, ...files)
        }

        const data = await axios.post(`${this.client.baseURL}webhooks/${this.client.user.id}/${this.token}`, payload, {
            headers: this.client.getHeaders(files ? "multipart/form-data" : "application/json"),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error((data.data).message, {
            cause: "Replying to interaction"
        })

        return new Message(data.data, this.client)
    }

    async delete() {
        const data = await axios.delete(`${this.client.baseURL}webhooks/${this.client.user.id}/${this.token}/messages/@original`, {
            headers: this.client.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error((data.data).message, {
            cause: "Replying to interaction"
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
        this.acknowledged = true
        await axios.post(this.callbackURL, { type: 6 }, {
            headers: this.client.getHeaders()
        }).then(async a => {
            if (a.status === 400) throw new Error(a.data.message, {
                cause: "Defering reply to interaction"
            })
        })

    }
}

export class MessageContextInteraction extends Interaction {
    target_id: string
    message: Message

    constructor(data: BaseData, client: Client) {
        super(data, client)
        this.target_id = data.data.target_id
        data.data.resolved.messages[this.target_id].guild_id = this.guildId
        this.message = new Message(data.data.resolved.messages[this.target_id], client)
    }
}

export class UserContextInteraction extends Interaction {
    target_id: string
    target: {
        user?: User,
        member?: Member
    } = {
            user: undefined,
            member: undefined
        }

    constructor(data: BaseData, client: Client) {
        super(data, client)
        this.target_id = data.data.target_id
        this.target.user = client.users.find(a => a.id === this.target_id) || new User(data.data.resolved.users[this.target_id])
        this.target.member = this.guild.members.find(a => a.id === this.target_id) || new Member(data.data.resolved.members[this.target_id], client)
    }
}