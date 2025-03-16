import axios from "axios";
import WebSocket from "ws";
import { Manager } from "./internal/Manager";
import { ActionRowBuilder, EmbedBuilder } from "./structure/Builders";
import { Channel } from "./structure/Channel";
import { Collector, ModalCollector } from "./structure/Collector";
import { Guild } from "./structure/Guild";
import {
  ButtonInteraction,
  Interaction,
  MessageContextInteraction,
  ModalInteraction,
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

export type Snowflake = string;

/**
 * Guild Member Event Object
 */
export interface APIGuildMemberEvent extends APIMember {
  guild_id: string;
}

/** Enum for types of webhook */
export enum WebhookTypes {
  INCOMING = 1,
  CHANNEL_FOLLOWER,
  APPLICATION,
}

/** Enum for types of interaction contexts */
export enum InteractionContextTypes {
  GUILD,
  BOT_DM,
  PRIVATE_CHANNEL
}

/** Enum for types of interaction integration */
export enum InteractionIntegrationTypes {
  GUILD_INSTALL,
  USER_INSTALL
}

/** Enum for types of message */
export enum APIMessageTypes {
  DEFAULT = 0,
  RECIPIENT_ADD = 1,
  RECIPIENT_REMOVE = 2,
  CALL = 3,
  CHANNEL_NAME_CHANGE = 4,
  CHANNEL_ICON_CHANGE = 5,
  CHANNEL_PINNED_MESSAGE = 6,
  USER_JOIN = 7,
  GUILD_BOOST = 8,
  GUILD_BOOST_TIER_1 = 9,
  GUILD_BOOST_TIER_2 = 10,
  GUILD_BOOST_TIER_3 = 11,
  CHANNEL_FOLLOW_ADD = 12,
  GUILD_DISCOVERY_DISQUALIFIED = 14,
  GUILD_DISCOVERY_REQUALIFIED = 15,
  GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING = 16,
  GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING = 17,
  THREAD_CREATED = 18,
  REPLY = 19,
  CHAT_INPUT_COMMAND = 20,
  THREAD_STARTER_MESSAGE = 21,
  GUILD_INVITE_REMINDER = 22,
  CONTEXT_MENU_COMMAND = 23,
  AUTO_MODERATION_ACTION = 24,
  ROLE_SUBSCRIPTION_PURCHASE = 25,
  INTERACTION_PREMIUM_UPSELL = 26,
  STAGE_START = 27,
  STAGE_END = 28,
  STAGE_SPEAKER = 29,
  STAGE_TOPIC = 31,
  GUILD_APPLICATION_PREMIUM_SUBSCRIPTION = 32,
  GUILD_INCIDENT_ALERT_MODE_ENABLED = 36,
  GUILD_INCIDENT_ALERT_MODE_DISABLED = 37,
  GUILD_INCIDENT_REPORT_RAID = 38,
  GUILD_INCIDENT_REPORT_FALSE_ALARM = 39,
  PURCHASE_NOTIFICATION = 44,
  POLL_RESULT = 46,
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

export interface AvatarDecoration {
  asset: string;
  sku_id: Snowflake;
}

interface CommandData extends BaseData {
  name: string;
  description: string;
  guild_id?: string
}

/** User Object */
export interface APIUser extends BaseData {
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  avatar_decoration_data?: AvatarDecoration | null;
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
export interface APIMessageAttachment extends BaseData {
  filename: string;
  size: number;
  url: string;
  proxy_url: string;
  content_type?: string;
}

/** Embed Object */
export interface APIEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  footer?: {
    text: string
    icon_url?: string
    proxy_icon_url?: string
  }
  image?: {
    url: string
    proxy_url?: string
    height?: number
    width: number
  }
  thumbnail?: {
    url: string
    proxy_url?: string
    height?: number
    width: number
  }
  author?: {
    name: string
    url?: string
    icon_url?: string
    proxy_icon_url?: string
  }
  fields?: {
    name: string
    value: string
    inline?: boolean
  }[]
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
  embeds: APIEmbed[];
  message_snapshots?: APIMessageSnapshot[];
}

export interface APIMessageSnapshotPartial
  extends Pick<
    APIMessage,
    | "type"
    | "content"
    | "embeds"
    | "attachments"
    | "timestamp"
    | "edited_timestamp"
    | "mentions"
    | "mention_roles"
  > { }

export interface APIMessageSnapshot {
  message: APIMessageSnapshotPartial;
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

/** Application Command Interaction Data Options */
export interface APIApplicationCommandOptionsData {
  name: string;
  type: ApplicationCommandOptionTypes;
  value?: string | number | boolean;
  options?: APIApplicationCommandOptionsData[];
  focused?: boolean;
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
  channelUpdate: [oldChannel: Channel, newChannel: Channel];
  userUpdate: [oldUser: User, newUser: User];
  webhookMessageCreate: [message: WebhookMessage];
}

/** Emoji Object */
export interface APIEmoji {
  id: string;
  name: string;
  roles?: string[];
  user?: User;
  require_colons?: boolean;
  managed?: boolean;
  animated?: boolean;
  available?: boolean;
}

/**
 * Partial Emoji object, this object is used for when only the ID, name, and animated status are needed.
 */
export type PartialEmoji = Omit<
  APIEmoji,
  "available" | "animated" | "managed" | "require_colons" | "user" | "roles"
>;

/**
 * Base data object for all objects.
 */
export interface BaseData {
  id: string;
  [key: string]: any;
}

/**
 * Enum for types of application commands
 */
export enum ApplicationCommandTypes {
  CHAT_INPUT = 1,
  USER,
  MESSAGE,
}

/**
 * Enum for types of interactions
 */
export enum InteractionTypes {
  PING = 1,
  APPLICATION_COMMAND,
  MESSAGE_COMPONENT,
  APPLICATION_COMMAND_AUTOCOMPLETE,
  MODAL_SUBMIT
}

/**
 * Enum for types of components
 */
export enum ComponentTypes {
  ACTION_ROW = 1,
  BUTTON,
  STRING_SELECT,
  TEXT_INPUT,
}

/**
 * Enum for types of button styles
 */
export enum ButtonStyles {
  PRIMARY = 1,
  SECONDARY,
  SUCCESS,
  DANGER,
  LINK,
}

/**
 * Enum for types of activity
 */
export enum ActivityTypes {
  GAME,
  STREAMING,
  LISTENING,
  WATCHING,
  CUSTOM,
  COMPETING,
}

/**
 * Enum for types of application command options
 */
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

/**
 * Enum for types of channels
 */
export enum ChannelTypes {
  TEXT,
  DM,
  CATEGORY = 4,
}

export enum OverwriteObjectTypes {
  ROLE,
  MEMBER,
}

/**
 * File content object
 */
export interface FileContent {
  name: string;
  buffer: Buffer;
}

/**
 * Options for sending a message
 */
export interface ContentOptions {
  content?: string;
  embeds?: EmbedBuilder[];
  components?: ActionRowBuilder<any>[];
  ephemeral?: boolean;
  file?: FileContent | FileContent[];
  poll?: PollRequestObject;
}

/**
 * Options for sending a message to a webhook
 */
export interface WebhookContentOptions extends ContentOptions {
  username?: string;
  avatar_url?: string;
}

/**
 * Poll media object, this object is used for the question and answers of a poll.
 */
export interface PollMediaObject {
  text: string;
  emoji?: PartialEmoji;
}

/**
 * Poll request object, this object is used for creating a poll.
 */
export interface PollRequestObject {
  question: PollMediaObject;
  answers: {
    answer_id: number;
    poll_media: PollMediaObject;
  }[];
  duration: number;
  allow_multiselect: boolean;
}

/**
 * JSON Cache object, this object is used for caching data from the discord API.
 */
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
 * Discord Client
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
  #intents = 0;
  #commands: CommandData[] = [];
  readonly #initialUrl = "wss://gateway.discord.gg";
  #url = this.#initialUrl;
  readonly #cacheAllUsers: boolean;
  readonly #token: string;
  public shards: number;
  public readonly users: Manager<User> = new Manager();
  public readonly guilds: Manager<Guild> = new Manager();
  public readonly channels: Manager<Channel> = new Manager();
  public readonly roles: Manager<Role> = new Manager();
  public readonly rest: Rest;
  public collectors: Collector[] = [];
  public modalCollectors: ModalCollector[] = [];
  public logger: {
    info: (...args: any[]) => any;
    error: (...args: any[]) => any;
  } = console;
  public readonly baseURL = "https://discord.com/api/v10/";

  get commands(): CommandData[] {
    return this.#commands
  }

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

  /**
   * The ping of the bot, this is the time it takes for the bot to receive a heartbeat ack from discord.
   * @returns {number} The ping of the bot in milliseconds.
   */
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
   * Create a new Discord client
   * @param token The bot token to use
   * @param options Options for the client
   */
  constructor(
    token: string,
    options?: {
      cacheAllUsers?: boolean;
      intents?: Intents[];
      shards?: "auto" | number;
    },
  ) {
    process.on("SIGINT", () => {
      this.disconnect();
      process.exit();
    });
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

  /**
   * Define the payload for the websocket connection, this will be used to connect to the discord gateway.
   */
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

  /**
   * Register shards for the bot
   */
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

  /**
   * Register a channel from the Discord API.
   * @param channelID The ID of the channel to register.
   */
  async registerChannelFromAPI(channelID: string) {
    const data = await axios.get(`${this.baseURL}channels/${channelID}`, {
      headers: this.getHeaders(),
      validateStatus: () => true,
    });

    if (data.status === 400) return;

    this.channels.cache(new Channel(data.data, this));
  }

  /**
   * Emit an event, this will call all listeners for the event.
   * @param event Event to emit
   * @param args Arguments to pass to the event listeners
   */
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

    this.#commands = data.data

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

    this.#commands = data.data

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
   * @param channelID The id of the channel the message is in
   * @param messageID The id of the message
   * @returns A {@link Message} object
   */
  async getMessage(channelID: string, messageID: string): Promise<Message> {
    const data = await axios.get(
      `${this.baseURL}/channels/${channelID}/messages/${messageID}`,
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
   * @param channelID The id of the channel
   * @returns A {@link Channel} object
   */
  getChannel(channelID: string): Channel {
    return this.channels.get(channelID);
  }

  /**
   * Delete channels from the cache
   * @param id The ID of the channel or an array of channel IDs to delete
   */
  private _deleteChannels(id: string | string[]) {
    const IDs = Array.isArray(id) ? id : [id];
    for (let i = 0; i < IDs.length; i++) {
      const id = IDs[i];
      this.channels.delete(id);
    }
  }

  private _deleteRoles(id: string | string[]) {
    const IDs = Array.isArray(id) ? id : [id];
    for (let i = 0; i < IDs.length; i++) {
      const id = IDs[i];
      this.roles.delete(id);
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
        // Connection Events
        case "READY": {
          _this.#readyTimestamp = Date.now();
          _this.#url = d.resume_gateway_url;
          _this.#session_id = d.session_id;
          _this.users.cache(new User(d.user, _this));
          setTimeout(() => {
            _this.#isReady = true;
            _this.emit("ready");
          }, 500);
          break;
        }

        case "RESUMED": {
          _this.emit("resume");
          break;
        }

        // Message Events
        case "MESSAGE_CREATE": {
          if (![MessageTypes.DEFAULT, MessageTypes.REPLY].includes(d.type)) return;

          if (!_this.channels.get(d.channel_id)) {
            await _this.registerChannelFromAPI(d.channel_id);
          }

          if (d.author && !d.webhook_id) {
            _this.emit("messageCreate", new Message(d, _this));
          } else if (d.author && d.webhook_id) {
            _this.emit("webhookMessageCreate", new WebhookMessage(d, _this));
          }
          break;
        }

        case "MESSAGE_UPDATE": {
          if (![MessageTypes.DEFAULT, MessageTypes.REPLY].includes(d.type)) return;
          if (d.author) {
            _this.emit("messageUpdate", new Message(d, _this));
          }
          break;
        }

        case "MESSAGE_DELETE": {
          _this.emit("messageDelete", {
            id: d.id,
            channel_id: d.channel_id,
          });
          break;
        }

        // Guild Events
        case "GUILD_CREATE": {
          // Cache roles
          for (let i = 0; i < d.roles.length; i++) {
            let role = d.roles[i];
            role.guild_id = d.id;
            _this.roles.cache(new Role(role, _this));
          }

          // Cache users if enabled
          if (_this.#cacheAllUsers) {
            const allUsers = d.members.map(member =>
              new User(member.user, _this)
            );
            _this.users.cache(allUsers);
          }

          // Cache channels
          for (const channel of d.channels) {
            channel.guild_id = d.id;
            _this.channels.cache(new Channel(channel, _this));
          }

          // Cache and emit guild
          _this.guilds.cache(new Guild(d, _this));
          _this.emit("guildCreate", _this.guilds.get(d.id) as Guild);
          break;
        }

        case "GUILD_DELETE": {
          const guild = _this.guilds.get(d.id);
          if (!guild) break;

          // Remove guild channels
          const channelIDs = _this.channels
            .filter(channel => channel.guild.id === d.id)
            .map(channel => channel.id);
          _this._deleteChannels(channelIDs);

          // Remove guild roles
          const roleIDs = _this.roles
            .filter(role => role.guild_id === d.id)
            .map(role => role.id);
          _this._deleteRoles(roleIDs);

          // Remove and emit guild
          const oldGuild = guild._clone();
          _this.guilds.delete(d.id);
          _this.emit("guildDelete", oldGuild);
          break;
        }

        // Member Events
        case "GUILD_MEMBER_ADD": {
          const guild = _this.guilds.get(d.guild_id);
          if (guild) {
            guild.members.cache(new Member(d, _this));
          }
          _this.users.cache(new User(d.user as APIUser, _this));
          break;
        }

        case "GUILD_MEMBER_REMOVE": {
          const data = d as { guild_id: string; user: APIUser };
          const guild = _this.guilds.get(data.guild_id);
          if (guild) {
            guild.members.delete(data.user.id);
          }
          break;
        }

        case "GUILD_MEMBER_UPDATE": {
          const data = d as APIGuildMemberEvent;
          const guild = _this.guilds.get(data.guild_id);
          const member = guild?.members.get(data.user.id);

          if (member) {
            const oldMember = member._clone();
            guild.members.update(data.user.id, data);
            _this.emit(
              "memberUpdate",
              oldMember,
              guild.members.get(data.user.id)
            );
          }
          break;
        }

        // Interaction Events
        case "INTERACTION_CREATE": {
          if (d.type === InteractionTypes.APPLICATION_COMMAND) {
            if (d.channel.type === ChannelTypes.DM) {
              const user = _this.users.get(d.user.id);
              await user.getDmChannel();
            }

            switch (d.data.type) {
              case ApplicationCommandTypes.CHAT_INPUT:
                _this.emit("interactionCreate", new SlashCommandInteraction(d, _this));
                break;
              case ApplicationCommandTypes.USER:
                _this.emit("interactionCreate", new UserContextInteraction(d, _this));
                break;
              case ApplicationCommandTypes.MESSAGE:
                _this.emit("interactionCreate", new MessageContextInteraction(d, _this));
                break;
            }
          }
          else if (d.type === InteractionTypes.MESSAGE_COMPONENT) {
            const collector = _this.collectors.find(a => a.messageID === d.message.id);

            if (d.data.component_type === ComponentTypes.BUTTON) {
              const interaction = new ButtonInteraction(d, _this);
              if (collector) {
                if (!collector.filter || collector.filter(interaction)) {
                  collector.emit("collect", d.data.component_type, interaction);
                }
              }
              _this.emit("interactionCreate", interaction);
            }
            else if (d.data.component_type === ComponentTypes.STRING_SELECT) {
              const interaction = new StringSelectMenuInteraction(d, _this);
              if (collector) {
                collector.emit("collect", d.data.component_type, interaction);
              }
              _this.emit("interactionCreate", interaction);
            }
          }
          else if (d.type === InteractionTypes.MODAL_SUBMIT) {
            const interaction = new ModalInteraction(d, _this);
            const collector = _this.modalCollectors.find(
              a => a.customID === interaction.data.custom_id
            );

            if (collector && (!collector.filter || collector.filter(interaction))) {
              collector.emit("collect", interaction);
            }
            _this.emit("interactionCreate", interaction);
          }
          break;
        }

        // Role Events
        case "GUILD_ROLE_CREATE": {
          const data = d as { guild_id: string; role: APIRole };
          data.role.guild_id = data.guild_id;
          _this.roles.cache(new Role(data.role, _this));
          _this.emit("roleCreate", _this.roles.get(data.role.id));
          break;
        }

        case "GUILD_ROLE_UPDATE": {
          const oldRole = _this.roles.get(d.role.id)._clone();
          _this.roles.update(d.role.id, d.role);
          _this.emit(
            "roleUpdate",
            oldRole,
            _this.roles.get(d.role.id) as Role,
            _this.guilds.get(d.guild_id) as Guild
          );
          break;
        }

        case "GUILD_ROLE_DELETE": {
          const data = d as { guild_id: string; role_id: string };
          const oldRole = _this.roles.get(data.role_id)._clone();
          _this.roles.delete(data.role_id);
          _this.emit("roleDelete", oldRole);
          break;
        }

        // Channel Events
        case "CHANNEL_CREATE": {
          const channel = _this.channels.cache(new Channel(d, _this));
          _this.emit("channelCreate", channel);
          break;
        }

        case "CHANNEL_UPDATE": {
          const oldChannel = _this.channels.get(d.id)._clone();
          _this.channels.update(d.id, d);
          _this.emit("channelUpdate", oldChannel, _this.channels.get(d.id));
          break;
        }

        case "CHANNEL_DELETE": {
          const oldChannel = _this.channels.get(d.id);
          if (oldChannel) {
            _this.channels.delete(d.id);
            _this.emit("channelDelete", oldChannel);
          }
          break;
        }

        // User Events
        case "USER_UPDATE": {
          const data = d as APIUser;
          const oldUser = _this.users.get(data.id)._clone();
          _this.users.update(data.id, data);
          _this.emit("userUpdate", oldUser, _this.users.get(data.id));
          break;
        }
      }
    });
  }

  /**
   * Creates a collector for modal submissions
   * @param customID The custom ID of the modal to collect
   * @param options Collector options
   * @returns A modal collector object
   */
  createModalCollector(
    customID: string,
    options?: {
      timeout?: number;
      filter?: (i: ModalInteraction) => boolean;
    }
  ): ModalCollector {
    const collector = new ModalCollector(customID, this, options);
    this.modalCollectors.push(collector);
    return collector;
  }
}
