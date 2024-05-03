import WebSocket from 'ws';
import User from './classes/User';
import Guild from './classes/Guild';
import Message from "./classes/Message"
import Interaction, { SlashCommandInteraction } from './classes/Interaction';
import fetch from 'node-fetch';
import SlashCommandBuilder from './classes/SlashCommandBuilder';
import EmbedBuilder from './classes/EmbedBuilder'
let interval: number | Timer = 0;

type PRESENCES = "online" | "dnd" | "invisible" | "idle"

interface ClientEvents {
    ready: [],
    messageCreate: [message: Message],
    guildCreate: [guild: Guild],
    interactionCreate: [interaction: Interaction],
    resume: []
}

export interface BaseData {
    id: string;
    [key: string]: any;
}

export enum ApplicationCommandTypes {
    CHAT_INPUT = 1,
    USER = 2,
    MESSAGE = 3
}

export enum ActivityTypes {
    GAME = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    CUSTOM = 4,
    COMPETING = 5
}

export enum ApplicationCommandOptionTypes {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8,
    MENTIONABLE = 9,
    NUMBER = 10,
    ATTACHMENT = 11
};

export interface ContentOptions {
    content?: string,
    embeds?: EmbedBuilder[],
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

    async setGlobalCommands(Commands: SlashCommandBuilder[]) {
        const JSONCommands: any = []
        for (let i = 0; i < Commands.length; i++) {
            const cmd = Commands[i];
            JSONCommands.push(cmd.toJson())
        }
        await fetch(`${this.baseURL}/applications/${this.user.id}/commands`, {
            method: "PUT",
            headers: this.getHeaders(),
            body: JSON.stringify(JSONCommands)
        })
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

    connect() {
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
                    if (_this.cacheAllUsers) {
                        const allUsers: User[] = []
                        for (let i = 0; i < d.members.length; i++) {
                            const user = d.members[i].user;
                            allUsers.push(new User(user))
                        }

                        _this.registerUser(allUsers)
                    }
                    _this.guilds.push(new Guild(d, _this))
                    _this.emit("guildCreate", _this.guilds.find(a => a.id === d.id) as Guild)
                    break
                case "INTERACTION_CREATE":
                    if (d.data.type === 1) {
                        _this.emit("interactionCreate", new SlashCommandInteraction(d, _this))
                    }
                    break
            }
        })
    }

}