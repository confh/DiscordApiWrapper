import axios from "axios";
import {
  Guild,
  Channel,
  Member,
  Message,
  User,
  wait,
  Client,
  ApplicationCommandTypes,
  BaseData,
  ContentOptions,
  JSONCache,
  JSONToFormDataWithFile,
  ApplicationCommandOptionTypes,
} from "../index";
import { Base } from "../internal/Base";
import { Routes } from "../internal/Route";

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

  get guild(): Guild {
    return this.client.guilds.get(this.guildId);
  }

  get channel(): Channel {
    return this.client.channels.get(this.#channelId);
  }

  get user(): User {
    return this.client.users.get(this.#userID);
  }

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

  async followUp(content: string | ContentOptions): Promise<Message> {
    return this.client.rest.followUpInteraction(this.token, content);
  }

  async delete(): Promise<void> {
    await this.client.rest.delete(
      Routes.DeleteInteractionMessage(this.#userID, this.token),
    );
  }
}

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
    await axios
      .post(
        this.callbackURL,
        { type: 6 },
        {
          headers: this.client.getHeaders(),
        },
      )
      .then(async (a) => {
        if (a.status === 400)
          throw new Error(a.data.message, {
            cause: "Defering reply to interaction",
          });
      });
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

  override async defer(): Promise<void> {
    this.acknowledged = true;
    await axios
      .post(
        this.callbackURL,
        { type: 6 },
        {
          headers: this.client.getHeaders(),
        },
      )
      .then(async (a) => {
        if (a.status === 400)
          throw new Error(a.data.message, {
            cause: "Defering reply to interaction",
          });
      });
  }

  async update(content: string | ContentOptions): Promise<Message> {
    this.acknowledged = true;
    const embeds: JSONCache[] = [];
    const files =
      typeof content !== "string" && content.file
        ? Array.isArray(content.file)
          ? content.file
          : [content.file]
        : null;
    const components: JSONCache[] = [];

    if (typeof content !== "string") {
      if (content.embeds && content.embeds?.length) {
        for (let i = 0; i < content.embeds.length; i++) {
          const embed = content.embeds[i];
          embeds.push(embed.toJson());
        }
      }

      if (content.components && content.components?.length) {
        for (let i = 0; i < content.components.length; i++) {
          const component = content.components[i];
          components.push(component.toJson());
        }
      }
    }
    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
      allowed_mentions: {
        parse: [],
        replied_user: true,
      },
      flags: typeof content !== "string" && content.ephemeral ? 64 : 0,
    };

    if (typeof content !== "string" && content.embeds) payload.embeds = embeds;
    if (typeof content !== "string" && content.components)
      payload.components = components;

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await axios.patch(
      `${this.client.baseURL}webhooks/${this.client.user.id}/${this.token}/messages/@original`,
      payload,
      {
        headers: this.client.getHeaders(
          files ? "multipart/form-data" : "application/json",
        ),
        validateStatus: () => true,
      },
    );
    if (data.status === 400) {
      if (data.data.retry_after !== null) {
        await wait(data.data.retry_after * 1000);
        return await this.edit(content);
      } else {
        throw new Error(data.data.message);
      }
    }

    return new Message(data.data, this.client);
  }
}

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
