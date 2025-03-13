import { ButtonStyles, APIEmoji, JSONCache, PartialEmoji } from "../client";

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

/** Embed builder */
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
  setAuthor(options: AuthorOptions): this {
    this.author = options;
    return this;
  }

  /**
   * Set the timestamp of the embed
   * @param date The timestamp date
   * @returns EmbedBuilder Object
   */
  setTimestamp(date?: Date): this {
    this.timestamp = date || new Date();
    return this;
  }

  /**
   * Set the title of the embed
   * @param title The title of the embed
   * @returns EmbedBuilder Object
   */
  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  /**
   * Set the Color of the embed
   * @param color The color of the embed in decial or hex
   * @returns EmbedBuilder Object
   */
  setColor(color: string | number): this {
    if (typeof color === "number") {
      this.color = color;
    } else {
      this.color = parseInt(color.replace("#", ""), 16);
    }
    return this;
  }

  /**
   * Set the Description of the embed
   * @param description The description of the embed
   * @returns EmbedBuilder Object
   */
  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  /**
   * Set the Thumbnail of the embed
   * @param options {@link ImageOptions}
   * @returns EmbedBuilder Object
   */
  setThumbnail(options: ImageOptions): this {
    this.thumbnail = options;
    return this;
  }

  /**
   * Set the Image of the embed
   * @param options {@link ImageOptions}
   * @returns EmbedBuilder Object
   */
  setImage(options: ImageOptions): this {
    this.image = options;
    return this;
  }

  /**
   * Set the Footer of the embed
   * @param options {@link FooterOptions}
   * @returns EmbedBuilder Object
   */
  setFooter(options: FooterOptions): this {
    this.footer = options;
    return this;
  }

  /**
   * Set the Fields of the embed
   * @param fields {@link FieldOptions}
   * @returns EmbedBuilder Object
   */
  setFields(fields: FieldOptions[]): this {
    this.fields = fields;
    return this;
  }

  /**
   * Set the URL of the embed
   * @param url The URL
   * @returns EmbedBuilder Object
   */
  setURL(url: string): this {
    this.url = url;
    return this;
  }

  toJson(): {
    author: AuthorOptions;
    color: number;
    description: string;
    fields: FieldOptions[];
    footer: FooterOptions;
    image: ImageOptions;
    thumbnail: ImageOptions;
    timestamp: string | Date;
    title: string;
    url: string;
  } {
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

/** Button builder */
export class ButtonBuilder {
  #label!: string;
  #style: number = ButtonStyles.PRIMARY;
  #custom_id!: string;
  #disabled = false;
  #emoji?: Partial<PartialEmoji>;
  #url!: string;

  /**
   * Set the URL of the button
   * @param url the URL
   * @returns ButtonBuilder Object
   */
  setUrl(url: string): this {
    this.#url = url;
    return this;
  }

  /**
   * Set the Label of the button
   * @param label the Label
   * @returns ButtonBuilder Object
   */
  setLabel(label: string): this {
    this.#label = label;
    return this;
  }

  /**
   * Set the Style of the button
   * @param style {@link ButtonStyles}
   * @returns ButtonBuilder Object
   */
  setStyle(style: ButtonStyles): this {
    this.#style = style;
    return this;
  }

  /**
   * Set the Custom ID of the button
   * @param id The custom ID
   * @returns ButtonBuilder Object
   */
  setCustomID(id: string): this {
    this.#custom_id = id;
    return this;
  }

  /**
   * Set if the button is disabled
   * @param disabled Disabled field
   * @returns ButtonBuilder Object
   */
  setDisabled(disabled: boolean): this {
    this.#disabled = disabled;
    return this;
  }

  /**
   * Set the emoji of the button
   * @param emoji The emoji
   * @returns ButtonBuilder Object
   */
  setEmoji(emoji: string): this {
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

  toJson(): {
    type: number;
    label: string;
    style: number;
    custom_id: string;
    disabled: boolean;
    emoji: Partial<PartialEmoji>;
    url: string;
  } {
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

/** String select menu builder */
export class StringSelectMenuBuilder {
  #placeHolder!: string;
  #custom_id!: string;
  #disabled = false;
  options!: StringSelect[];

  /**
   * Set the Placeholder of the StringSelectMenu
   * @param placeholder The placeholder
   * @returns StringSelectMenuBuilder Object
   */
  setPlaceholder(placeholder: string): this {
    this.#placeHolder = placeholder;
    return this;
  }

  /**
   * Set the Custom ID of the StringSelectMenu
   * @param id The custom ID
   * @returns StringSelectMenuBuilder Object
   */
  setCustomID(id: string): this {
    this.#custom_id = id;
    return this;
  }

  /**
   * Set if the menu is disabled
   * @param disabled Disabled field
   * @returns StringSelectMenuBuilder Object
   */
  setDisabled(disabled: boolean): this {
    this.#disabled = disabled;
    return this;
  }

  /**
   * Set the options of the StringSelectMenu
   * @param ...args An array of {@link StringSelect}
   * @returns StringSelectMenuBuilder Object
   */
  setOptions(...args: StringSelect[]): this {
    this.options = args;
    return this;
  }

  toJson(): {
    type: number;
    custom_id: string;
    options: JSONCache[];
    placeholder: string;
    disabled: boolean;
  } {
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

/** String select object */
export class StringSelect {
  #label!: string;
  #value!: string;
  #description?: string;
  #emoji?: Partial<PartialEmoji>;
  #default?: boolean;

  /**
   * Set the Label of the StringSelect
   * @param label The label
   * @returns StringSelect Object
   */
  setLabel(label: string): this {
    this.#label = label;
    return this;
  }

  /**
   * Set the Value of the StringSelect
   * @param value The value
   * @returns StringSelect Object
   */
  setValue(value: string): this {
    this.#value = value;
    return this;
  }

  /**
   * Set the Description of the StringSelect
   * @param description The description
   * @returns StringSelect Object
   */
  setDescription(description: string): this {
    this.#description = description;
    return this;
  }

  /**
   * Set the Emoji of the StringSelect
   * @param emoji The emoji
   * @returns StringSelect Object
   */
  setEmoji(emoji: string): this {
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

  /**
   * Set if the string select is default
   * @param value Default value
   * @returns StringSelect Object
   */
  setDefault(value: boolean): this {
    this.#default = value;
    return this;
  }

  toJson(): {
    label: string;
    value: string;
    description: string;
    emoji: Partial<PartialEmoji>;
    default: boolean;
  } {
    return {
      label: this.#label,
      value: this.#value,
      description: this.#description,
      emoji: this.#emoji,
      default: this.#default,
    };
  }
}

/** Action Row builder */
export class ActionRowBuilder {
  public components!: Array<SUPPORTED_ELEMENTS>;

  /**
   * Set the Components of the ActionRow
   * @param ...args An array of {@link SUPPORTED_ELEMENTS}
   * @returns ActionRowBuilder Object
   */
  setComponents(...args: SUPPORTED_ELEMENTS[]): this {
    this.components = args;
    return this;
  }

  /**
   * Disables all components in the action row
   * @returns The ActionRowBuilder instance for method chaining
   */
  disableAllComponents(): this {
    this.components.forEach(e => e.setDisabled(true))
    return this
  }

  /**
   * Set the Components of the ActionRow
   * @param components An array of {@link SUPPORTED_ELEMENTS}
   * @returns ActionRowBuilder Object
   */
  setComponentsArray(components: SUPPORTED_ELEMENTS[]): this {
    this.components = components;
    return this;
  }

  toJson(): {
    type: number;
    components: any[];
  } {
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

/** Text input styles enum */
export enum TextInputStyles {
  SHORT = 1,
  PARAGRAPH = 2,
}

/** Text input builder */
export class TextInputBuilder {
  #custom_id!: string;
  #label!: string;
  #style: TextInputStyles = TextInputStyles.SHORT;
  #min_length?: number;
  #max_length?: number;
  #required: boolean = false;
  #value?: string;
  #placeholder?: string;

  /**
   * Set the Custom ID of the text input
   * @param id The custom ID
   * @returns TextInputBuilder Object
   */
  setCustomId(id: string): this {
    this.#custom_id = id;
    return this;
  }

  /**
   * Set the Label of the text input
   * @param label The label
   * @returns TextInputBuilder Object
   */
  setLabel(label: string): this {
    this.#label = label;
    return this;
  }

  /**
   * Set the Style of the text input
   * @param style The style from TextInputStyles
   * @returns TextInputBuilder Object
   */
  setStyle(style: TextInputStyles): this {
    this.#style = style;
    return this;
  }

  /**
   * Set the Minimum Length of the text input
   * @param length The minimum length
   * @returns TextInputBuilder Object
   */
  setMinLength(length: number): this {
    this.#min_length = length;
    return this;
  }

  /**
   * Set the Maximum Length of the text input
   * @param length The maximum length
   * @returns TextInputBuilder Object
   */
  setMaxLength(length: number): this {
    this.#max_length = length;
    return this;
  }

  /**
   * Set if the text input is required
   * @param required Whether the field is required
   * @returns TextInputBuilder Object
   */
  setRequired(required: boolean): this {
    this.#required = required;
    return this;
  }

  /**
   * Set the Value of the text input
   * @param value The pre-filled value
   * @returns TextInputBuilder Object
   */
  setValue(value: string): this {
    this.#value = value;
    return this;
  }

  /**
   * Set the Placeholder of the text input
   * @param placeholder The placeholder text
   * @returns TextInputBuilder Object
   */
  setPlaceholder(placeholder: string): this {
    this.#placeholder = placeholder;
    return this;
  }

  toJson(): {
    type: number;
    custom_id: string;
    label: string;
    style: number;
    min_length?: number;
    max_length?: number;
    required: boolean;
    value?: string;
    placeholder?: string;
  } {
    return {
      type: 4,
      custom_id: this.#custom_id,
      label: this.#label,
      style: this.#style,
      min_length: this.#min_length,
      max_length: this.#max_length,
      required: this.#required,
      value: this.#value,
      placeholder: this.#placeholder,
    };
  }
}

/** Modal builder */
export class ModalBuilder {
  #title!: string;
  #custom_id!: string;
  #components: TextInputBuilder[] = [];

  /**
   * Set the Title of the modal
   * @param title The title
   * @returns ModalBuilder Object
   */
  setTitle(title: string): this {
    this.#title = title;
    return this;
  }

  /**
   * Set the Custom ID of the modal
   * @param id The custom ID
   * @returns ModalBuilder Object
   */
  setCustomId(id: string): this {
    this.#custom_id = id;
    return this;
  }

  /**
   * Add components to the modal
   * @param components The components to add
   * @returns ModalBuilder Object
   */
  addComponents(...components: TextInputBuilder[]): this {
    this.#components.push(...components);
    return this;
  }

  /**
   * Set the components of the modal
   * @param components The components to set
   * @returns ModalBuilder Object
   */
  setComponents(...components: TextInputBuilder[]): this {
    this.#components = components;
    return this;
  }

  toJson(): {
    title: string;
    custom_id: string;
    type: number;
    components: {
      type: number;
      components: any[];
    }[];
  } {
    return {
      title: this.#title,
      custom_id: this.#custom_id,
      type: 1,
      components: this.#components.map(component => ({
        type: 1,
        components: [component.toJson()]
      }))
    };
  }
}
