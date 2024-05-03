import fetch from "node-fetch"
import Client, { BaseData, ApplicationCommandTypes, ApplicationCommandOptionTypes } from "../Client"
import Member from "./Member"
import User from "./User"

export default class Interaction {
    private token: string
    private callbackURL: string
    private client: Client
    member: Member
    user: User
    id: string
    guildId: string
    description: string
    type: ApplicationCommandTypes

    constructor(data: BaseData, client: Client) {
        this.client = client
        this.id = data.id
        this.token = data.token
        this.guildId = data.guild_id
        this.user = client.users.find(a => a.id === data.member.id) || new User(data.member.user)
        this.member = client.guilds.find(a => a.id === this.guildId)?.members.find(a => a.id === this.user.id) || new Member(data.member, client)
        this.description = data.description
        this.type = data.type
        this.callbackURL = `${client.baseURL}interactions/${this.id}/${this.token}/callback`
    }

    async reply(text: string) {
        await fetch(this.callbackURL, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${this.client.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type: 4,
                data: {
                    content: text
                }
            })
        })
            .then(async a => {
                try {
                    const json = await a.json()
                    if (json.code === 10062) throw new Error("Unknown interaction");
                } catch { }
            })
            .catch(console.error)
    }

    defer() {
        fetch(this.callbackURL, {
            method: "POST",
            headers: this.client.getHeaders(),
            body: JSON.stringify({
                type: 5,
            })
        })
            .then(async a => {
                try {
                    const json = await a.json()
                    if (json.code === 10062) throw new Error("Unknown interaction");
                } catch { }
            })
            .catch(console.error)
    }

    edit(text: string) {
        fetch(`${this.client.baseURL}/webhooks/${this.client.user.id}/${this.token}/messages/@original`, {
            method: "PATCH",
            headers: this.client.getHeaders(),
            body: JSON.stringify({
                content: text
            })
        }).then(async a => {
            try {
                const json = await a.json()
                if (json.code === 10015) throw new Error(json.message);
                
            } catch {}
            console.log(await a.json())
            if (a.status === 400) throw new Error("Bad Request in editing interaction message");
        })
            .catch(console.error)
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