<div align="center">
<p>
<h1>DiscordApiWrapper: A High-Performance Discord Bot Library for Node.js</h1>

<a href="https://www.npmjs.com/package/@confis/discordapiwrapper"><img src="https://img.shields.io/npm/d18m/@confis/discordapiwrapper.svg?maxAge=3600" alt="npm downloads" /></a>

</p>
</div>

**[Documentation](https://jsr.io/@confis/discordapiwrapper/doc)** | **[NPM Package](https://www.npmjs.com/package/@confis/discordapiwrapper)** | **[GitHub Repository](https://github.com/confh/DiscordApiWrapper)**

## Introduction

DiscordApiWrapper is a streamlined Discord bot library designed for maximum speed and minimal overhead. It provides essential features for interacting with the Discord API, making it ideal for building efficient and responsive Discord bots.

## Features

- **Blazing-Fast Performance:** Optimized for low-latency communication with the Discord API
- **Lightweight Footprint:** Keeps your bot's memory usage minimal
- **Type Safety:** Written in TypeScript with full type definitions
- **Modern Architecture:** Built with modern JavaScript practices and patterns
- **Comprehensive Event System:** Full support for all Discord gateway events
- **Flexible Command Handling:** Support for Slash Commands, Context Menus, and Message Components
- **Rate Limit Handling:** Automatic handling of Discord API rate limits
- **Caching System:** Efficient caching of guilds, channels, and users

## Installation

Choose your preferred package manager:

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
  SlashCommandInteraction
} from "@confis/discordapiwrapper";

// Initialize the client
const client = new Client("YOUR_BOT_TOKEN", {
  intents: [
    Intents.GUILDS,
    Intents.GUILD_MESSAGES,
    Intents.GUILD_MEMBERS
  ],
  cacheAllUsers: true
});

// Register commands when ready
client.on("ready", () => {
  console.log(`Logged in as ${client.user.displayName}`);
  
  // Register a global slash command
  client.setGlobalCommands([
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Check bot latency")
  ]);
});

// Handle interactions
client.on("interactionCreate", async (interaction) => {
  if (interaction instanceof SlashCommandInteraction) {
    if (interaction.name === "ping") {
      await interaction.reply(`Pong! Latency: ${client.ping}ms`);
    }
  }
});

// Connect to Discord
client.connect();
```

## Advanced Usage

### Message Components

```typescript
import { ButtonBuilder, ButtonStyles, ActionRowBuilder } from "@confis/discordapiwrapper";

// Create a button
const button = new ButtonBuilder()
  .setLabel("Click me!")
  .setStyle(ButtonStyles.PRIMARY)
  .setCustomId("my-button");

// Create an action row
const row = new ActionRowBuilder().addComponents(button);

// Send a message with the button
channel.send({
  content: "Here's a button!",
  components: [row]
});
```

### Embeds

```typescript
import { EmbedBuilder } from "@confis/discordapiwrapper";

const embed = new EmbedBuilder()
  .setTitle("Hello World")
  .setDescription("This is an embed!")
  .setColor(0x00ff00)
  .addField("Field 1", "Value 1")
  .setFooter({ text: "Footer text" });

channel.send({ embeds: [embed] });
```

### Event Handling

```typescript
// Message creation
client.on("messageCreate", (message) => {
  if (message.content === "!hello") {
    message.reply("Hello there!");
  }
});

// Guild member updates
client.on("memberUpdate", (oldMember, newMember) => {
  if (oldMember.nickname !== newMember.nickname) {
    console.log(`${newMember.user.username} changed their nickname`);
  }
});

// Error handling
client.on("error", (error) => {
  console.error("An error occurred:", error);
});
```

## Configuration Options

```typescript
interface ClientOptions {
  // Whether to cache all users in memory
  cacheAllUsers?: boolean;
  
  // Array of gateway intents to enable
  intents?: Intents[];
  
  // Number of shards to use (or "auto")
  shards?: "auto" | number;
}
```

## Best Practices

1. **Token Security:**
   - Never commit your bot token to version control
   - Use environment variables for sensitive data
   ```typescript
   import dotenv from "dotenv";
   dotenv.config();
   
   const client = new Client(process.env.BOT_TOKEN);
   ```

2. **Error Handling:**
   ```typescript
   client.on("error", (error) => {
     console.error("Client error:", error);
   });

   process.on("unhandledRejection", (error) => {
     console.error("Unhandled promise rejection:", error);
   });
   ```

3. **Resource Cleanup:**
   ```typescript
   process.on("SIGINT", () => {
     client.disconnect();
     process.exit();
   });
   ```

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
```