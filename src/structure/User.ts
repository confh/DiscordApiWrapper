import { APIUser, Client } from ".."
import { Base } from "../internal/Base"

export class User extends Base {
    public username: string
    public readonly id: string
    public displayName: string | null
    public discriminator: string | null
    public readonly bot: boolean
    public avatar: string

    constructor(data: APIUser, client: Client) {
        super(client)
        this.username = data.username
        this.id = data.id
        this.displayName = data.global_name || this.username
        this.discriminator = data.discriminator
        this.bot = data.bot
        this.avatar = data.avatar
    }

    getAvatarURL(options?: {
        size?: number,
        animated?: boolean
    }) {
        let animated = options?.animated || false
        return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${animated ? "webp" : "png"}?size=${options?.size || 512}`
    }
}