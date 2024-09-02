import axios from "axios";
import { Client, ContentOptions, FileContent, JSONCache, Message } from "..";
import { Routes } from "./Route";

function JSONToBlob(json: JSONCache) {
  return new Blob([JSON.stringify(json)], {
    type: "application/json",
  });
}

function JSONToFormDataWithFile(json: JSONCache, ...files: FileContent[]) {
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

async function wait(ms: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(null);
    }, ms);
  });
}

export class Rest {
  readonly #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  async delete<T>(route: string): Promise<T> {
    const request = await axios.delete(route, {
      headers: this.#client.getHeaders(),
      validateStatus: () => true,
    });

    if (request.status === 400) {
      if (request.data.retry_after !== null) {
        await wait(request.data.retry_after * 1000);
        return await this.delete(route);
      } else {
        throw new Error(request.data.message);
      }
    }

    return request.data;
  }

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

    if (request.status === 400) {
      if (request.data.retry_after !== null) {
        await wait(request.data.retry_after * 1000);
        return await this.post(route, data, formData);
      } else {
        throw new Error(request.data.message);
      }
    }

    return request.data;
  }

  async get<T>(route: string): Promise<T> {
    const request = await axios.get(route, {
      headers: this.#client.getHeaders(),
      validateStatus: () => true,
    });

    if (request.status === 400) {
      if (request.data.retry_after !== null) {
        await wait(request.data.retry_after * 1000);
        return await this.get(route);
      } else {
        throw new Error(request.data.message);
      }
    }

    return request.data;
  }

  async patch<T>(
    route: string,
    payload: JSONCache | FormData,
    formData?: boolean,
  ): Promise<T> {
    const request = await axios.patch(route, {
      headers: this.#client.getHeaders(
        formData ? "multipart/form-data" : "application/json",
      ),
      validateStatus: () => true,
    });

    if (request.status === 400) {
      if (request.data.retry_after !== null) {
        await wait(request.data.retry_after * 1000);
        return await this.patch(route, payload, formData);
      } else {
        throw new Error(request.data.message);
      }
    }

    return request.data;
  }

  async sendChannelMessage(
    content: string | ContentOptions,
    channelID: string,
  ): Promise<Message> {
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
    let payload: JSONCache | FormData = {
      content: typeof content === "string" ? content : content.content,
      embeds,
      components,
      allowed_mentions: {
        parse: [],
        replied_user: true,
      },
    };

    if (files) {
      payload = JSONToFormDataWithFile(payload, ...files);
    }

    return await this.post(Routes.SendChannelMessage(channelID), payload);
  }

  async respondToInteraction(
    type: number,
    content: string | ContentOptions,
    userID: string,
    token: string,
    id: string,
  ): Promise<Message> {
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
    let payload: JSONCache | FormData = {
      type: 4,
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

    return await this.get(Routes.OriginalMessage(userID, token));
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
    userID: string,
    token: string,
    content: string | ContentOptions,
  ): Promise<Message> {
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

    return await this.patch<Message>(
      Routes.EditInteractionMessage(userID, token),
      payload,
      Boolean(files),
    );
  }
}
