import axios from 'axios';
import WebSocket from 'ws';
import { Message, Guild, Interaction, Role, User, EmbedBuilder, ActionRowBuilder, Channel, Collector, SlashCommandBuilder, SlashCommandInteraction, UserContextInteraction, MessageContextInteraction, ButtonInteraction } from './types';
let interval: number | Timer = 0;

type PRESENCES = "online" | "dnd" | "invisible" | "idle"

export interface ClientEvents {
    ready: [],
    messageCreate: [message: Message],
    messageUpdate: [message: Message]
    guildCreate: [guild: Guild],
    interactionCreate: [interaction: Interaction],
    resume: [],
    roleUpdate: [oldRole: Role, newRole: Role, guild: Guild]
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

export class Client {
    private isReady = false
    private payload;
    private ws: WebSocket;
    private readyTimestamp: number
    private listeners: {
        event: keyof ClientEvents,
        once: boolean,
        callback: (...args: any) => any
    }[] = []
    private session_id: string
    private seq: number | null = null
    private initialUrl = 'wss://gateway.discord.gg'
    private url = this.initialUrl
    private cacheAllUsers = false
    private intents = 0
    public users: User[] = []
    public guilds: Guild[] = []
    public channels: Channel[] = []
    public roles: Role[] = []
    public collectors: Collector[] = []
    public logger: {
        info: (...args: any[]) => any,
        error: (...args: any[]) => any
    } = console
    public user: User
    public token: string
    public readonly baseURL = "https://discord.com/api/v10/"

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

    get uptime() {
        return Date.now() - this.readyTimestamp
    }

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
        if(!this.isReady) return
        for (let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i];
            if (listener.event === event) {
                listener.callback(...args)
                if (listener.once) this.listeners.splice(i, 1)
            }
        }
    }

    on<K extends keyof ClientEvents>(event: K, callback: (...args: ClientEvents[K]) => any) {
        this.listeners.push({
            event,
            once: false,
            callback
        })
    }

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

    disconnect() {
        this.ws.removeAllListeners()
        this.ws.close()
    }

    async getGuildCommands(guild: string | Guild) {
        let id = typeof guild === "string" ? guild : guild.id
        const data = await axios.get(`${this.baseURL}applications/${this.user.id}/guilds/${id}/commands`, {
            headers: this.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message)

        return data.data
    }

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

    async getCommands() {
        const data = await axios.get(`${this.baseURL}applications/${this.user.id}/commands`, {
            headers: this.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message);

        return data.data
    }

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

    async getMessage(channelId: string, messageId: string) {
        const data = await axios.get(`${this.baseURL}/channels/${channelId}/messages/${messageId}`, {
            headers: this.getHeaders(),
            validateStatus: () => true
        })

        if (data.status === 400) throw new Error(data.data.message);

        return new Message(data.data, this)
    }

    getChannel(channelId: string) {
        return this.channels.find(a => a.id === channelId)
    }

    connect() {
        try {
            if (this.ws && this.ws.readyState !== 3) this.ws.close();


            const _this = this
            this.ws = new WebSocket(this.url + "/?v=10&encoding=json")

            this.ws.on('open', function open(data: any) {
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

            this.ws.on("close", function close() {
                setTimeout(() => {
                    _this.connect()
                }, 2500);
            })

            this.ws.on("error", (e) => {
                console.log(e.message)
            })

            this.ws.on('message', function incoming(data: any) {
                let payload = JSON.parse(data)
                const { t, op, d, s } = payload;

                switch (op) {
                    case 10:
                        const { heartbeat_interval } = d;
                        interval = _this.heartbeat(heartbeat_interval)

                        if (_this.url === _this.initialUrl) _this.ws.send(JSON.stringify(_this.payload))
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
                        _this.user = new User(d.user)
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
                        _this.emit("messageCreate", new Message(d, _this))
                        break;
                    case "MESSAGE_UPDATE":
                        if (d.author) {
                            _this.emit("messageUpdate", new Message(d, _this))
                        }
                        break;
                    case "GUILD_CREATE":
                        for (let i = 0; i < d.roles.length; i++) {
                            let role = d.roles[i]
                            role.guild_id = d.id
                            _this.roles.push(new Role(role))
                        }

                        if (_this.cacheAllUsers) {
                            const allUsers: User[] = []
                            for (let i = 0; i < d.members.length; i++) {
                                const user = d.members[i].user;
                                allUsers.push(new User(user))
                            }

                            _this.registerUser(allUsers)
                        }

                        for (let i = 0; i < d.channels.length; i++) {
                            const channel = d.channels[i];
                            _this.channels.push(new Channel(channel, _this))
                        }

                        _this.guilds.push(new Guild(d, _this))
                        _this.emit("guildCreate", _this.guilds.find(a => a.id === d.id) as Guild)
                        break
                    case "INTERACTION_CREATE":
                        if (d.type === InteractionTypes.APPLICATION_COMMAND) {
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
                        const oldRole = new Role(_this.roles.find(a => a.id === d.role.id)?.toJson() as Role)
                        for (let i = 0; i < _this.roles.length; i++) {
                            if (_this.roles[i].guild_id === d.guild_id) {
                                _this.roles[i] = new Role(d.role)
                                break
                            }
                        }
                        _this.emit("roleUpdate", oldRole, _this.roles.find(a => a.id === d.role.id) as Role, _this.guilds.find(a => a.id === d.guild_id) as Guild)
                        break
                }
            })
        } catch (e) {
            this.logger.error(e.message)
        }
    }

}
export * from "./PermissionCalculator"
export * from "./types"