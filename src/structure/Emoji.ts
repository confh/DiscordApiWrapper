import { APIEmoji, Client } from "../index";
import { Base } from "../internal/Base";

/* Emoji object */
export class Emoji extends Base {
  readonly #guild_id: string;
  readonly id: string;
  readonly name: string;

  constructor(data: APIEmoji, guildID: string, client: Client) {
    super(client);
    this.#guild_id = guildID;
    this.id = data.id;
    this.name = data.name;
  }
}
