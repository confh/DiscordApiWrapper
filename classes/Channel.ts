import axios from "axios"
import Client, { BaseData, ChannelTypes, ContentOptions } from "../Client"
import EmbedBuilder from "./EmbedBuilder"
import Message from "./Message"

export default class Channel {
    id: string
    type: ChannelTypes
    position?: number
    name?: string
    client: Client

    constructor(data: BaseData, client: Client) {
        this.id = data.id
        this.type = data.type
        this.position = data.position
        this.name = data.name
        this.client = client
    }

    async send(content: string | ContentOptions) {
        const embeds: EmbedBuilder[] = []
        if (typeof content !== "string" && content.embeds && content.embeds?.length) {
            for (let i = 0; i < content.embeds.length; i++) {
                embeds.push(content.embeds[i])
            }
        }
        const data = await axios.post(`${this.client.baseURL}/channels/${this.id}/messages`, {
            content: typeof content === "string" ? content : content.content,
            embeds
        }, { headers: this.client.getHeaders() })
        return new Message(data.data, this.client)
    }
}