export abstract class Routes {
  static readonly #baseURL = "https://discord.com/api/v10/";

  static MessageDelete(channelID: string, messageID: string): string {
    return `${this.#baseURL}/channels/${channelID}/messages/${messageID}`;
  }

  static ChannelTyping(channelID: string): string {
    return `${this.#baseURL}/channels/${channelID}/typing`;
  }

  static SendChannelMessage(channelID: string): string {
    return `${this.#baseURL}/channels/${channelID}/messages`;
  }

  static EditChannelMessage(channelID: string, messageID: string): string {
    return `${this.#baseURL}/channels/${channelID}/messages/${messageID}`;
  }

  static InteractionCallback(id: string, token: string): string {
    return `${this.#baseURL}/interactions/${id}/${token}/callback`;
  }

  static OriginalMessage(botID: string, token: string): string {
    return `${this.#baseURL}/webhooks/${botID}/${token}/messages/@original`;
  }

  static EditInteractionMessage(botID: string, token: string): string {
    return `${this.#baseURL}/webhooks/${botID}/${token}/messages/@original`;
  }

  static DeleteInteractionMessage(botID: string, token: string): string {
    return `${this.#baseURL}/webhooks/${botID}/${token}/messages/@original`;
  }

  static InteractionFollowUp(botID: string, token: string): string {
    return `${this.#baseURL}/webhooks/${botID}/${token}`;
  }

  static InteractionUpdate(botID: string, token: string): string {
    return `${this.#baseURL}/webhooks/${botID}/${token}/messages/@original`;
  }

  static DMChannel(): string {
    return `${this.#baseURL}/users/@me/channels`;
  }

  static GuildRoute(guildID: string): string {
    return `${this.#baseURL}/users/@me/guilds/${guildID}`;
  }

  static GuildBan(guildID: string, memberID: string): string {
    return `${this.#baseURL}/guilds/${guildID}/bans/${memberID}`;
  }
}
