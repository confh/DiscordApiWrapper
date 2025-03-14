import axios from "axios";
import {
  Client,
  ContentOptions,
  FileContent,
  JSONCache,
  Message,
  APIMessage,
  WebhookContentOptions,
} from "../index";
import { Routes } from "./Route";

/**
 * Converts a JSON object to a Blob object.
 *
 * @param json - The JSON object to convert.
 * @returns The Blob object.
 */
function JSONToBlob(json: JSONCache) {
  return new Blob([JSON.stringify(json)], {
    type: "application/json",
  });
}

/**
 * Converts a JSONCache object to a FormData object, including any files.
 *
 * @param json - The JSONCache object to convert.
 * @param files - The files to include in the FormData object.
 * @returns The FormData object.
 */
function JSONToFormDataWithFile(
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

/**
 * Waits for a specified amount of time.
 *
 * @param ms - The amount of time to wait in milliseconds.
 * @returns A Promise that resolves after the specified time.
 */
async function wait(ms: number): Promise<unknown> {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * The REST API client for interacting with Discord's API.
 */
export class Rest {
  readonly #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  /**
   * Deletes a resource from the Discord API.
   *
   * @param route - The route to delete.
   * @returns The deleted resource.
   */
  async delete<T>(route: string): Promise<T> {
    const request = await axios.delete(route, {
      headers: this.#client.getHeaders(),
      validateStatus: () => true,
    });

    if (![200, 204].includes(request.status)) {
      if (request.data.retry_after !== undefined) {
        await wait(request.data.retry_after * 1000);
        return await this.delete(route);
      } else {
        throw new Error(request.data.message);
      }
    }

    return request.data;
  }

  /**
   * Sends a POST request to the Discord API.
   *
   * @param route - The route to send the request to.
   * @param data - The data to send with the request.
   * @param formData - Whether the data is in FormData format.
   * @returns The response data.
   */
  async post<T>(
    route: string,
    data: JSONCache | FormData,
    formData?: boolean,
  ): Promise<T> {
    const request = await axios.post(route, data, {
      headers: this.#client.getHeaders(
        formData ? "multipart/form-data" : "application/json",
      ),
      validateStatus: () => true,
    });

    if (![200, 204].includes(request.status)) {
      if (request.data.retry_after !== undefined) {
        await wait(request.data.retry_after * 1000);
        return await this.post(route, data, formData);
      } else {
        throw new Error(request.data.message);
      }
    }

    return request.data;
  }

  /**
   * Sends a GET request to the Discord API.
   *
   * @param route - The route to send the request to.
   * @returns The response data.
   */
  async get<T>(route: string): Promise<T> {
    const request = await axios.get(route, {
      headers: this.#client.getHeaders(),
      validateStatus: () => true,
    });

    if (![200, 204].includes(request.status)) {
      if (request.data.retry_after !== undefined) {
        await wait(request.data.retry_after * 1000);
        return await this.get(route);
      } else {
        throw new Error(request.data.message);
      }
    }

    return request.data;
  }

  /**
   * Sends a PATCH request to the Discord API.
   *
   * @param route - The route to send the request to.
   * @param payload - The data to send with the request.
   * @param formData - Whether the data is in FormData format.
   * @returns The response data.
   */
  async patch<T>(
    route: string,
    payload: JSONCache | FormData,
    formData?: boolean,
  ): Promise<T> {
    const request = await axios.patch(route, payload, {
      headers: this.#client.getHeaders(
        formData ? "multipart/form-data" : "application/json",
      ),
      validateStatus: () => true,
    });

    if (![200, 204].includes(request.status)) {
      if (request.data.retry_after !== undefined) {
        await wait(request.data.retry_after * 1000);
        return await this.patch(route, payload, formData);
      } else {
        throw new Error(request.data.message);
      }
    }

    return request.data;
  }

  /**
   * Sends a PUT request to the Discord API.
   *
   * @param route - The route to send the request to.
   * @param payload - The data to send with the request.
   * @param formData - Whether the data is in FormData format.
   * @returns The response data.
   */
  async put<T>(
    route: string,
    payload: JSONCache | FormData,
    formData?: boolean,
  ): Promise<T> {
    const request = await axios.put(route, payload, {
      headers: this.#client.getHeaders(
        formData ? "multipart/form-data" : "application/json",
      ),
      validateStatus: () => true,
    });

    if (![200, 204].includes(request.status)) {
      if (request.data.retry_after !== undefined) {
        await wait(request.data.retry_after * 1000);
        return await this.put(route, payload, formData);
      } else {
        throw new Error(request.data.message);
      }
    }

    return request.data;
  }

  private contentToFilesEmbedsComponents(
    content: string | ContentOptions,
  ): [any[], any[], FileContent[] | null] {
    const embeds: any = [];
    const components: any[] = [];
    const files =
      typeof content !== "string" && content.file
        ? Array.isArray(content.file)
          ? content.file
          : [content.file]
        : null;

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

    return [embeds, components, files];
  }

  async sendChannelMessage(
    content: string | ContentOptions,
    channelID: string,
  ): Promise<Message> {
    const [embeds, components, files] =
      this.contentToFilesEmbedsComponents(content);

    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
      embeds,
      components,
      allowed_mentions: {
        parse: ["users"],
        replied_user: true,
      },
    };

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await this.post<APIMessage>(
      Routes.SendChannelMessage(channelID),
      payload,
      Boolean(files)
    );

    return new Message(data, this.#client);
  }

  async sendReplyChannelMessage(
    content: string | ContentOptions,
    channelID: string,
    referenced_message_id: string,
    referenced_message_guildID: string,
  ): Promise<Message> {
    const [embeds, components, files] =
      this.contentToFilesEmbedsComponents(content);

    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
      embeds,
      components,
      message_reference: {
        message_id: referenced_message_id,
        channel_id: channelID,
        guild_Id: referenced_message_guildID,
      },
      allowed_mentions: {
        parse: ["users"],
        replied_user: true,
      },
    };

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await this.post<APIMessage>(
      Routes.SendChannelMessage(channelID),
      payload,
      Boolean(files)
    );

    return new Message(data, this.#client);
  }

  async respondToInteraction(
    type: number,
    content: string | ContentOptions,
    token: string,
    id: string,
  ): Promise<Message> {
    const [embeds, components, files] =
      this.contentToFilesEmbedsComponents(content);

    let payload: JSONCache | FormData = {
      type,
      data: {
        content: typeof content === "string" ? content : content.content,
        embeds,
        components,
        allowed_mentions: {
          parse: [],
          replied_user: true,
        },
        flags: typeof content !== "string" && content.ephemeral ? 64 : 0,
      },
    };

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    await this.post(
      Routes.InteractionCallback(id, token),
      payload,
      Boolean(files),
    );

    const data = await this.get<APIMessage>(
      Routes.OriginalMessage(this.#client.user.id, token),
    );

    return new Message(data, this.#client);
  }

  async deferInteraction(
    id: string,
    token: string,
    options?: { ephemeral?: boolean },
  ): Promise<void> {
    const request = await this.post(Routes.InteractionCallback(id, token), {
      type: 5,
      data: {
        flags: options?.ephemeral ? 64 : 0,
      },
    });
  }

  async editInteractionMessage(
    token: string,
    content: string | ContentOptions,
  ): Promise<Message> {
    const [embeds, components, files] =
      this.contentToFilesEmbedsComponents(content);

    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
      allowed_mentions: {
        parse: ["users"],
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

    const data = await this.patch<APIMessage>(
      Routes.OriginalMessage(this.#client.user.id, token),
      payload,
      Boolean(files),
    );

    return new Message(data, this.#client);
  }

  async followUpInteraction(
    token: string,
    content: string | ContentOptions,
  ): Promise<Message> {
    const [embeds, components, files] =
      this.contentToFilesEmbedsComponents(content);

    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
      embeds,
      components,
      allowed_mentions: {
        parse: ["users"],
        replied_user: true,
      },
      flags: typeof content !== "string" && content.ephemeral ? 64 : 0,
    };

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await this.post<APIMessage>(
      Routes.InteractionFollowUp(this.#client.user.id, token),
      payload,
      Boolean(files),
    );

    return new Message(data, this.#client);
  }

  async updateInteraction(
    token: string,
    id: string,
    content: string | ContentOptions,
  ): Promise<void> {
    const [embeds, components, files] =
      this.contentToFilesEmbedsComponents(content);

    let payload: JSONCache | FormData = {
      type: 7,
      data: {
        content: typeof content === "string" ? content : content.content,
        embeds,
        components,
        allowed_mentions: {
          parse: [],
          replied_user: true,
        },
        flags: typeof content !== "string" && content.ephemeral ? 64 : 0,
      },
    };

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    await this.post(
      Routes.InteractionCallback(id, token),
      payload,
      Boolean(files),
    );
  }

  async editMessage(
    messageID: string,
    channelID: string,
    content: string | ContentOptions,
  ): Promise<Message> {
    const [embeds, components, files] =
      this.contentToFilesEmbedsComponents(content);

    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
    };

    if (typeof content !== "string" && content.embeds) payload.embeds = embeds;
    if (typeof content !== "string" && content.components)
      payload.components = components;

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await this.patch<APIMessage>(
      Routes.EditChannelMessage(channelID, messageID),
      payload,
      Boolean(files)
    );

    return new Message(data, this.#client);
  }

  async sendWebhookMessage(
    content: string | WebhookContentOptions,
    webhookID: string,
    webhookToken: string,
  ): Promise<Message> {
    const [embeds, components, files] =
      this.contentToFilesEmbedsComponents(content);

    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
      embeds,
      components,
      allowed_mentions: {
        parse: ["users"],
        replied_user: true,
      },
    };

    if (typeof content !== "string" && content.username)
      payload.username = content.username;

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    const data = await this.post<APIMessage>(
      Routes.ChannelWebhookSendMessage(webhookID, webhookToken),
      payload,
      Boolean(files),
    );

    return new Message(data, this.#client);
  }

  async updateStringSelectMenuEmbed(
    content: string | ContentOptions,
    token: string,
  ): Promise<Message> {
    const [embeds, components, files] =
      this.contentToFilesEmbedsComponents(content);

    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
      allowed_mentions: {
        parse: ["users"],
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

    const data = await this.patch<APIMessage>(
      Routes.OriginalMessage(this.#client.user.id, token),
      payload,
      Boolean(files),
    );

    return new Message(data, this.#client);
  }
}
