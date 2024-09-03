import {
  Guild,
  Channel,
  Member,
  Message,
  User,
  Client,
  ApplicationCommandTypes,
  BaseData,
  ContentOptions,
  ApplicationCommandOptionTypes,
} from "../index";
import { Base } from "../internal/Base";
import { Routes } from "../internal/Route";

/** Interaction object */
export class Interaction extends Base {
  #channelId: string;
  #userID: string;
  readonly token: string;
  readonly callbackURL: string;
  readonly interaction_id: string;
  readonly name: string;
  readonly id: string;
  readonly guildId: string;
  readonly description?: string;
  readonly type: ApplicationCommandTypes;
  acknowledged: boolean = false;

  constructor(data: BaseData, client: Client) {
    super(client);
    this.interaction_id = data.id;
    this.token = data.token;
    this.name = data.data.name;
    this.id = data.data.id;
    this.guildId = data.guild_id;
    if (data.member) this.#userID = data.member.user.id;
    else this.#userID = data.user.id;
    this.description = data.description;
    this.type = data.type;
    this.#channelId = data.channel_id;
    this.callbackURL = `${client.baseURL}interactions/${this.interaction_id}/${this.token}/callback`;
  }

  /**
   * Get the guild of the interaction
   * @returns A guild object
   */
  get guild(): Guild {
    return this.client.guilds.get(this.guildId);
  }

  /**
   * Get the channel of the interaction
   * @returns A channel object
   */
  get channel(): Channel {
    return this.client.channels.get(this.#channelId);
  }

  /**
   * Get the user of the interaction
   * @returns A user object
   */
  get user(): User {
    return this.client.users.get(this.#userID);
  }

  /**
   * Get the member of the interaction
   * @returns A member object
   */
  get member(): Member | null {
    return (
      this.client.guilds.get(this.guildId).members.get(this.#userID) ?? null
    );
  }

  /**
   * Retrieves the original message sent through the webhook.
   *
   * @return {Promise<Message>} The original message as a `Message` object.
   * @throws {Error} If the request fails with a 400 status code.
   */
  async getOriginalMessage(): Promise<Message> {
    return await this.client.rest.get(
      Routes.OriginalMessage(this.client.user.id, this.token),
    );
  }

  /**
   * Sends a reply message to the interaction.
   *
   * @param {string | ContentOptions} content - The content of the message. It can be a string or an object with optional properties like embeds, components, and file.
   * @return {Promise<Message>} A promise that resolves to the sent message as a `Message` object.
   * @throws {Error} If the request fails with a 400 status code.
   */
  async reply(content: string | ContentOptions): Promise<Message> {
    this.acknowledged = true;
    return await this.client.rest.respondToInteraction(
      4,
      content,
      this.token,
      this.interaction_id,
    );
  }

  /**
   * Defer the reply to an interaction.
   *
   * @param {Object} options - Optional parameters for the deferral.
   * @param {boolean} options.ephemeral - Whether the reply should be ephemeral.
   * @return {Promise<void>} - A promise that resolves when the deferral is complete.
   */
  async defer(options?: { ephemeral?: boolean }): Promise<void> {
    this.acknowledged = true;
    await this.client.rest.deferInteraction(
      this.interaction_id,
      this.token,
      options,
    );
  }

  /**
   * Edits the message with the given content.
   *
   * @param {string | ContentOptions} content - The content to edit the message with. It can be a string or an object with properties like content, embeds, components, ephemeral, and file.
   * @return {Promise<Message>} A promise that resolves to the edited message.
   * @throws {Error} If there is an error editing the message.
   */
  async edit(content: string | ContentOptions): Promise<Message> {
    return await this.client.rest.editInteractionMessage(this.token, content);
  }

  /**
   * Sends a follow up with the given content
   *
   * @param content - The content to send a follow up with
   * @return {Promise<Message>} A promise that resolves to the sent message.
   * @throws {Error} If there is an error sending a follow up.
   */
  async followUp(content: string | ContentOptions): Promise<Message> {
    return this.client.rest.followUpInteraction(this.token, content);
  }

  /**
   * Delete the interaction message
   */
  async delete(): Promise<void> {
    await this.client.rest.delete(
      Routes.OriginalMessage(this.#userID, this.token),
    );
  }
}

/** Slash command interaction object */
export class SlashCommandInteraction extends Interaction {
  options?: {
    value: string;
    type: ApplicationCommandOptionTypes;
    name: string;
  }[];
  resolved?: any;

  constructor(data: BaseData, client: Client) {
    super(data, client);
    this.options = data.data.options;
    this.resolved = data.data.resolved;
  }

  /**
   * Get the string option
   * @param name Name of the option
   * @returns Option data
   */
  getString(name: string): {
    value: string;
    type: ApplicationCommandOptionTypes;
    name: string;
  } {
    if (this.options) {
      return this.options.find(
        (a) =>
          a.type === ApplicationCommandOptionTypes.STRING && a.name === name,
      );
    } else return null;
  }

  /**
   * Get the boolean option
   * @param name Name of the option
   * @returns Option data
   */
  getBoolean(name: string): {
    value: string;
    type: ApplicationCommandOptionTypes;
    name: string;
  } {
    if (this.options) {
      return this.options.find(
        (a) =>
          a.type === ApplicationCommandOptionTypes.BOOLEAN && a.name === name,
      );
    } else return null;
  }

  /**
   * Get the integer option
   * @param name Name of the option
   * @returns Option data
   */
  getNumber(name: string): {
    value: string;
    type: ApplicationCommandOptionTypes;
    name: string;
  } {
    if (this.options) {
      return this.options.find(
        (a) =>
          a.type === ApplicationCommandOptionTypes.INTEGER && a.name === name,
      );
    } else return null;
  }

  /**
   * Get the attachment option
   * @param name Name of the option
   * @returns Option data
   */
  getAttachment(name: string): {
    width: number;
    url: string;
    size: number;
    proxy_url: string;
    placeholder_version: number;
    placeholder: string;
    id: string;
    height: number;
    filename: string;
    ephemeral: boolean;
    content_type: string;
  } {
    const attachmentId = this.options.find(
      (a) =>
        a.type === ApplicationCommandOptionTypes.ATTACHMENT && a.name === name,
    );
    if (!attachmentId) return undefined;
    return this.resolved.attachments[attachmentId.value] as {
      width: number;
      url: string;
      size: number;
      proxy_url: string;
      placeholder_version: number;
      placeholder: string;
      id: string;
      height: number;
      filename: string;
      ephemeral: boolean;
      content_type: string;
    };
  }
}

/** Button interaction object */
export class ButtonInteraction extends Interaction {
  readonly message: Message;
  readonly custom_id: string;

  constructor(data: BaseData, client: Client) {
    super(data, client);
    this.message = new Message(data.message, client);
    this.custom_id = data.data.custom_id;
  }

  /**
   * Defer the interaction by sending a response with a type of 6.
   *
   * @return {Promise<void>} A promise that resolves when the defer request is successful.
   * @throws {Error} If the defer request returns a status of 400.
   */
  override async defer(): Promise<void> {
    this.acknowledged = true;
    await this.client.rest.post(
      Routes.InteractionCallback(this.interaction_id, this.token),
      {
        type: 6,
      },
    );
  }

  /**
   * Updates the content of a message with embeds, components, and files.
   *
   * @param {string | ContentOptions} content - The new content of the message or options for the message.
   * @return {Promise<Message>} A promise that resolves to the updated message.
   */
  async update(content: string | ContentOptions): Promise<Message> {
    this.acknowledged = true;
    return this.client.rest.updateInteraction(this.token, content);
  }
}

/** String select menu interaction */
export class StringSelectMenuInteraction extends Interaction {
  readonly data: {
    component_type: number;
    custom_id: string;
    values: string[];
  };

  constructor(data: BaseData, client: Client) {
    super(data, client);
    this.data = data.data;
  }

  /**
   * Defer the interaction by sending a response with a type of 6.
   *
   * @return {Promise<void>} A promise that resolves when the defer request is successful.
   * @throws {Error} If the defer request returns a status of 400.
   */
  override async defer(): Promise<void> {
    this.acknowledged = true;
    await this.client.rest.post(
      Routes.InteractionCallback(this.interaction_id, this.token),
      {
        type: 6,
      },
    );
  }

  /**
   * Updates the content of a message with embeds, components, and files.
   *
   * @param {string | ContentOptions} content - The new content of the message or options for the message.
   * @return {Promise<Message>} A promise that resolves to the updated message.
   */
  async update(content: string | ContentOptions): Promise<Message> {
    this.acknowledged = true;
    return await this.client.rest.updateStringSelectMenuEmbed(
      content,
      this.token,
    );
  }
}

/** Message context interaction */
export class MessageContextInteraction extends Interaction {
  readonly target_id: string;
  readonly message: Message;

  constructor(data: BaseData, client: Client) {
    super(data, client);
    this.target_id = data.data.target_id;
    data.data.resolved.messages[this.target_id].guild_id = this.guildId;
    this.message = new Message(
      data.data.resolved.messages[this.target_id],
      client,
    );
  }
}

/** User context interaction */
export class UserContextInteraction extends Interaction {
  readonly target_id: string;
  readonly target: {
    user?: User;
    member?: Member;
  } = {
    user: undefined,
    member: undefined,
  };

  constructor(data: BaseData, client: Client) {
    super(data, client);
    this.target_id = data.data.target_id;
    this.target.user =
      client.users.get(this.target_id) ||
      new User(data.data.resolved.users[this.target_id], this.client);
    this.target.member =
      this.guild.members.get(this.target_id) ||
      new Member(data.data.resolved.members[this.target_id], client);
  }
}
