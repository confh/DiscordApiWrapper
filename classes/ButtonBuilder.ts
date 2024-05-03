import { ButtonStyles, Emoji } from "../Client";

export default class ButtonBuilder {
    private label!: string;
    private style: number = ButtonStyles.PRIMARY;
    private custom_id!: string;
    private disabled = false
    private emoji?: Partial<Emoji>
    private url!: string

    setUrl(url: string) {
        this.url = url
        return this
    }

    setLabel(label: string) {
        this.label = label
        return this
    }

    setStyle(style: number) {
        this.style = style
        return this
    }

    setCustomid(id: string) {
        this.custom_id = id
        return this
    }

    setDisabled(disabled: boolean) {
        this.disabled = disabled
        return this
    }

    setEmoji(emoji: string) {
        if (emoji.includes("<")) {
            const name = emoji.split(":")[1]
            const id = emoji.split(":")[2].replace(">", "")
            this.emoji = {
                name,
                id
            }
        } else {
            this.emoji = {
                name: emoji
            }
        }

        return this
    }

    toJson() {
        return {
            type: 2,
            label: this.label,
            style: this.style,
            custom_id: this.custom_id,
            disabled: this.disabled,
            emoji: this.emoji,
            url: this.url
        }
    }
}