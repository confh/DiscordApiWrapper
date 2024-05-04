interface AuthorOptions {
    name: string,
    url?: string,
    icon_url: string,
    proxy_icon_url?: string
}

interface FieldOptions {
    name: string,
    value: string,
    inline?: boolean
}

interface FooterOptions {
    text: string,
    icon_url?: string,
    proxy_icon_url?: string
}

interface ImageOptions {
    url: string,
    height?: number,
    width?: number
}

export default class EmbedBuilder {
    private author?: AuthorOptions;
    private color?: number;
    private description?: string;
    private fields?: FieldOptions[];
    private footer?: FooterOptions;
    private image?: ImageOptions;
    private thumbnail?: ImageOptions;
    private timestamp?: Date | string;
    private title?: string;
    private url?: string;

    /**
     * Set the author of the embed
     * @param options Author Options
     * @returns EmbedBuilder Object
     */
    setAuthor(options: AuthorOptions) {
        this.author = options
        return this
    }

    setTimestamp(date?: Date) {
        this.timestamp = date || new Date()
        return this
    }

    setTitle(title: string) {
        this.title = title
        return this
    }

    setColor(color: string | number) {
        if (typeof color === "number") {
            this.color = color
        } else {
            this.color = parseInt(color.replace("#", ""), 16)
        }
        return this
    }

    setDescription(desc: string) {
        this.description = desc
        return this
    }

    setThumbnail(options: ImageOptions) {
        this.thumbnail = options
        return this
    }

    setImage(options: ImageOptions) {
        this.image = options
        return this
    }

    setFooter(options: FooterOptions) {
        this.footer = options
        return this
    }

    setFields(fields: FieldOptions[]) {
        this.fields = fields
        return this
    }

    setURL(url: string) {
        this.url = url
        return this
    }

    toJson() {
        return {
            author: this.author,
            color: this.color,
            description: this.description,
            fields: this.fields,
            footer: this.footer,
            image: this.image,
            thumbnail: this.thumbnail,
            timestamp: this.timestamp,
            title: this.title,
            url: this.url
        }
    }
}