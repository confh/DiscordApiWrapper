import axios from "axios"
import { ChannelTypes, OverwriteObjectTypes, Client, BaseData, ContentOptions, JSONCache, JSONToFormDataWithFile, PollRequestObject } from "../client"
import { Message } from "./Message"
import { Base } from "../internal/Base"

export class Channel extends Base {
    readonly #guild_id: string
    readonly id: string
    readonly type: ChannelTypes
    position?: number
    name?: string
    permissions?: {
        id: string,
        type: OverwriteObjectTypes,
        allow: string,
        deny: string
    }[]
    topic?: string | null
    parent?: string | null

    constructor(data: BaseData, client: Client) {
        super(client)
        this.id = data.id
        this.type = data.type
        this.position = data.position
        this.name = data.name
        this.permissions = data.permission_overwrites
        this.parent = data.parent_id
        this.topic = data.topic
        this.#guild_id = data.guild_id
    }

    get guild() {
        return this.client.guilds.find(a => a.id === this.#guild_id)
    }

    async sendTyping() {
        const data = await axios.post(`${this.client.baseURL}channels/${this.id}/typing`, {}, {
            headers: this.client.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) return new Error(data.data.message)
    }

    async send(content: string | ContentOptions) {
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
            content: typeof content === "string" ? content : content.content,
            embeds,
            components,
            allowed_mentions: {
                parse: [],
                replied_user: true
            }
        }

        if (typeof content !== "string" && content.poll) payload.poll = content.poll

        if (files) {
            payload = JSONToFormDataWithFile(payload, ...files)
        }

        const data = await axios.post(`${this.client.baseURL}/channels/${this.id}/messages`, payload, {
            headers: this.client.getHeaders(files ? "multipart/form-data" : "application/json"),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message)

        return new Message(data.data, this.client)
    }
}