import axios from "axios"
import { BaseData, Client, ApplicationCommandTypes, ApplicationCommandOptionTypes, ComponentTypes, ContentOptions, ChannelTypes, ButtonStyles, Emoji, JSONCache, OverwriteObjectTypes, PollRequestObject, FileContent } from "."
import PermissionCalculator, { PermissionsBitField } from "./PermissionCalculator"
import { PollingWatchKind } from "typescript"

function JSONToBlob(json: JSONCache) {
    return new Blob([JSON.stringify(json)], {
        type: 'application/json'
    })
}

function JSONToFormDataWithFile(json: JSONCache, ...args: FileContent[]) {
    if (!args.length) return
    const formData = new FormData()
    json.attachments = []

    formData.set("payload_json", JSONToBlob(json), "")

    for (let i = 0; i < args.length; i++) {
        const file = args[i];
        (json.attachments as any[]).push({
            id: i,
            filename: file.name
        })
        formData.set(`files[${i}]`, new Blob([file.buffer]), file.name)
    }

    return formData

}

interface choice<T> {
    name: T,
    value: T
}

export interface AuthorOptions {
    name: string,
    url?: string,
    icon_url: string,
    proxy_icon_url?: string
}

type COLLECTOR_EVENTS = "collect" | "end"

type SUPPORTED_ELEMENTS = ButtonBuilder

export interface FieldOptions {
    name: string,
    value: string,
    inline?: boolean
}

export interface FooterOptions {
    text: string,
    icon_url?: string,
    proxy_icon_url?: string
}

export interface ImageOptions {
    url: string,
    height?: number,
    width?: number
}

async function wait(ms: number) {
    return new Promise((resolve, reject) => [
        setTimeout(() => {
            resolve(null)
        }, ms)
    ])
}

export class Member {
    private rolesIDs: string[] = []
    private client: Client
    id: string
    nick: string | null
    displayName: string | null
    joined_at: number

    constructor(data: BaseData, client: Client) {
        this.client = client
        this.joined_at = new Date(data.joined_at).getTime()
        this.id = data.user.id
        this.nick = data.nick
        this.displayName = this.nick || this.user.displayName
    }

    get roles() {
        const roles: Role[] = []
        for (let i = 0; i < this.rolesIDs.length; i++) {
            const role = this.rolesIDs[i];
            const roleObject = this.client.roles.find(a => a.id === role)
            if (roleObject) {
                roles.push(roleObject)
            }
        }

        return roles
    }

    get user() {
        return this.client.users.find(a => a.id === this.id) as User
    }

    get permissions() {
        const perms: (keyof typeof PermissionsBitField)[] = []
        for (let i = 0; i < this.roles.length; i++) {
            const permissions = PermissionCalculator(Number(this.roles[i].permissions))
            for (let i = 0; i < permissions.length; i++) {
                const permission = permissions[i];
                if (!perms.find(a => a === permission)) {
                    perms.push(permission)
                }
            }
        }

        return perms
    }
}

export class User {
    public verified: boolean
    public username: string
    public mfa_enabled: boolean
    public id: string
    public displayName: string | null
    public discriminator: string | null
    public bot: boolean
    public avatar: string

    constructor(options: {
        verified: boolean,
        username: string,
        mfa_enabled: boolean,
        id: string,
        global_name: string | null,
        discriminator: string,
        bot: boolean,
        avatar: string
    }) {
        this.verified = options.verified || false
        this.username = options.username
        this.mfa_enabled = options.mfa_enabled
        this.id = options.id
        this.displayName = options.global_name || this.username
        this.discriminator = options.discriminator
        this.bot = options.bot
        this.avatar = options.avatar
    }

    getAvatarURL(options?: {
        size?: number,
        animated?: boolean
    }) {
        let animated = options?.animated || false
        return `https://cdn.discordapp.com/${this.id}/${this.avatar}.${animated ? "webp" : "png"}?size=${options?.size || 512}`
    }
}

export class SlashCommandBuilder {
    private name: string
    private description: string
    private options: {
        type: number,
        name: string,
        description: string,
        required?: boolean,
        choices?: choice<any>[]
    }[] = []
    public type: ApplicationCommandTypes = ApplicationCommandTypes.CHAT_INPUT

    private addSlashCommandOption(type: number, name: string, desc: string, required: boolean, choices?: choice<any>[]) {
        this.options.push({
            type: type,
            name,
            description: desc,
            required,
            choices
        })
    }

    /**
     * Set the name of the slash command
     * @param name Name of the command
     * @returns SlashCommandBuilder Object
     */
    setName(name: string): this {
        this.name = name
        return this
    }

    /**
     * Set to context Interaction
     * @param type Type of context
     */
    setContextInteraction(type: "USER" | "MESSAGE") {
        if (type === "USER") {
            this.type = ApplicationCommandTypes.USER
        } else {
            this.type = ApplicationCommandTypes.MESSAGE
        }
        return this
    }

    /**
     * Set the description of the slash comamnd
     * @param desc Description of the command
     * @returns SlashCommandBuilder Object
     */
    setDescription(desc: string): this {
        this.description = desc
        return this
    }

    /**
     * Add an integer option to the slash command
     * @param name Name of the option
     * @param description Description of the option
     * @param required 
     * @param choices If the option is required or not
     * @returns SlashCommandBuilder Object
     */
    addNumberOption(name: string, description: string, required = false, choices?: choice<number>[]) {
        this.addSlashCommandOption(ApplicationCommandOptionTypes.INTEGER, name, description, required, choices)
        return this
    }

    /**
     * Add a string option to the slash command
     * @param name Name of the option
     * @param description Description of the option
     * @param required If the option is required or not
     * @returns SlashCommandBuilder Object
     */
    addStringOption(name: string, description: string, required = false, choices?: choice<string>[]) {
        this.addSlashCommandOption(ApplicationCommandOptionTypes.STRING, name, description, required, choices)
        return this
    }

    /**
     * Add a boolean option to the slash command
     * @param name Name of the option
     * @param description Description of the option
     * @param required If the option is required or not
     * @returns SlashCommandBuilder Object
     */
    addBooleanOption(name: string, description: string, required = false) {
        this.addSlashCommandOption(ApplicationCommandOptionTypes.BOOLEAN, name, description, required)
        return this
    }

    /**
     * Add a user option to the slash command
     * @param name Name of the option
     * @param description Description of the option
     * @param required If the option is required or not
     * @returns SlashCommandBuilder Object
     */
    addUserOption(name: string, description: string, required = false) {
        this.addSlashCommandOption(ApplicationCommandOptionTypes.USER, name, description, required)
        return this
    }

    /**
     * Add an attachment option to the slash command
     * @param name Name of the option
     * @param description Description of the option
     * @param required If the option is required or not
     * @returns SlashCommandBuilder Object
     */
    addAttachmentOption(name: string, description: string, required = false) {
        this.addSlashCommandOption(ApplicationCommandOptionTypes.ATTACHMENT, name, description, required)
        return this
    }

    /**
     * Turn slash command into json
     * @returns JSON Data
     */
    toJson() {
        const data: any = {
            name: this.name,
            type: this.type,
        }
        if (this.type === ApplicationCommandTypes.CHAT_INPUT) {
            data.description = this.description
            data.options = this.options
        }
        return data
    }
}

export class Role {
    id: string
    name: string
    color: number
    hoist: boolean
    icon?: string
    unicode_emoji?: string
    position: number
    permissions: string
    managed: boolean
    mentionable: boolean
    tags?: {
        bot_id?: string,
        integration_id?: string
    }
    flags: number
    guild_id: string

    constructor(options: Role) {
        Object.assign(this, options)
    }

    hasPermission(permission: keyof typeof PermissionsBitField) {
        const permissionArray: string[] = PermissionCalculator(Number(this.permissions))
        if (permissionArray.find(a => a === permission)) return true
        else return false
    }

    toJson() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            hoist: this.hoist,
            icon: this.icon,
            unicode_emoji: this.unicode_emoji,
            position: this.position,
            permissions: this.permissions,
            managed: this.managed,
            mentionable: this.mentionable,
            tags: {
                bot_id: this.tags?.bot_id,
                integration_id: this.tags?.integration_id
            },
            flags: this.flags,
            guild_id: this.guild_id
        }
    }
}

export class Message {
    private client: Client
    private authorID: string
    private mentionsIDs: string[] = []
    id: string
    channelId: string
    content: string
    timestamp: number
    edited_timestamp: number | null
    mention_everyone: boolean
    guildId: string
    pinned: boolean
    type: number
    referenced_message?: Message
    attachments: {
        id: string,
        filename: string,
        size: number,
        url: string,
        proxy_url: string,
        content_type: string
    }[]

    constructor(data: BaseData, client: Client) {
        this.id = data.id
        this.client = client
        this.channelId = data.channel_id
        this.guildId = data.guild_id
        this.authorID = data.author.id
        this.content = data.content
        this.timestamp = new Date(data.timestamp).getTime()
        this.edited_timestamp = data.edited_timestamp ? new Date(data.edited_timestamp).getTime() : null
        for (let i = 0; i < data.mentions.length; i++) {
            this.mentionsIDs.push(data.mentions[i])
        }
        this.mention_everyone = data.mention_everyone
        this.pinned = data.pinned
        this.type = data.type
        this.attachments = data.attachments
        if (data.referenced_message) {
            this.referenced_message = new Message(data.referenced_message, client)
        }
    }

    get jumpLink() {
        return `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.id}`
    }

    get mentions() {
        const users: User[] = []
        for (let i = 0; i < this.mentionsIDs.length; i++) {
            const userID = this.mentionsIDs[i];
            users.push(this.client.users.find(a => a.id === userID))
        }
        return users
    }

    get channel() {
        return this.client.channels.find(a => a.id === this.channelId) as Channel
    }

    get author() {
        return this.client.users.find(a => a.id === this.authorID) as User
    }

    get member() {
        return this.client.guilds.find(a => a.id === this.guildId).members.find(a => a.id === this.authorID) as Member
    }

    get guild() {
        return this.client.guilds.find(a => a.id === this.guildId) as Guild
    }

    createComponentCollector(options?: {
        timeout?: number,
        component_type?: ComponentTypes
    }) {
        const index = this.client.collectors.push(new Collector(this, this.client, options)) - 1
        return this.client.collectors[index]
    }

    get componentCollectors() {
        const collectors: Collector[] = []
        for (let i = 0; i < this.client.collectors.length; i++) {
            const collector = this.client.collectors[i];
            if (collector.messageId === this.id) collectors.push(collector)
        }
        return collectors
    }

    async reply(content: string | ContentOptions): Promise<Message> {
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
            message_reference: {
                message_id: this.id,
                channel_id: this.channelId,
                guild_Id: this.guildId
            },
            allowed_mentions: {
                parse: [],
                replied_user: true
            }
        }

        if (files) {
            payload = JSONToFormDataWithFile(payload, ...files)
        }

        const data = await axios.post(`${this.client.baseURL}/channels/${this.channelId}/messages`, payload, {
            headers: this.client.getHeaders(files ? "multipart/form-data" : "application/json")
        })

        if (data.status === 400) throw new Error(data.data.message);
        return new Message(data.data, this.client)
    }

    async edit(content: string | ContentOptions): Promise<Message> {
        if (this.author.id !== this.client.user.id) throw new Error("This message cannot be editted as it's not owned by the bot.");
        const embeds: any[] = []
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
        }

        if (typeof content !== "string" && content.embeds) payload.embeds = embeds
        if (typeof content !== "string" && content.components) payload.components = components

        if (files) {
            payload = JSONToFormDataWithFile(payload, ...files)
        }

        const data = await axios.patch(`${this.client.baseURL}/channels/${this.channelId}/messages/${this.id}`, payload, {
            headers: this.client.getHeaders(files ? "multipart/form-data" : "application/json")
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

        if (data.status === 400) throw new Error((data.data).message, {
            cause: "Replying to interaction"
        })

        const originalMsg = await axios.get(`${this.client.baseURL}webhooks/${this.client.user.id}/${this.token}/messages/@original`, {
            headers: this.client.getHeaders()
        })

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



export class EmbedBuilder {
    private author?: AuthorOptions;
    private color?: number;
    private description?: string;
    private fields?: FieldOptions[];
    private footer?: FooterOptions;
    private image?: ImageOptions;
    private thumbnail?: ImageOptions;
    private timestamp?: Date | string;
    private title?: string;
    private url?: string;

    /**
     * Set the author of the embed
     * @param options Author Options
     * @returns EmbedBuilder Object
     */
    setAuthor(options: AuthorOptions) {
        this.author = options
        return this
    }

    setTimestamp(date?: Date) {
        this.timestamp = date || new Date()
        return this
    }

    setTitle(title: string) {
        this.title = title
        return this
    }

    setColor(color: string | number) {
        if (typeof color === "number") {
            this.color = color
        } else {
            this.color = parseInt(color.replace("#", ""), 16)
        }
        return this
    }

    setDescription(desc: string) {
        this.description = desc
        return this
    }

    setThumbnail(options: ImageOptions) {
        this.thumbnail = options
        return this
    }

    setImage(options: ImageOptions) {
        this.image = options
        return this
    }

    setFooter(options: FooterOptions) {
        this.footer = options
        return this
    }

    setFields(fields: FieldOptions[]) {
        this.fields = fields
        return this
    }

    setURL(url: string) {
        this.url = url
        return this
    }

    toJson() {
        return {
            author: this.author,
            color: this.color,
            description: this.description,
            fields: this.fields,
            footer: this.footer,
            image: this.image,
            thumbnail: this.thumbnail,
            timestamp: this.timestamp,
            title: this.title,
            url: this.url
        }
    }
}

export class Collector {
    private timer: Timer
    private client: Client
    private listeners: {
        event: COLLECTOR_EVENTS,
        callback: (...args) => any
    }[] = []
    public type: ComponentTypes
    public messageId: string
    public timeout?: number

    constructor(message: Message, client: Client, options?: {
        timeout?: number,
        component_type?: ComponentTypes
    }) {
        this.messageId = message.id
        this.client = client
        this.type = options?.component_type || ComponentTypes.BUTTON
        if (options?.timeout) {
            this.timeout = options?.timeout
            this.timer = setTimeout(() => {
                this.end()
            }, options.timeout);
        }
    }

    on(event: COLLECTOR_EVENTS, callback: (...args) => any) {
        this.listeners.push({
            event,
            callback
        })
    }

    end() {
        const endListener = this.listeners.find(a => a.event === "end")
        if (endListener) endListener.callback();
        for (let i = 0; i < this.client.collectors.length; i++) {
            const collector = this.client.collectors[i];
            if (collector.messageId === this.messageId) {
                this.client.collectors.splice(i, 1)
                break
            }
        }
    }

    resetTimer() {
        if (this.timeout) {
            clearTimeout(this.timer)
            this.timer = setTimeout(() => {
                this.end()
            }, this.timeout);
        } else {
            console.warn("This collector does not have a timer.")
        }
    }

    off(event: COLLECTOR_EVENTS) {
        for (let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i];
            if (listener.event === event) {
                this.listeners.splice(i, 1)
                break
            }
        }
    }

    emit(event: COLLECTOR_EVENTS, type: ComponentTypes, ...args) {
        if (type !== this.type) return;
        for (let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i];
            if (listener.event === event) {
                listener.callback(...args)
                break
            }
        }
    }
}

export class Channel {
    id: string
    type: ChannelTypes
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
    client: Client

    constructor(data: BaseData, client: Client) {
        this.id = data.id
        this.type = data.type
        this.position = data.position
        this.name = data.name
        this.permissions = data.permission_overwrites
        this.client = client
        this.parent = data.parent_id
        this.topic = data.topic
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

    async sendPoll(pollData: PollRequestObject) {
        const data = await axios.post(`${this.client.baseURL}/channels/${this.id}/messages`, {
            poll: pollData
        }, {
            headers: this.client.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message);

        return new Message(data.data, this.client)
    }
}

export class ActionRowBuilder {
    public components!: Array<SUPPORTED_ELEMENTS>;

    setComponents(...args: Array<SUPPORTED_ELEMENTS>) {
        this.components = args
        return this
    }

    setComponentsArray(components: Array<SUPPORTED_ELEMENTS>) {
        this.components = components
        return this
    }

    toJson() {
        const JSONArray: any[] = []
        for (let i = 0; i < this.components.length; i++) {
            const component = this.components[i];
            JSONArray.push(component.toJson())
        }

        return {
            type: 1,
            components: JSONArray
        }
    }
}

export class ButtonBuilder {
    private label!: string;
    private style: number = ButtonStyles.PRIMARY;
    private custom_id!: string;
    private disabled = false
    private emoji?: Partial<Emoji>
    private url!: string

    setUrl(url: string) {
        this.url = url
        return this
    }

    setLabel(label: string) {
        this.label = label
        return this
    }

    setStyle(style: number) {
        this.style = style
        return this
    }

    setCustomid(id: string) {
        this.custom_id = id
        return this
    }

    setDisabled(disabled: boolean) {
        this.disabled = disabled
        return this
    }

    setEmoji(emoji: string) {
        if (emoji.includes("<")) {
            const name = emoji.split(":")[1]
            const id = emoji.split(":")[2].replace(">", "")
            this.emoji = {
                name,
                id
            }
        } else {
            this.emoji = {
                name: emoji
            }
        }

        return this
    }

    toJson() {
        return {
            type: 2,
            label: this.label,
            style: this.style,
            custom_id: this.custom_id,
            disabled: this.disabled,
            emoji: this.emoji,
            url: this.url
        }
    }
}