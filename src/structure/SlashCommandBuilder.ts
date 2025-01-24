import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
} from "../client";

interface choice<T> {
  name: T;
  value: T;
}

/** Slash command builder */
export class SlashCommandBuilder {
  name: string;
  description: string;
  private options: {
    type: number;
    name: string;
    description: string;
    required?: boolean;
    choices?: choice<any>[];
  }[] = [];
  public type: ApplicationCommandTypes = ApplicationCommandTypes.CHAT_INPUT;

  private addSlashCommandOption(
    type: number,
    name: string,
    desc: string,
    required: boolean,
    choices?: choice<any>[],
  ) {
    this.options.push({
      type: type,
      name,
      description: desc,
      required,
      choices,
    });
  }

  /**
   * Set the name of the slash command
   * @param name Name of the command
   * @returns SlashCommandBuilder Object
   */
  setName(name: string): this {
    this.name = name;
    return this;
  }

  /**
   * Set to context Interaction
   * @param type Type of context
   */
  setContextInteraction(type: "USER" | "MESSAGE"): this {
    if (type === "USER") {
      this.type = ApplicationCommandTypes.USER;
    } else {
      this.type = ApplicationCommandTypes.MESSAGE;
    }
    return this;
  }

  /**
   * Set the description of the slash comamnd
   * @param desc Description of the command
   * @returns SlashCommandBuilder Object
   */
  setDescription(desc: string): this {
    this.description = desc;
    return this;
  }

  /**
   * Add an integer option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required
   * @param choices If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addNumberOption(
    name: string,
    description: string,
    required = false,
    choices?: choice<number>[],
  ): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.INTEGER,
      name,
      description,
      required,
      choices,
    );
    return this;
  }

  /**
   * Add a string option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addStringOption(
    name: string,
    description: string,
    required = false,
    choices?: choice<string>[],
  ): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.STRING,
      name,
      description,
      required,
      choices,
    );
    return this;
  }

  /**
   * Add a boolean option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addBooleanOption(name: string, description: string, required = false): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.BOOLEAN,
      name,
      description,
      required,
    );
    return this;
  }

  /**
   * Add a user option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addUserOption(name: string, description: string, required = false): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.USER,
      name,
      description,
      required,
    );
    return this;
  }

  /**
   * Add an attachment option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addAttachmentOption(
    name: string,
    description: string,
    required = false,
  ): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.ATTACHMENT,
      name,
      description,
      required,
    );
    return this;
  }

  toJson(): any {
    const data: any = {
      name: this.name,
      type: this.type,
    };
    if (this.type === ApplicationCommandTypes.CHAT_INPUT) {
      data.description = this.description;
      data.options = this.options;
    }
    return data;
  }

  addSubCommand(data: SubCommandBuilder): this {
    this.options.push(data.toJson());

    return this;
  }

  /**
   * Create a sub command group with sub commands
   *
   * @param name The name of the sub command group
   * @param description The description of the sub command group
   * @param subCommands An array of sub commands
   * @returns
   */
  addSubCommandGroup(
    name: string,
    description: string,
    ...subCommands: SubCommandBuilder[]
  ): this {
    if (!subCommands.length)
      throw new Error("At least one subcommand is needed.");
    const newOptions: {
      name: string;
      description: string;
      type: number;
      options: {
        name: string;
        description: string;
        type: number;
      }[];
    } = {
      name,
      description,
      type: 2,
      options: [],
    };

    for (let i = 0; i < subCommands.length; i++) {
      newOptions.options.push(subCommands[i].toJson());
    }

    this.options.push(newOptions);

    return this;
  }
}

/** Sub Command builder */
export class SubCommandBuilder {
  private name: string;
  private description: string;
  private type = 1;
  private options: {
    type: number;
    name: string;
    description: string;
    required?: boolean;
    choices?: choice<any>[];
  }[] = [];

  private addSlashCommandOption(
    type: number,
    name: string,
    desc: string,
    required: boolean,
    choices?: choice<any>[],
  ) {
    this.options.push({
      type: type,
      name,
      description: desc,
      required,
      choices,
    });
  }

  /**
   * Set the name of the sub command
   *
   * @param name Name of the sub command
   * @returns SubCommandBuilder object
   */
  setName(name: string): this {
    this.name = name;

    return this;
  }

  /**
   * Set the description of the sub command
   *
   * @param description Description of the sub command
   * @returns SubCommandBuilder object
   */
  setDescription(description: string): this {
    this.description = description;

    return this;
  }

  /**
   * Add an integer option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required
   * @param choices If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addNumberOption(
    name: string,
    description: string,
    required = false,
    choices?: choice<number>[],
  ): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.INTEGER,
      name,
      description,
      required,
      choices,
    );
    return this;
  }

  /**
   * Add a string option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addStringOption(
    name: string,
    description: string,
    required = false,
    choices?: choice<string>[],
  ): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.STRING,
      name,
      description,
      required,
      choices,
    );
    return this;
  }

  /**
   * Add a boolean option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addBooleanOption(name: string, description: string, required = false): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.BOOLEAN,
      name,
      description,
      required,
    );
    return this;
  }

  /**
   * Add a user option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addUserOption(name: string, description: string, required = false): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.USER,
      name,
      description,
      required,
    );
    return this;
  }

  /**
   * Add an attachment option to the slash command
   * @param name Name of the option
   * @param description Description of the option
   * @param required If the option is required or not
   * @returns SlashCommandBuilder Object
   */
  addAttachmentOption(
    name: string,
    description: string,
    required = false,
  ): this {
    this.addSlashCommandOption(
      ApplicationCommandOptionTypes.ATTACHMENT,
      name,
      description,
      required,
    );
    return this;
  }

  toJson(): any {
    return {
      name: this.name,
      description: this.description,
      type: 1,
      options: this.options,
    };
  }
}
