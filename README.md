<div align="center">
<p>
<h1>DiscordApiWrapper: A High-Performance Discord Bot Library for Node.js</h1>

<a href="https://www.npmjs.com/package/@confis/discordapiwrapper"><img src="https://img.shields.io/npm/d18m/@confis/discordapiwrapper.svg?maxAge=3600" alt="npm downloads" /></a>

</p>

</div>

**Docs: https://jsr.io/@confis/discordapiwrapper/doc**

**Introduction**

DiscordApiWrapper is a streamlined Discord bot library designed for maximum speed and minimal overhead. It provides essential features for interacting with the Discord API, making it ideal for building efficient and responsive Discord bots.

**Features**

- **Blazing-Fast Performance:** Optimized for low-latency communication with the Discord API.
- **Lightweight Footprint:** Keeps your bot's memory usage minimal.
- **Essential Functionality:** Offers a core set of Discord bot functionalities for common bot tasks.

**Installation**

Install DiscordApiWrapper from npm using the following command:

```bash
npm install @confis/discordapiwrapper
```

**Usage**

1. **Import the library:**

```typescript
import {
  Client,
  Intents,
  SlashCommandBuilder,
  SlashCommandInteraction,
} from "@confis/discordapiwrapper";
```

2. **Create a client instance:**

```typescript
const client = new Client("YOUR_BOT_TOKEN", {
  cacheAllUsers: true,
  intents: [Intents.GUILDS, Intents.GUILD_MEMBERS, Intents.GUILD_MESSAGES],
  shards: "auto",
}); // Replace with your actual token
```

3. **Start listening for events:**

```typescript
client.on("ready", () => {
  console.log(`Logged in as ${client.user.displayName}`);
  client.setGlobalCommands(
    new SlashCommandBuilder().setName("ping").setDescription("Ping the bot!"),
  );
});

client.on("interactionCreate", async (i) => {
  if (i instanceof SlashCommandInteraction) {
    if (i.name === "ping") {
      i.reply("Pong!");
    }
  }
});

client.connect();
```

**Final code:**

````typescript
import {
  Client,
  Intents,
  SlashCommandBuilder,
  SlashCommandInteraction,
} from "@confis/discordapiwrapper";

const client = new Client('YOUR_BOT_TOKEN', {
    cacheAllUsers: true,
    intents: [Intents.GUILDS, Intents.GUILD_MEMBERS, Intents.GUILD_MESSAGES],
    shards: "auto"
}); // Replace with your actual token

client.on("ready", () => {
    console.log(`Logged in as ${client.user.displayName}`);
    client.setGlobalCommands(
        new SlashCommandBuilder()
            .setName("ping")
            .setDescription("Ping the bot!")
    );
});

client.on("interactionCreate", async (i) => {
    if (i instanceof SlashCommandInteraction) {
        if (i.name === "ping") {
            i.reply("Pong!");
        }
    }
});

client.connect();```
````
