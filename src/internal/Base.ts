import { Client, JSONCache } from "../index";

/**
 * Base class for all API objects.
 */
export abstract class Base {
  public readonly id: string;
  private readonly _client: Client;

  protected constructor(client: Client) {
    Object.defineProperty(this, "_client", {
      value: client,
      configurable: false,
      enumerable: false,
    });
  }

  /**
   * Returns the client
   */
  get client(): Client {
    return this._client;
  }

  _clone(): this {
    return Object.assign(Object.create(this), this);
  }

  /**
   * Returns a JSON representation of the object.
   */
  toJson(): JSONCache {
    const dict = {};
    for (const [k, v] of Object.entries(this)) {
      if (k !== "client") Reflect.set(dict, k, v?.id ?? v?.toJSON?.() ?? v);
    }

    return dict;
  }

  _patch(data: any): void {}
}
