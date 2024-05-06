export class User {
    public verified: boolean
    public username: string
    public mfa_enabled: boolean
    public id: string
    public displayName: string | null
    public discriminator: string | null
    public bot: boolean
    public avatar: string

    constructor(options: {
        verified: boolean,
        username: string,
        mfa_enabled: boolean,
        id: string,
        global_name: string | null,
        discriminator: string,
        bot: boolean,
        avatar: string
    }) {
        this.verified = options.verified || false
        this.username = options.username
        this.mfa_enabled = options.mfa_enabled
        this.id = options.id
        this.displayName = options.global_name || this.username
        this.discriminator = options.discriminator
        this.bot = options.bot
        this.avatar = options.avatar
    }

    getAvatarURL(options?: {
        size?: number,
        animated?: boolean
    }) {
        let animated = options?.animated || false
        return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${animated ? "webp" : "png"}?size=${options?.size || 512}`
    }
}