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

  static InteractionCallback(id: string, token: string): string {
    return `${this.#baseURL}/interactions/${id}/${token}/callback`;
  }

  static OriginalMessage(userID: string, token: string): string {
    return `${this.#baseURL}/webhooks/${userID}/${token}/messages/@original`;
  }

  static EditInteractionMessage(userID: string, token: string): string {
    return `${this.#baseURL}/webhooks/${userID}/${token}/messages/@original`;
  }

  static DeleteInteractionMessage(userID: string, token: string): string {
    return `${this.#baseURL}/webhooks/${userID}/${token}/messages/@original`;
  }
}
