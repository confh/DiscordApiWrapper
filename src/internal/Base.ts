import { Client, JSONCache } from "..";

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

  get client() {
    return this._client;
  }

  _clone(): this {
    return Object.assign(Object.create(this), this);
  }

  toJson() {
    const dict: JSONCache = {};
    for (const [k, v] of Object.entries(this)) {
      if (k !== "client") Reflect.set(dict, k, v?.id ?? v?.toJSON?.() ?? v);
    }

    return dict;
  }

  _patch(data: any) {}
}
