<div align="center">
<p>
<h1>DiscordApiWrapper: A High-Performance Discord Bot Library for Node.js</h1>

<a href="https://www.npmjs.com/package/@confis/discordapiwrapper"><img src="https://img.shields.io/npm/d18m/@confis/discordapiwrapper.svg?maxAge=3600" alt="npm downloads" /></a>

</p>
</div>

**[Documentation](https://confh.github.io/)** | **[NPM Package](https://www.npmjs.com/package/@confis/discordapiwrapper)** | **[GitHub Repository](https://github.com/confh/DiscordApiWrapper)**

## Introduction

DiscordApiWrapper is a streamlined Discord bot library designed for maximum speed and minimal overhead. Built with TypeScript, it provides a robust set of features for creating powerful Discord bots while maintaining excellent performance and type safety.

## Features

- **High-Performance Architecture**
  - Optimized WebSocket connection handling
  - Efficient caching system for guilds, channels, and users
  - Automatic rate limit handling
  
- **Rich Interactive Features**
  - Full Slash Commands support with builder patterns
  - Message Components (Buttons, Select Menus)
  - Modal Forms with text inputs
  - Rich Embeds with full customization
  - Context Menus (User and Message)
  
- **Event System**
  - Comprehensive gateway event coverage
  - Custom collectors for interactions and messages
  - Detailed event typing for TypeScript support
  
- **Developer Experience**
  - Full TypeScript support with detailed type definitions
  - Intuitive builder patterns for components

## Installation

```bash
# Using npm
npm install @confis/discordapiwrapper

# Using yarn
yarn add @confis/discordapiwrapper

# Using JSR
npx jsr add @confis/discordapiwrapper
```

## Quick Start

```typescript
import {
  Client,
  Intents,
  SlashCommandBuilder,
  EmbedBuilder
} from "@confis/discordapiwrapper";

const client = new Client("YOUR_BOT_TOKEN", {
  intents: [
    Intents.GUILDS,
    Intents.GUILD_MESSAGES,
    Intents.GUILD_MEMBERS
  ]
});

// Register commands
client.on("ready", () => {
  console.log(`Logged in as ${client.user.displayName}`);
  
  client.setGlobalCommands([
    new SlashCommandBuilder()
      .setName("info")
      .setDescription("Get server info")
  ]);
});

// Handle interactions with rich embed response
client.on("interactionCreate", async (interaction) => {
  if (interaction instanceof SlashCommandInteraction) {
    if (interaction.name === "info") {
      const embed = new EmbedBuilder()
        .setTitle("Server Information")
        .setColor(0x5865F2)
        .addField("Members", interaction.guild.memberCount.toString(), true)
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  }
});

client.connect();
```

## Advanced Features

### Interactive Components

```typescript
import { 
  ButtonBuilder, 
  ButtonStyles, 
  ActionRowBuilder,
  StringSelectMenuBuilder
} from "@confis/discordapiwrapper";

// Create button row
const button = new ButtonBuilder()
  .setLabel("Click me!")
  .setStyle(ButtonStyles.PRIMARY)
  .setCustomID("interaction-demo");

// Type-safe action row with buttons
const buttonRow = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(button);

// Create select menu row
const select = new StringSelectMenuBuilder()
  .setCustomID("select-demo")
  .setPlaceholder("Choose an option");

// Type-safe action row with select menu
const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
  .addComponents(select);

// Send message with multiple component types
channel.send({
  content: "Interactive message with typed components!",
  components: [buttonRow, selectRow]
});
```

### Modal Forms

```typescript
const modal = new ModalBuilder()
  .setTitle("User Feedback")
  .setCustomID("feedback-form")
  .addComponents(
    new TextInputBuilder()
      .setLabel("Your Feedback")
      .setStyle(TextInputStyles.PARAGRAPH)
      .setCustomID("feedback-input")
      .setRequired(true)
  );

// Show modal and handle submission
client.on("interactionCreate", async (interaction) => {
  if (interaction instanceof ModalInteraction) {
    const feedback = interaction.data.components[0].data.value;
    await interaction.reply(`Received: ${feedback}`);
  }
});
```

## Documentation

For complete API documentation and examples, visit our [Documentation Site](https://confh.github.io/).
```
