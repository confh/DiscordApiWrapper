import axios from "axios";
import WebSocket from "ws";
import { Manager } from "./internal/Manager";
import { ActionRowBuilder, EmbedBuilder } from "./structure/Builders";
import { Channel } from "./structure/Channel";
import { Collector } from "./structure/Collector";
import { Guild } from "./structure/Guild";
import {
  ButtonInteraction,
  Interaction,
  MessageContextInteraction,
  SlashCommandInteraction,
  StringSelectMenuInteraction,
  UserContextInteraction,
} from "./structure/Interactions";
import { Member } from "./structure/Member";
import { Message, WebhookMessage } from "./structure/Message";
import { Role } from "./structure/Role";
import { SlashCommandBuilder } from "./structure/SlashCommandBuilder";
import { User } from "./structure/User";
import { Rest } from "./internal/Rest";

// Type of presence status
type PRESENCES = "online" | "dnd" | "invisible" | "idle";

export async function wait(ms: number): Promise<unknown> {
  return new Promise((res) => {
    setTimeout(() => {
      res(null);
    }, ms);
  });
}

/**
 * Convert JSON to a Blob
 * @param json Type of {@link JSONCache}
 * @returns Blob from JSON
 */
export function JSONToBlob(json: JSONCache): Blob {
  return new Blob([JSON.stringify(json)], {
    type: "application/json",
  });
}

/**
 * Convert JSON to {@link FormData}
 * @param json Type of {@link JSONCache}
 * @param files Array of {@link FileContent}
 * @returns FormData containing file content
 */
export function JSONToFormDataWithFile(
  json: JSONCache,
  ...files: FileContent[]
): JSONCache | FormData {
  if (!files.length) return json;
  const formData = new FormData();
  json.attachments = [];

  formData.set("payload_json", JSONToBlob(json), "");

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    (json.attachments as any[]).push({
      id: i,
      filename: file.name,
    });
    formData.set(`files[${i}]`, new Blob([file.buffer]), file.name);
  }

  return formData;
}

export interface APIGuildMemberEvent extends APIMember {
  guild_id: string;
}

/** Enum for types of webhook */
export enum WebhookTypes {
  INCOMING = 1,
  CHANNEL_FOLLOWER,
  APPLICATION,
}

/** Webhook Object */
export interface APIWebhookObject extends BaseData {
  type: WebhookTypes;
  guild_id?: string | null;
  channel_id: string | null;
  user?: APIUser;
  name: string | null;
  avatar: string | null;
  token?: string;
  application_id: string | null;
  url?: string;
}

/** User Object */
export interface APIUser extends BaseData {
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
}

/** Member Object */
export interface APIMember {
  user: APIUser;
  nick?: string | null;
  avatar?: string | null;
  roles: APIRole[];
  joined_at: string;
  deaf: boolean;
  mute: boolean;
  flags: number;
  permissions: string;
}

/** Message Attachment Object */
export interface APIMessageAttachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  proxy_url: string;
  content_type?: string;
}

/** Message Object */
export interface APIMessage extends BaseData {
  channel_id: string;
  author: APIUser;
  content: string;
  timestamp: string;
  edited_timestamp: string;
  tts: boolean;
  mention_everyone: boolean;
  mentions: APIUser[];
  mention_roles: APIRole[];
  pinned: boolean;
  type: number;
  referenced_message?: APIMessage;
  guild_id: string;
  attachments: APIMessageAttachment[];
}

/** Webhook Message Object */
export interface APIWebhookMessage extends Omit<APIMessage, "author"> {
  webhook_id?: string;
  author: JSONCache;
}

/** Role Object */
export interface APIRole extends BaseData {
  name: string;
  color: number;
  hoist: boolean;
  icon?: string | null;
  unicode_emoji?: string | null;
  position: number;
  permissions: string[];
  managed: boolean;
  mentionable: boolean;
  flags: number;
}

/** Client Events */
export interface ClientEvents {
  ready: [];
  messageCreate: [message: Message];
  messageUpdate: [message: Message];
  messageDelete: [
    messageData: {
      id: string;
      channel_id: string;
    },
  ];
  guildCreate: [guild: Guild];
  guildDelete: [guild: Guild];
  memberUpdate: [oldMember: Member, newMember: Member];
  interactionCreate: [interaction: Interaction];
  resume: [];
  roleCreate: [role: Role];
  roleUpdate: [oldRole: Role, newRole: Role, guild: Guild];
  roleDelete: [role: Role];
  channelCreate: [channel: Channel];
  channelDelete: [channel: Channel];
  userUpdate: [oldUser: User, newUser: User];
  webhookMessageCreate: [message: WebhookMessage];
}

/** Emoji Object */
export interface Emoji {
  id: string;
  name: string;
  roles?: string[];
  user?: User;
  require_colons?: boolean;
  managed?: boolean;
  animated?: boolean;
  available?: boolean;
}

export type PartialEmoji = Omit<
  Emoji,
  "available" | "animated" | "managed" | "require_colons" | "user" | "roles"
>;

export interface BaseData {
  id: string;
  [key: string]: any;
}

export enum ApplicationCommandTypes {
  CHAT_INPUT = 1,
  USER,
  MESSAGE,
}

export enum InteractionTypes {
  PING = 1,
  APPLICATION_COMMAND,
  MESSAGE_COMPONENT,
}

export enum ComponentTypes {
  ACTION_ROW = 1,
  BUTTON,
  STRING_SELECT,
  TEXT_INPUT,
}

export enum ButtonStyles {
  PRIMARY = 1,
  SECONDARY,
  SUCCESS,
  DANGER,
  LINK,
}

export enum ActivityTypes {
  GAME,
  STREAMING,
  LISTENING,
  WATCHING,
  CUSTOM,
  COMPETING,
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
  ATTACHMENT,
}

export enum ChannelTypes {
  TEXT,
  DM,
  CATEGORY = 4,
}

export enum OverwriteObjectTypes {
  ROLE,
  MEMBER,
}

export interface FileContent {
  name: string;
  buffer: Buffer;
}

export interface ContentOptions {
  content?: string;
  embeds?: EmbedBuilder[];
  components?: ActionRowBuilder[];
  ephemeral?: boolean;
  file?: FileContent | FileContent[];
  poll?: PollRequestObject;
}

export interface WebhookContentOptions extends ContentOptions {
  username?: string;
  avatar_url?: string;
}

export interface PollMediaObject {
  text: string;
  emoji?: PartialEmoji;
}

export interface PollRequestObject {
  question: PollMediaObject;
  answers: {
    answer_id: number;
    poll_media: PollMediaObject;
  }[];
  duration: number;
  allow_multiselect: boolean;
}

export interface JSONCache {
  [x: string]: unknown;
}

/** Enum of types of messages */
export enum MessageTypes {
  DEFAULT,
  USER_JOIN = 7,
  REPLY = 19,
}

/** Bot Intents */
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
  ALL = 131071,
}

/**
 * Calculate intents by giving the sum of all of them
 * @param intents Array of {@link Intents}
 * @returns Intents total value
 */
function calculateIntents(intents: Intents[]) {
  let totalIntentsValue = 0;
  for (let i = 0; i < intents.length; i++) {
    const intent = intents[i];
    totalIntentsValue += intent;
  }
  if (totalIntentsValue > Intents.ALL)
    throw new Error("Error with calculating intents.", {
      cause: 'Intent "ALL" should be chosen alone.',
    });

  return totalIntentsValue;
}

/**
 * The discord client class
 */
export class Client {
  // Important variables
  #isReady = false;
  #payload: JSONCache;
  #lastHeartbeat: number;
  #lastHeartbeatAck: number;
  #ws: WebSocket;
  #readyTimestamp: number;
  #listeners: {
    event: keyof ClientEvents;
    once: boolean;
    callback: (...args: any) => any;
  }[] = [];
  #cachedSocketMessages: string[] = [];
  #session_id: string;
  #seq: number | null = null;
  readonly #initialUrl = "wss://gateway.discord.gg";
  #url = this.#initialUrl;
  readonly #cacheAllUsers: boolean;
  #intents = 0;
  readonly #token: string;
  public shards: number;
  public readonly users: Manager<User> = new Manager<User>();
  public readonly guilds: Manager<Guild> = new Manager<Guild>();
  public readonly channels: Manager<Channel> = new Manager<Channel>();
  public readonly roles: Manager<Role> = new Manager<Role>();
  public readonly rest: Rest;
  public collectors: Collector[] = [];
  public logger: {
    info: (...args: any[]) => any;
    error: (...args: any[]) => any;
  } = console;
  public readonly baseURL = "https://discord.com/api/v10/";

  /**
   * The user object for the bot.
   * @returns {User} The bot user object.
   */
  get user(): User {
    return this.users.getByIndex(0);
  }

  /**
   * The bot token used to authenticate with the API.
   * @returns {string} The bot token.
   */
  get token(): string {
    return this.#token;
  }



  get ping(): number {
    if (this.#lastHeartbeatAck) {
      return this.#lastHeartbeatAck - this.#lastHeartbeat;
    } else {
      return -1;
    }
  }

  /**
   * Sends a JSON payload to the discord gateway, if the socket is not connected it will cache the payload and send it when the socket is connected.
   * @param json The JSON payload to send.
   */
  private sendToSocket(json: JSONCache) {
    if (this.#ws.readyState != 1) {
      this.#cachedSocketMessages.push(JSON.stringify(json));
    } else {
      this.#ws.send(JSON.stringify(json));
    }
  }

  /**
   * Pings discord every "ms" milliseconds
   * @param ms Milliseconds
   * @returns Interval
   */
  private _heartbeat(ms: number) {
    return setInterval(() => {
      this.#lastHeartbeat = Date.now();
      this.sendToSocket({ op: 1, d: this.#seq });
    }, ms);
  }

  /**
   * Sets the default logger for the client, this will be used for all logging done by the client.
   * @param logger The logger object to use, this must have an "info" and "error" method.
   */
  setDefaultLogger(logger: {
    info: (...args: any[]) => any;
    error: (...args: any[]) => any;
  }) {
    this.logger = logger;
  }

  /**
   * @param token Bot token
   * @param options Extra options
   */
  constructor(
    token: string,
    options?: {
      cacheAllUsers?: boolean;
      intents?: Intents[];
      shards?: "auto" | number;
    },
  ) {
    const shards = options.shards || "auto";
    this.#token = token;
    this.#cacheAllUsers = options?.cacheAllUsers || false;
    if (options?.intents && options.intents.length) {
      this.#intents = calculateIntents(options.intents);
    }
    if (shards === "auto") {
      this._registerShards();
    } else {
      this.shards = shards;
      this._definePayload();
    }
    this.rest = new Rest(this);
  }

  private _definePayload() {
    this.#payload = {
      op: 2,
      d: {
        token: this.#token,
        intents: this.#intents,
        properties: {
          $os: "linux",
          $browser: "chrome",
          $device: "chrome",
        },
        shard: [0, this.shards],
      },
    };
  }

  private async _registerShards() {
    const data = await axios.get(`${this.baseURL}gateway/bot`, {
      headers: this.getHeaders(),
      validateStatus: () => true,
    });

    if (data.status === 400 || data.status === 401)
      throw new Error(data.data.message);

    this.shards = data.data.shards;
    this._definePayload();
    Object.defineProperty(this, "shards", { writable: false });
  }

  /**
   * The number of milliseconds the bot has been up for since Epoch
   */
  get uptime(): number {
    return Date.now() - this.#readyTimestamp;
  }

  async registerChannelFromAPI(channelId: string) {
    const data = await axios.get(`${this.baseURL}channels/${channelId}`, {
      headers: this.getHeaders(),
      validateStatus: () => true,
    });

    if (data.status === 400) return;

    this.channels.cache(new Channel(data.data, this));
  }

  private emit<K extends keyof ClientEvents>(
    event: K,
    ...args: ClientEvents[K]
  ) {
    if (!this.#isReady) return;
    for (let i = 0; i < this.#listeners.length; i++) {
      const listener = this.#listeners[i];
      if (listener.event === event) {
        listener.callback(...args);
        if (listener.once) this.#listeners.splice(i, 1);
      }
    }
  }

  /**
   * Listen for an event
   * @param event Event to listen for
   * @param callback Event callback
   */
  on<K extends keyof ClientEvents>(
    event: K,
    callback: (...args: ClientEvents[K]) => any,
  ) {
    this.#listeners.push({
      event,
      once: false,
      callback,
    });
  }

  /**
   * Listen for an event once
   * @param event Event to listen for
   * @param callback Event callback
   */
  once<K extends keyof ClientEvents>(
    event: K,
    callback: (...args: ClientEvents[K]) => any,
  ) {
    this.#listeners.push({
      event,
      once: true,
      callback,
    });
  }



  /**
   * Get the headers for a request
   * @param contentType The content type of the request. Defaults to `application/json`
   * @returns The headers for the request
   */
  getHeaders(contentType?: string): {
    Authorization: string;
    "Content-Type": string;
  } {
    return {
      Authorization: `Bot ${this.#token}`,
      "Content-Type": contentType || "application/json",
    };
  }

  /**
   * Close websocket and remove all its listeners
   */
  disconnect() {
    this.#ws.removeAllListeners();
    this.#ws.close(1000);
  }

  /**
   * Get guild commands from discord API
   * @param guild The ID of the guild or a {@link Guild} object
   * @returns Guild commands
   */
  async getGuildCommands(guild: string | Guild): Promise<any> {
    let id = typeof guild === "string" ? guild : guild.id;
    const data = await axios.get(
      `${this.baseURL}applications/${this.user.id}/guilds/${id}/commands`,
      {
        headers: this.getHeaders(),
        validateStatus: () => true,
      },
    );

    if (data.status === 400) throw new Error(data.data.message);

    return data.data;
  }

  /**
   * Bulk overwrite guild commands
   * @param guild The ID of the guild or a {@link Guild} object
   * @param commands Array of {@link SlashCommandBuilder}
   */
  async setGuildCommands(
    guild: string | Guild,
    commands: SlashCommandBuilder[],
  ) {
    let id = typeof guild === "string" ? guild : guild.id;
    const allCommands = await this.getGuildCommands(id);
    const JSONCommands: {
      name: string;
      type: number;
      description?: string;
      options?: any[];
    }[] = [];

    for (let i = 0; i < commands.length; i++) {
      const cmd: any = commands[i].toJson();
      if (allCommands.find((a) => a.name === cmd.name))
        cmd.id = allCommands.find((a) => a.name === cmd.name).id;
      JSONCommands.push(cmd);
    }

    const data = await axios.put(
      `${this.baseURL}applications/${this.user.id}/guilds/${id}/commands`,
      JSONCommands,
      {
        headers: this.getHeaders(),
        validateStatus: () => true,
      },
    );

    if (data.status === 400) throw new Error(data.data.message);
  }

  /**
   * Get the global commands for the application from the discord API
   * @returns Global commands
   */
  async getCommands(): Promise<any> {
    const data = await axios.get(
      `${this.baseURL}applications/${this.user.id}/commands`,
      {
        headers: this.getHeaders(),
        validateStatus: () => true,
      },
    );

    if (data.status === 400) throw new Error(data.data.message);

    return data.data;
  }

  /**
   * Bulk overwrite glboal commands
   * @param commands Array of {@link SlashCommandBuilder}
   */
  async setGlobalCommands(...commands: SlashCommandBuilder[]) {
    const allCommands = await this.getCommands();
    const JSONCommands: {
      name: string;
      type: number;
      description?: string;
      options?: any[];
    }[] = [];
    for (let i = 0; i < commands.length; i++) {
      const cmd: any = commands[i].toJson();
      if (allCommands.find((a) => a.name === cmd.name))
        cmd.id = allCommands.find((a) => a.name === cmd.name).id;
      JSONCommands.push(cmd);
    }

    const data = await axios.put(
      `${this.baseURL}/applications/${this.user.id}/commands`,
      JSONCommands,
      {
        headers: this.getHeaders(),
        validateStatus: () => true,
      },
    );

    if (data.status === 400) throw new Error(data.data.message);
  }

  /**
   * Update bot presence
   * @param data Presence data
   */
  editStatus(
    data:
      | PRESENCES
      | {
        activity?: {
          name: string;
          type: ActivityTypes;
        };
        status: PRESENCES;
      },
  ) {
    const presencePayload = {
      op: 3,
      d: {
        since: null,
        activities:
          typeof data === "string" || !data.activity ? [] : [data.activity],
        status: typeof data === "string" ? data : data.status,
        afk: false,
      },
    };
    this.sendToSocket(presencePayload);
  }

  /**
   * Fetch a message from the discord API
   * @param channelId The id of the channel the message is in
   * @param messageId The id of the message
   * @returns A {@link Message} object
   */
  async getMessage(channelId: string, messageId: string): Promise<Message> {
    const data = await axios.get(
      `${this.baseURL}/channels/${channelId}/messages/${messageId}`,
      {
        headers: this.getHeaders(),
        validateStatus: () => true,
      },
    );

    if (data.status === 400) throw new Error(data.data.message);

    return new Message(data.data, this);
  }

  /**
   * Get cached channel
   * @param channelId The id of the channel
   * @returns A {@link Channel} object
   */
  getChannel(channelId: string): Channel {
    return this.channels.get(channelId);
  }

  private _deleteChannels(id: string | string[]) {
    const IDs = typeof id === "string" ? [id] : id;
    for (let i = 0; i < IDs.length; i++) {
      const id = IDs[i];
      this.channels.delete(id);
    }
  }

  /**
   * Connect to discord websocket
   */
  async connect(): Promise<void> {
    // If websocket isn't closed close it.
    if (this.#ws && this.#ws.readyState !== 3) this.#ws.close(4000);

    const _this = this;

    // Open the websocket
    this.#ws = new WebSocket(this.#url + "/?v=10&encoding=json");

    this.#ws.on("open", function open(data: any) {
      // If this isn't the first time the client connects send resumePayload
      if (_this.#initialUrl !== _this.#url) {
        const resumePayload = {
          op: 6,
          d: {
            token: _this.#token,
            session_id: _this.#session_id,
            seq: _this.#seq,
            shard: [0, _this.shards],
          },
        };

        _this.sendToSocket(resumePayload);

        setTimeout(() => {
          for (let i = 0; i < _this.#cachedSocketMessages.length; i++) {
            const message = _this.#cachedSocketMessages[i];
            _this.sendToSocket(JSON.parse(message));
          }
        }, 1000);
      }
    });

    // Listen for when websocket closes and reconnect
    this.#ws.on("close", function close(code) {
      switch (code) {
        case 4004:
          throw new Error("Invalid token");
        case 4012:
          throw new Error("Invalid API version");
        default:
          this.removeAllListeners();
          this.close(4000, "Reconnecting");
          setTimeout(() => {
            _this.#ws = null;
            _this.connect();
          }, 1000);
          break;
      }
    });

    // Listen for websocket errors
    this.#ws.on("error", (e) => {
      _this.logger.error(e.message);
      _this.#ws.removeAllListeners();
      _this.#ws = null;
      setTimeout(() => {
        _this.#ws = null;
        _this.connect();
      }, 1000);
    });

    // Listen for websocket messages
    this.#ws.on("message", async function incoming(data: any) {
      let payload = JSON.parse(data);
      const { t, op, d, s } = payload;

      switch (op) {
        case 10:
          const { heartbeat_interval } = d;
          _this._heartbeat(heartbeat_interval);

          if (_this.#url === _this.#initialUrl)
            this.send(JSON.stringify(_this.#payload));
          break;
        case 7:
          this.removeAllListeners();
          this.close(4000, "Reconnecting");
          _this.#ws = null;
          _this.connect();
          return;
        case 9:
          _this.#url = _this.#initialUrl;
          _this.#session_id = null;
          _this.#seq = null;
          this.removeAllListeners();
          this.close(4000, "Reconnecting");
          _this.connect();
          return;
        case 11:
          _this.#lastHeartbeatAck = Date.now();
          break;
        case 0:
          _this.#seq = s;
          break;
      }
      switch (t) {
        case "READY":
          _this.#readyTimestamp = Date.now();
          _this.#url = d.resume_gateway_url;
          _this.#session_id = d.session_id;
          _this.users.cache(new User(d.user, _this));
          setTimeout(() => {
            _this.#isReady = true;
            _this.emit("ready");
          }, 500);
          break;
        case "RESUMED":
          _this.emit("resume");
          break;
        case "MESSAGE_CREATE":
          if (![MessageTypes.DEFAULT, MessageTypes.REPLY].includes(d.type))
            return;
          if (!_this.channels.get(d.channel_id))
            await _this.registerChannelFromAPI(d.channel_id);
          if (d.author && !d.webhook_id) {
            _this.emit("messageCreate", new Message(d, _this));
          } else if (d.author && d.webhook_id) {
            _this.emit("webhookMessageCreate", new WebhookMessage(d, _this));
          }
          break;
        case "MESSAGE_UPDATE":
          {
            if (![MessageTypes.DEFAULT, MessageTypes.REPLY].includes(d.type))
              return;
            if (d.author) {
              _this.emit("messageUpdate", new Message(d, _this));
            }
          }
          break;
        case "MESSAGE_DELETE":
          {
            _this.emit("messageDelete", {
              id: d.id,
              channel_id: d.channel_id,
            });
          }
          break;
        case "GUILD_CREATE":
          {
            // Cache all guild roles
            for (let i = 0; i < d.roles.length; i++) {
              let role = d.roles[i];
              role.guild_id = d.id;
              _this.roles.cache(new Role(role, _this));
            }

            // Cache all users
            if (_this.#cacheAllUsers) {
              const allUsers: User[] = [];
              for (let i = 0; i < d.members.length; i++) {
                const user = d.members[i].user;
                allUsers.push(new User(user, _this));
              }

              _this.users.cache(allUsers);
            }

            // Cache all channels
            for (let i = 0; i < d.channels.length; i++) {
              const channel = d.channels[i];
              d.channels[i].guild_id = d.id;
              _this.channels.cache(new Channel(channel, _this));
            }

            // Cache guild
            _this.guilds.cache(new Guild(d, _this));
            // Emit a guildCreate event
            _this.emit("guildCreate", _this.guilds.get(d.id) as Guild);
          }
          break;
        case "GUILD_MEMBER_ADD":
          {
            const guild = _this.guilds.get(d.guild_id);
            if (guild)
              _this.guilds.get(d.guild_id).members.cache(new Member(d, _this));
            _this.users.cache(new User(d.user as APIUser, _this));
          }
          break;
        case "GUILD_MEMBER_REMOVE":
          {
            const data = d as {
              guild_id: string;
              user: APIUser;
            };
            const guild = _this.guilds.get(data.guild_id);
            if (guild)
              _this.guilds.get(data.guild_id).members.delete(data.user.id);
          }
          break;
        case "GUILD_MEMBER_UPDATE":
          {
            // Update cached member
            const data = d as APIGuildMemberEvent;
            let oldMember = _this.guilds
              .get(data.guild_id)
              .members.get(data.user.id);
            if (oldMember) {
              oldMember = oldMember._clone();
              _this.guilds
                .get(data.guild_id)
                .members.update(data.user.id, data);
              _this.emit(
                "memberUpdate",
                oldMember,
                _this.guilds.get(data.guild_id).members.get(data.user.id),
              );
            }
          }
          break;
        case "INTERACTION_CREATE":
          if (d.type === InteractionTypes.APPLICATION_COMMAND) {
            // Emit interactionCreate event with the argument according to the interaction type
            if (d.channel.type === ChannelTypes.DM) {
              const user = _this.users.get(d.user.id);
              await user.getDmChannel();
            }
            switch (d.data.type) {
              case ApplicationCommandTypes.CHAT_INPUT:
                _this.emit(
                  "interactionCreate",
                  new SlashCommandInteraction(d, _this),
                );
                break;
              case ApplicationCommandTypes.USER:
                _this.emit(
                  "interactionCreate",
                  new UserContextInteraction(d, _this),
                );
                break;
              case ApplicationCommandTypes.MESSAGE:
                _this.emit(
                  "interactionCreate",
                  new MessageContextInteraction(d, _this),
                );
                break;
            }
          } else if (d.type === InteractionTypes.MESSAGE_COMPONENT) {
            if (d.data.component_type === ComponentTypes.BUTTON) {
              const collector = _this.collectors.find(
                (a) => a.messageId === d.message.id,
              );
              if (collector) {
                collector.emit(
                  "collect",
                  d.data.component_type,
                  new ButtonInteraction(d, _this),
                );
              }
              _this.emit("interactionCreate", new ButtonInteraction(d, _this));
            } else if (d.data.component_type === ComponentTypes.STRING_SELECT) {
              const collector = _this.collectors.find(
                (a) => a.messageId === d.message.id,
              );
              if (collector) {
                collector.emit(
                  "collect",
                  d.data.component_type,
                  new StringSelectMenuInteraction(d, _this),
                );
              }
              _this.emit(
                "interactionCreate",
                new StringSelectMenuInteraction(d, _this),
              );
            }
          }
          break;
        case "GUILD_ROLE_UPDATE":
          {
            // Update the cached role
            let oldRole = _this.roles.get(d.role.id)._clone();
            _this.roles.update(d.role.id, d.role);
            _this.emit(
              "roleUpdate",
              oldRole,
              _this.roles.get(d.role.id) as Role,
              _this.guilds.get(d.guild_id) as Guild,
            );
          }
          break;
        case "CHANNEL_CREATE":
          {
            // Cache the channel
            const channel = _this.channels.cache(new Channel(d, _this));
            _this.emit("channelCreate", channel);
          }
          break;
        case "CHANNEL_DELETE":
          {
            // Remove channel from cache
            const oldChannel = _this.channels.get(d.id);
            if (oldChannel) {
              _this.channels.delete(d.id);
              _this.emit("channelDelete", oldChannel);
            }
          }
          break;
        case "GUILD_DELETE":
          {
            // Remove all cached channels that are related to the guild
            let channelIDs: string[] = [];
            for (let i = 0; i < _this.channels.length; i++) {
              const channel = _this.channels.getByIndex(i);
              if (channel.guild.id && channel.guild.id === d.id) {
                channelIDs.push(channel.id);
              }
            }
            _this._deleteChannels(channelIDs);

            // Delete the cached guild
            const oldGuild = _this.guilds.get(d.id)._clone();
            _this.guilds.delete(d.id);

            _this.emit("guildDelete", oldGuild);
          }
          break;
        case "GUILD_ROLE_CREATE":
          {
            // Update cached role
            const data = d as {
              guild_id: string;
              role: APIRole | any;
            };
            data.role.guild_id = data.guild_id;
            _this.roles.cache(new Role(data.role, _this));
            _this.emit("roleCreate", _this.roles.get(data.role.id));
          }
          break;
        case "GUILD_ROLE_DELETE":
          {
            // Remove role from cache
            const data = d as {
              guild_id: string;
              role_id: string;
            };
            const oldRole = _this.roles.get(data.role_id)._clone();
            _this.roles.delete(data.role_id);
            _this.emit("roleDelete", oldRole);
          }
          break;
        case "USER_UPDATE":
          {
            // Update cached user
            const data = d as APIUser;
            const oldUser = _this.users.get(data.id)._clone();
            _this.users.update(data.id, data);
            _this.emit("userUpdate", oldUser, _this.users.get(data.id));
          }
          break;
      }
    });
  }
}
