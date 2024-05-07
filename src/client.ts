import axios from 'axios';
import WebSocket from 'ws';
import { User } from './structure/User';
import { SlashCommandBuilder } from './structure/SlashCommandBuilder';
import { EmbedBuilder, ActionRowBuilder } from './structure/Builders';
import { Channel } from './structure/Channel';
import { Collector } from './structure/Collector';
import { Guild } from './structure/Guild';
import { Interaction, SlashCommandInteraction, UserContextInteraction, MessageContextInteraction, ButtonInteraction } from './structure/Interactions';
import { Message } from './structure/Message';
import { Role } from './structure/Role';
let interval: number | Timer = 0;

// Type of presence status
type PRESENCES = "online" | "dnd" | "invisible" | "idle"

export async function wait(ms: number) {
    return new Promise(res => {
        setTimeout(() => {
            res(null)
        }, ms);
    })
}

/**
 * Convert JSON to a Blob
 * @param json Type of {@link JSONCache}
 * @returns Blob from JSON
 */
export function JSONToBlob(json: JSONCache) {
    return new Blob([JSON.stringify(json)], {
        type: 'application/json'
    })
}

/**
 * Convert JSON to {@link FormData}
 * @param json Type of {@link JSONCache}
 * @param files Array of {@link FileContent}
 * @returns FormData containing file content
 */
export function JSONToFormDataWithFile(json: JSONCache, ...files: FileContent[]) {
    if (!files.length) return json
    const formData = new FormData()
    json.attachments = []

    formData.set("payload_json", JSONToBlob(json), "")

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        (json.attachments as any[]).push({
            id: i,
            filename: file.name
        })
        formData.set(`files[${i}]`, new Blob([file.buffer]), file.name)
    }

    return formData

}

// TYPES OF API OBJECTS start
interface APIGuildMemberUpdate {
    guild_id: string,
    roles: string[],
    user: APIUser,
    nick?: string | null,
    avatar: string | null,
    joined_at: string,

}

interface APIUser {
    id: string,
    username: string,
    discriminator: string,
    global_name: string | null,
    avatar: string | null,
    bot?: boolean,
    system?: boolean,

}

interface APIRole {
    id: string,
    name: string,
    color: number,
    hoist: boolean,
    icon?: string | null,
    unicode_emoji?: string | null,
    position: number,
    permissions: string[],
    managed: boolean,
    mentionable: boolean,
    flags: number
}
// TYPES OF API OBJECTS end

export interface ClientEvents {
    ready: [],
    messageCreate: [message: Message],
    messageUpdate: [message: Message]
    guildCreate: [guild: Guild],
    guildDelete: [guild: Guild],
    interactionCreate: [interaction: Interaction],
    resume: [],
    roleUpdate: [oldRole: Role, newRole: Role, guild: Guild],
    channelCreate: [channel: Channel],
    channelDelete: [channel: Channel]
}

export interface Emoji {
    id: string
    name: string
    roles?: string[]
    user?: User
    require_colons?: boolean
    managed?: boolean
    animated?: boolean
    available?: boolean
}

export type PartialEmoji = Omit<Emoji, "available" | "animated" | "managed" | "require_colons" | "user" | "roles">

export interface BaseData {
    id: string;
    [key: string]: any;
}

export enum ApplicationCommandTypes {
    CHAT_INPUT = 1,
    USER,
    MESSAGE
}

export enum InteractionTypes {
    PING = 1,
    APPLICATION_COMMAND,
    MESSAGE_COMPONENT
}

export enum ComponentTypes {
    ACTION_ROW = 1,
    BUTTON,
    STRING_SELECT,
    TEXT_INPUT
}

export enum ButtonStyles {
    PRIMARY = 1,
    SECONDARY,
    SUCCESS,
    DANGER,
    LINK
}

export enum ActivityTypes {
    GAME,
    STREAMING,
    LISTENING,
    WATCHING,
    CUSTOM,
    COMPETING
}

export enum ApplicationCommandOptionTypes {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP,
    STRING,
    INTEGER,
    BOOLEAN,
    USER,
    CHANNEL,
    ROLE,
    MENTIONABLE,
    NUMBER,
    ATTACHMENT
};

export enum ChannelTypes {
    TEXT,
    DM,
    CATEGORY = 4
}

export enum OverwriteObjectTypes {
    ROLE,
    MEMBER
}

export interface FileContent {
    name: string,
    buffer: Buffer
}

export interface ContentOptions {
    content?: string,
    embeds?: EmbedBuilder[],
    components?: ActionRowBuilder[]
    ephemeral?: boolean,
    file?: FileContent | FileContent[],
    poll?: PollRequestObject
}

export interface PollMediaObject {
    text: string,
    emoji?: PartialEmoji
}

export interface PollRequestObject {
    question: PollMediaObject,
    answers: {
        answer_id: number,
        poll_media: PollMediaObject
    }[],
    duration: number,
    allow_multiselect: boolean
}

export interface JSONCache {
    [x: string]: unknown
}

// Bot itents
export enum Intents {
    GUILDS = 1 << 0,
    GUILD_MEMBERS = 1 << 1,
    GUILD_BANS = 1 << 2,
    GUILD_EMOJIS_AND_STICKERS = 1 << 3,
    GUILD_INTEGRATIONS = 1 << 4,
    GUILD_WEBHOOKS = 1 << 5,
    GUILD_INVITES = 1 << 6,
    GUILD_VOICE_STATES = 1 << 7,
    GUILD_PRESENCES = 1 << 8,
    GUILD_MESSAGES = 1 << 9,
    GUILD_MESSAGE_REACTIONS = 1 << 10,
    GUILD_MESSAGE_TYPING = 1 << 11,
    DIRECT_MESSAGES = 1 << 12,
    DIRECT_MESSAGE_REACTIONS = 1 << 13,
    DIRECT_MESSAGE_TYPING = 1 << 14,
    MESSAGE_CONTENT = 1 << 15,
    GUILD_SCHEDULED_EVENTS = 1 << 16,
    ALL = 131071
}

/**
 * Calculate intents by giving the sum of all of them
 * @param intents Array of {@link Intents}
 * @returns Intents total value
 */
function calculateIntents(intents: Intents[]) {
    let totalIntentsValue = 0
    for (let i = 0; i < intents.length; i++) {
        const intent = intents[i];
        totalIntentsValue += intent
    }
    if (totalIntentsValue > Intents.ALL) throw new Error("Error with calculating intents.", {
        cause: 'Intent "ALL" should be chosen alone.'
    })

    return totalIntentsValue
}

// Client class
export class Client {
    // Important variables
    protected isReady = false
    protected payload;
    protected ws: WebSocket;
    protected readyTimestamp: number
    protected listeners: {
        event: keyof ClientEvents,
        once: boolean,
        callback: (...args: any) => any
    }[] = []
    protected session_id: string
    protected seq: number | null = null
    protected initialUrl = 'wss://gateway.discord.gg'
    protected url = this.initialUrl
    protected cacheAllUsers = false
    protected intents = 0
    public users: User[] = []
    public guilds: Guild[] = []
    public channels: Channel[] = []
    public roles: Role[] = []
    public collectors: Collector[] = []
    public logger: {
        info: (...args: any[]) => any,
        error: (...args: any[]) => any
    } = console
    public token: string
    public readonly baseURL = "https://discord.com/api/v10/"

    get user() {
        return this.users[0] as User
    }

    /**
     * Pings discord every "ms" milliseconds
     * @param ms Milliseconds
     * @returns Interval
     */
    private heartbeat(ms: number) {
        return setInterval(() => {
            this.ws.send(JSON.stringify({ op: 1, d: this.seq }))
        }, ms)
    }

    setDefaultLogger(logger: {
        info: (...args: any[]) => any,
        error: (...args: any[]) => any
    }) {
        this.logger = logger
    }

    /**
     * @param token Bot token
     * @param options Extra options
     */
    constructor(token: string, options?: {
        cacheAllUsers?: boolean,
        intents?: Intents[]
    }) {
        this.token = token
        this.cacheAllUsers = options?.cacheAllUsers || false
        if (options?.intents && options.intents.length) {
            this.intents = calculateIntents(options.intents)
        }
        this.payload = {
            op: 2,
            d: {
                token: this.token,
                intents: this.intents,
                properties: {
                    $os: 'linux',
                    $browser: 'chrome',
                    $device: 'chrome'
                },
            }
        }
        Object.defineProperty(this, "token", {
            writable: false
        })
    }

    /**
     * How many milliseconds the bot has been up for since Epoch
     */
    get uptime() {
        return Date.now() - this.readyTimestamp
    }

    async registerChannelFromAPI(channelId: string) {
        const data = await axios.get(`${this.baseURL}channels/${channelId}`, {
            headers: this.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) return

        this.channels.push(new Channel(data.data, this))
    }

    /**
     * Caches user(s)
     * @param user {@link User} to cache
     */
    private registerUser(user: User | User[]) {
        if (Array.isArray(user)) {
            for (let i = 0; i < user.length; i++) {
                const userObject = user[i];
                if (!this.users.find(a => a.id === userObject.id)) {
                    this.users.push(userObject)
                }
            }
        } else {
            if (!this.users.find(a => a.id === user.id)) {
                this.users.push(user)
            }
        }
    }

    private emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]) {
        if (!this.isReady) return
        for (let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i];
            if (listener.event === event) {
                listener.callback(...args)
                if (listener.once) this.listeners.splice(i, 1)
            }
        }
    }

    /**
     * Listen for an event
     * @param event Event to listen for
     * @param callback Event callback
     */
    on<K extends keyof ClientEvents>(event: K, callback: (...args: ClientEvents[K]) => any) {
        this.listeners.push({
            event,
            once: false,
            callback
        })
    }

    /**
     * Listen for an event once
     * @param event Event to listen for
     * @param callback Event callback
     */
    once<K extends keyof ClientEvents>(event: K, callback: (...args: ClientEvents[K]) => any) {
        this.listeners.push({
            event,
            once: true,
            callback
        })
    }

    getHeaders(contentType?: string) {
        return {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": contentType || "application/json"
        }
    }

    /**
     * Close websocket and remove all its listeners
     */
    disconnect() {
        this.ws.removeAllListeners()
        this.ws.close()
        this.token = null
    }

    /**
     * Get guild commands from discord API
     * @param guild The ID of the guild or a {@link Guild} object
     * @returns Guild commands
     */
    async getGuildCommands(guild: string | Guild) {
        let id = typeof guild === "string" ? guild : guild.id
        const data = await axios.get(`${this.baseURL}applications/${this.user.id}/guilds/${id}/commands`, {
            headers: this.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message)

        return data.data
    }

    /**
     * Bulk overwrite guild commands
     * @param guild The ID of the guild or a {@link Guild} object
     * @param commands Array of {@link SlashCommandBuilder}
     */
    async setGuildCommands(guild: string | Guild, commands: SlashCommandBuilder[]) {
        let id = typeof guild === "string" ? guild : guild.id
        const allCommands = await this.getGuildCommands(id)
        const JSONCommands: {
            name: string,
            type: number,
            description?: string,
            options?: any[]
        }[] = []

        for (let i = 0; i < commands.length; i++) {
            const cmd: any = commands[i].toJson();
            if (allCommands.find(a => a.name === cmd.name)) cmd.id = allCommands.find(a => a.name === cmd.name).id
            JSONCommands.push(cmd)
        }

        const data = await axios.put(`${this.baseURL}applications/${this.user.id}/guilds/${id}/commands`, JSONCommands, {
            headers: this.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message)
    }

    /**
     * Get the global commands for the application from the discord API
     * @returns Global commands
     */
    async getCommands() {
        const data = await axios.get(`${this.baseURL}applications/${this.user.id}/commands`, {
            headers: this.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message);

        return data.data
    }

    /**
     * Bulk overwrite glboal commands
     * @param commands Array of {@link SlashCommandBuilder}
     */
    async setGlobalCommands(commands: SlashCommandBuilder[]) {
        const allCommands = await this.getCommands()
        const JSONCommands: {
            name: string,
            type: number,
            description?: string,
            options?: any[]
        }[] = []
        for (let i = 0; i < commands.length; i++) {
            const cmd: any = commands[i].toJson();
            if (allCommands.find(a => a.name === cmd.name)) cmd.id = allCommands.find(a => a.name === cmd.name).id
            JSONCommands.push(cmd)
        }

        const data = await axios.put(`${this.baseURL}/applications/${this.user.id}/commands`, JSONCommands, {
            headers: this.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message)
    }

    /**
     * Update bot presence
     * @param data Presence data
     */
    editStatus(data: PRESENCES | {
        activity?: {
            name: string,
            type: ActivityTypes
        },
        status: PRESENCES
    }) {
        const presencePayload = {
            "op": 3,
            "d": {
                "since": null,
                "activities": typeof data === "string" || !data.activity ? [] : [data.activity],
                "status": typeof data === "string" ? data : data.status,
                "afk": false,
            }
        }
        this.ws.send(JSON.stringify(presencePayload))
    }

    /**
     * Fetch a message from the discord API
     * @param channelId The id of the channel the message is in
     * @param messageId The id of the message
     * @returns A {@link Message} object
     */
    async getMessage(channelId: string, messageId: string) {
        const data = await axios.get(`${this.baseURL}/channels/${channelId}/messages/${messageId}`, {
            headers: this.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message);

        return new Message(data.data, this)
    }

    /**
     * Get cached channel
     * @param channelId The id of the channel
     * @returns A {@link Channel} object
     */
    getChannel(channelId: string) {
        return this.channels.find(a => a.id === channelId)
    }

    private _deleteChannels(id: string | string[]) {
        const IDs = typeof id === "string" ? [id] : id
        for (let i = 0; i < IDs.length; i++) {
            const id = IDs[i];
            const index = this.channels.findIndex(a => a.id === id)
            if (index > -1) {
                this.channels.splice(index, 1)
            }
        }
    }

    /**
     * Connect to discord websocket
     */
    connect() {
        try {
            // If websocket is opened close it
            if (this.ws && this.ws.readyState !== 3) this.ws.close();

            const _this = this
            // Open the websocket
            this.ws = new WebSocket(this.url + "/?v=10&encoding=json")

            this.ws.on('open', function open(data: any) {
                // If this isn't the first time the client connects send resumePayload
                if (_this.initialUrl !== this.url) {
                    const resumePayload = {
                        op: 6,
                        d: {
                            token: _this.token,
                            sessionId: _this.session_id,
                            seq: _this.seq
                        }
                    }

                    _this.ws.send(JSON.stringify(resumePayload))
                }
            })

            // Listen for when websocket closes and reconnect
            this.ws.on("close", function close() {
                setTimeout(() => {
                    _this.connect()
                }, 2500);
            })

            // Listen for websocket errors
            this.ws.on("error", (e) => {
                _this.logger.error(e.message)
                _this.connect()
            })

            // Listen for websocket messages
            this.ws.on('message', async function incoming(data: any) {
                let payload = JSON.parse(data)
                const { t, op, d, s } = payload;

                switch (op) {
                    case 10:
                        const { heartbeat_interval } = d;
                        interval = _this.heartbeat(heartbeat_interval)

                        if (_this.url === _this.initialUrl) _this.ws.send(JSON.stringify(_this.payload))
                        break;
                    case 7:
                        _this.connect()
                        return
                        break;
                    case 0:
                        _this.seq = s
                        break;
                }
                switch (t) {
                    case "READY":
                        _this.readyTimestamp = Date.now()
                        _this.url = d.resume_gateway_url
                        _this.session_id = d.session_id
                        _this.registerUser(new User(d.user))
                        setTimeout(() => {
                            _this.isReady = true
                            _this.emit("ready")
                        }, 1000);
                        break;
                    case "RESUMED":
                        _this.emit("resume")
                        break;
                    case "MESSAGE_CREATE":
                        if (d.author) {
                            if (!_this.channels.find(a => a.id === d.channel_id)) await _this.registerChannelFromAPI(d.channel_id)
                            _this.emit("messageCreate", new Message(d, _this))
                        }
                        break;
                    case "MESSAGE_UPDATE":
                        if (d.author) {
                            _this.emit("messageUpdate", new Message(d, _this))
                        }
                        break;
                    case "GUILD_CREATE":
                        {
                            // Cache all guild roles
                            for (let i = 0; i < d.roles.length; i++) {
                                let role = d.roles[i]
                                role.guild_id = d.id
                                _this.roles.push(new Role(role, _this))
                            }

                            // Cache all users
                            if (_this.cacheAllUsers) {
                                const allUsers: User[] = []
                                for (let i = 0; i < d.members.length; i++) {
                                    const user = d.members[i].user;
                                    allUsers.push(new User(user))
                                }

                                _this.registerUser(allUsers)
                            }

                            // Cache all channels
                            for (let i = 0; i < d.channels.length; i++) {
                                const channel = d.channels[i];
                                d.channels[i].guild_id = d.id
                                _this.channels.push(new Channel(channel, _this))
                            }

                            // Cache guild
                            _this.guilds.push(new Guild(d, _this))
                            // Emit a guildCreate event
                            _this.emit("guildCreate", _this.guilds.find(a => a.id === d.id) as Guild)
                        }
                        break
                    case "INTERACTION_CREATE":
                        if (d.type === InteractionTypes.APPLICATION_COMMAND) {
                            // Emit interactionCreate event with the argument according to the interaction type
                            switch (d.data.type) {
                                case ApplicationCommandTypes.CHAT_INPUT:
                                    _this.emit("interactionCreate", new SlashCommandInteraction(d, _this))
                                    break;
                                case ApplicationCommandTypes.USER:
                                    _this.emit("interactionCreate", new UserContextInteraction(d, _this))
                                    break;
                                case ApplicationCommandTypes.MESSAGE:
                                    _this.emit("interactionCreate", new MessageContextInteraction(d, _this))
                                    break;
                            }
                        } else if (d.type === InteractionTypes.MESSAGE_COMPONENT) {
                            if (d.data.component_type === 2) {
                                const collector = _this.collectors.find(a => a.messageId === d.message.id)
                                if (collector) {
                                    collector.emit("collect", d.data.component_type, new ButtonInteraction(d, _this))
                                }
                                _this.emit("interactionCreate", new ButtonInteraction(d, _this))
                            }
                        }
                        break
                    case "GUILD_ROLE_UPDATE":
                        {
                            // Update the cached role
                            const oldRole = new Role(_this.roles.find(a => a.id === d.role.id)?.toJson() as Role, _this)
                            for (let i = 0; i < _this.roles.length; i++) {
                                if (_this.roles[i].guild_id === d.guild_id) {
                                    _this.roles[i] = new Role(d.role, _this)
                                    break
                                }
                            }
                            _this.emit("roleUpdate", oldRole, _this.roles.find(a => a.id === d.role.id) as Role, _this.guilds.find(a => a.id === d.guild_id) as Guild)
                        }
                        break
                    case "CHANNEL_CREATE":
                        {
                            // Cache the channel
                            const index = _this.channels.push(new Channel(d, _this)) - 1
                            _this.emit("channelCreate", _this.channels[index])
                        }
                        break;
                    case "CHANNEL_DELETE":
                        {
                            // Remove channel from cache
                            const index = _this.channels.findIndex(channel => channel.id === d.id)
                            const channel = _this.channels[index]

                            if (index > -1) {
                                _this.channels.splice(index, 1)
                                _this.emit("channelDelete", channel)
                            }
                        }
                        break;
                    case "GUILD_DELETE":
                        {
                            // Remove all cached channels that are related to the guild
                            let channelIDs: string[] = []
                            for (let i = 0; i < _this.channels.length; i++) {
                                const channel = _this.channels[i]
                                if (channel.guild_id && channel.guild_id === d.id) {
                                    channelIDs.push(channel.id)
                                }
                            }
                            _this._deleteChannels(channelIDs)

                            // Delete the cached guild
                            const guildIndex = _this.guilds.findIndex(guild => guild.id === d.id)
                            const guild = _this.guilds[guildIndex]

                            if (guildIndex > -1) {
                                _this.guilds.splice(guildIndex, 1)
                                _this.emit("guildDelete", guild)
                            }
                        }
                        break;
                    case "GUILD_MEMBER_UPDATE":
                        {
                            // Update cached member
                            const data = d as APIGuildMemberUpdate
                            const guildMemberIndex = _this.guilds.find(a => a.id === data.guild_id).members.findIndex(a => a.user.id === data.user.id)
                            if (guildMemberIndex > -1) {
                                const member = _this.guilds.find(a => a.id === data.guild_id).members[guildMemberIndex]
                                member.rolesIDs = data.roles
                                member.nick = data.nick
                            }
                        }
                        break;
                    case "GUILD_ROLE_CREATE":
                        {
                            // Update cached role
                            const data = d as {
                                guild_id: string,
                                role: APIRole | any
                            }
                            data.role.guild_id = data.guild_id
                            _this.roles.push(new Role(data.role, _this))
                        }
                        break;
                    case "GUILD_ROLE_DELETE":
                        {
                            // Remove role from cache
                            const data = d as {
                                guild_id: string,
                                role_id: string
                            }
                            const index = _this.roles.findIndex(a => a.guild_id === data.guild_id && a.id === data.role_id)
                            if (index > -1) {
                                _this.roles.splice(index, 1)
                            }
                        }
                        break;
                    case "USER_UPDATE":
                        {
                            // Update cached user
                            const data = d as APIUser
                            const index = _this.users.findIndex(a => a.id === data.id)
                            if (index > -1) {
                                const user = _this.users[index]
                                user.username = data.username
                                user.avatar = data.avatar
                                user.displayName = data.global_name
                            }
                        }
                        break;
                }
            })
        } catch (e) {
            this.logger.error(e.message)
            this.connect()
        }
    }

}