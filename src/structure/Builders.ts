import { ButtonStyles, Emoji, JSONCache, PartialEmoji } from "../client";

type SUPPORTED_ELEMENTS = ButtonBuilder | StringSelectMenuBuilder;

export interface FieldOptions {
  name: string;
  value: string;
  inline?: boolean;
}

export interface FooterOptions {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface ImageOptions {
  url: string;
  height?: number;
  width?: number;
}

export interface AuthorOptions {
  name: string;
  url?: string;
  icon_url: string;
  proxy_icon_url?: string;
}

export class EmbedBuilder {
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
    this.author = options;
    return this;
  }

  setTimestamp(date?: Date) {
    this.timestamp = date || new Date();
    return this;
  }

  setTitle(title: string) {
    this.title = title;
    return this;
  }

  setColor(color: string | number) {
    if (typeof color === "number") {
      this.color = color;
    } else {
      this.color = parseInt(color.replace("#", ""), 16);
    }
    return this;
  }

  setDescription(desc: string) {
    this.description = desc;
    return this;
  }

  setThumbnail(options: ImageOptions) {
    this.thumbnail = options;
    return this;
  }

  setImage(options: ImageOptions) {
    this.image = options;
    return this;
  }

  setFooter(options: FooterOptions) {
    this.footer = options;
    return this;
  }

  setFields(fields: FieldOptions[]) {
    this.fields = fields;
    return this;
  }

  setURL(url: string) {
    this.url = url;
    return this;
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
      url: this.url,
    };
  }
}
export class ButtonBuilder {
  #label!: string;
  #style: number = ButtonStyles.PRIMARY;
  #custom_id!: string;
  #disabled = false;
  #emoji?: Partial<PartialEmoji>;
  #url!: string;

  setUrl(url: string) {
    this.#url = url;
    return this;
  }

  setLabel(label: string) {
    this.#label = label;
    return this;
  }

  setStyle(style: number) {
    this.#style = style;
    return this;
  }

  setCustomid(id: string) {
    this.#custom_id = id;
    return this;
  }

  setDisabled(disabled: boolean) {
    this.#disabled = disabled;
    return this;
  }

  setEmoji(emoji: string) {
    if (emoji.includes("<")) {
      const name = emoji.split(":")[1];
      const id = emoji.split(":")[2].replace(">", "");
      this.#emoji = {
        name,
        id,
      };
    } else {
      this.#emoji = {
        name: emoji,
      };
    }

    return this;
  }

  toJson() {
    return {
      type: 2,
      label: this.#label,
      style: this.#style,
      custom_id: this.#custom_id,
      disabled: this.#disabled,
      emoji: this.#emoji,
      url: this.#url,
    };
  }
}

export class StringSelectMenuBuilder {
  #placeHolder!: string;
  #custom_id!: string;
  #disabled = false;
  options!: StringSelect[];

  setPlaceholder(placeholder: string) {
    this.#placeHolder = placeholder;
    return this;
  }

  setCustomid(id: string) {
    this.#custom_id = id;
    return this;
  }

  setDisabled(disabled: boolean) {
    this.#disabled = disabled;
    return this;
  }

  setOptions(...args: StringSelect[]) {
    this.options = args;
    return this;
  }

  toJson() {
    const optionsJSON: JSONCache[] = [];
    for (let i = 0; i < this.options.length; i++) {
      optionsJSON.push(this.options[i].toJson());
    }

    return {
      type: 3,
      custom_id: this.#custom_id,
      options: optionsJSON,
      placeholder: this.#placeHolder,
      disabled: this.#disabled,
    };
  }
}

export class StringSelect {
  #label!: string;
  #value!: string;
  #description?: string;
  #emoji?: Partial<PartialEmoji>;
  #default?: boolean;

  setLabel(label: string) {
    this.#label = label;
    return this;
  }

  setValue(value: string) {
    this.#value = value;
    return this;
  }

  setDescription(desc: string) {
    this.#description = desc;
    return this;
  }

  setEmoji(emoji: string) {
    if (emoji.includes("<")) {
      const name = emoji.split(":")[1];
      const id = emoji.split(":")[2].replace(">", "");
      this.#emoji = {
        name,
        id,
      };
    } else {
      this.#emoji = {
        name: emoji,
      };
    }

    return this;
  }

  setDefault(value: boolean) {
    this.#default = value;
    return this;
  }

  toJson() {
    return {
      label: this.#label,
      value: this.#value,
      description: this.#description,
      emoji: this.#emoji,
      default: this.#default,
    };
  }
}

export class ActionRowBuilder {
  public components!: Array<SUPPORTED_ELEMENTS>;

  setComponents(...args: Array<SUPPORTED_ELEMENTS>) {
    this.components = args;
    return this;
  }

  setComponentsArray(components: Array<SUPPORTED_ELEMENTS>) {
    this.components = components;
    return this;
  }

  toJson() {
    const JSONArray: any[] = [];
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      JSONArray.push(component.toJson());
    }

    return {
      type: 1,
      components: JSONArray,
    };
  }
}
