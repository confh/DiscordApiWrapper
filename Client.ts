import WebSocket from 'ws';
import User from './classes/User';
import Guild from './classes/Guild';
import Message from "./classes/Message"
import Interaction, { ButtonInteraction, ContextInteraction, SlashCommandInteraction } from './classes/Interaction';
import SlashCommandBuilder from './classes/SlashCommandBuilder';
import ActionRowBuilder from "./classes/ActionRowBuilder"
import EmbedBuilder from './classes/EmbedBuilder'
import axios from 'axios';
import Channel from './classes/Channel';
import Collector from './classes/Collector';
import Role from './classes/Role';
import Member from './classes/Member';
let interval: number | Timer = 0;

type PRESENCES = "online" | "dnd" | "invisible" | "idle"

export interface ClientEvents {
    ready: [],
    messageCreate: [message: Message],
    guildCreate: [guild: Guild],
    interactionCreate: [interaction: Interaction],
    resume: [],
    roleUpdate: [oldRole: Role, newrole: Role, guild: Guild]
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

export interface PartialEmoji {
    id: string
    name: string
}

export interface BaseData {
    id: string;
    [key: string]: any;
}

export enum ApplicationCommandTypes {
    CHAT_INPUT = 1,
    USER,
    MESSAGE
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
}

export interface ContentOptions {
    content?: string,
    embeds?: EmbedBuilder[],
    components?: ActionRowBuilder[]
    ephemeral?: boolean
}

export default class Client {
    private payload;
    private ws: WebSocket;
    private listeners: {
        event: keyof ClientEvents,
        callback: (...args: any) => any
    }[] = []
    private session_id: string
    private seq = -1
    private initialUrl = 'wss://gateway.discord.gg'
    private url = this.initialUrl
    private cacheAllUsers = false
    public users: User[] = []
    public guilds: Guild[] = []
    public channels: Channel[] = []
    public roles: Role[] = []
    public collectors: Collector[] = []
    public user: User
    public token: string
    public readonly baseURL = "https://discord.com/api/v10/"

    private heartbeat(ms: number) {
        return setInterval(() => {
            this.ws.send(JSON.stringify({ op: 1, d: null }))
        }, ms)
    }

    constructor(token: string, options?: {
        cacheAllUsers?: boolean
    }) {
        this.token = token
        this.cacheAllUsers = options?.cacheAllUsers || false
        this.payload = {
            op: 2,
            d: {
                token: this.token,
                intents: 131071,
                properties: {
                    $os: 'linux',
                    $browser: 'chrome',
                    $device: 'chrome'
                },
            }
        }
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
        const listener = this.listeners.find(a => a.event === event)
        if (listener) listener.callback(...args)
    }

    on<K extends keyof ClientEvents>(event: K, callback: (...args: ClientEvents[K]) => any) {
        this.listeners.push({
            event,
            callback
        })
    }

    getHeaders() {
        return {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }
    }

    disconnect() {
        this.ws.removeAllListeners()
        this.ws.close()
    }

    async setGlobalCommands(...Commands: SlashCommandBuilder[]) {
        const JSONCommands: any = []
        for (let i = 0; i < Commands.length; i++) {
            const cmd = Commands[i];
            JSONCommands.push(cmd.toJson())
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
                "since": 91879201,
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
                        _this.url = d.resume_gateway_url
                        _this.session_id = d.session_id
                        _this.user = new User(d.user)
                        _this.registerUser(new User(d.user))
                        _this.emit("ready")
                        break;
                    case "RESUMED":
                        _this.emit("resume")
                        break;
                    case "MESSAGE_CREATE":
                        _this.emit("messageCreate", new Message(d, _this))
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
                        if (d.data.type === 1) {
                            _this.emit("interactionCreate", new SlashCommandInteraction(d, _this))
                        } else if (d.type === 3) {
                            const collector = _this.collectors.find(a => a.messageId === d.message.id)
                            if (collector) {
                                collector.emit("collect", d.data.component_type, new ButtonInteraction(d, _this))
                            }
                            if (d.data.component_type === 2) {
                                _this.emit("interactionCreate", new ButtonInteraction(d, _this))
                            }
                        } else if (d.type === 2) {
                            if (d.data.type === 3) {
                                _this.emit("interactionCreate", new ContextInteraction(d, _this))
                            }
                        }
                        break
                    case "GUILD_ROLE_UPDATE":
                        const oldRole = new Role(_this.roles.find(a => a.id === d.role.id)?.toJson() as Role)
                        for (let i = 0; i < _this.roles.length; i++) {
                            if (_this.roles[i].guild_id === d.guild_id) {
                                _this.roles[i]._update(d.role)
                                const guild_members = _this.guilds.find(a => a.id === _this.roles[i].guild_id)!.members as Member[]
                                for (let index = 0; index < guild_members!.length; index++) {
                                    const member = guild_members[index] as Member;
                                    const role = member.roles.find(a => a.id === _this.roles[i].id)
                                    if (role) member.roles.find(a => a.id === _this.roles[i].id)?._update(d.role);
                                    member._refreshRoles()
                                }
                                break
                            }
                        }
                        _this.emit("roleUpdate", oldRole, _this.roles.find(a => a.id === d.role.id) as Role, _this.guilds.find(a => a.id === d.guild_id) as Guild)
                        break
                }
            })
        } catch (e) {
            console.error(e.message)
        }
    }

}