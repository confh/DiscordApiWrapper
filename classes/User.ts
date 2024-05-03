export default class User {
    public verified: boolean
    public username: string
    public mfa_enabled: boolean
    public id: string
    public displayName: string | null
    public discriminator: string | null
    public bot: boolean

    constructor(options: {
        verified: boolean,
        username: string,
        mfa_enabled: boolean,
        id: string,
        global_name: string | null,
        discriminator: string,
        bot: boolean
    }) {
        this.verified = options.verified || false
        this.username = options.username
        this.mfa_enabled = options.mfa_enabled
        this.id = options.id
        this.displayName = options.global_name || this.username
        this.discriminator = options.discriminator
        this.bot = options.bot
    }
}