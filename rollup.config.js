const typescript = require("rollup-plugin-typescript2");
const plugin = typescript({
  exclude: ["structure", "src"],
});

module.exports = [
  {
    input: "src/internal/WebhookClient.ts",
    output: {
      file: "dist/WebhookClient.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/internal/Manager.ts",
    output: {
      file: "dist/Manager.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/internal/Rest.ts",
    output: {
      file: "dist/Rest.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/internal/Route.ts",
    output: {
      file: "dist/Route.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/internal/Base.ts",
    output: {
      file: "dist/Base.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/PermissionCalculator.ts",
    output: {
      file: "dist/PermissionCalculator.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/client.ts",
    output: {
      file: "dist/client.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/User.ts",
    output: {
      file: "dist/User.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/Builders.ts",
    output: {
      file: "dist/Builders.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/Interactions.ts",
    output: {
      file: "dist/Interactions.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/Collector.ts",
    output: {
      file: "dist/Collector.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/Member.ts",
    output: {
      file: "dist/Member.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/Role.ts",
    output: {
      file: "dist/Role.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/Message.ts",
    output: {
      file: "dist/Message.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/SlashCommandBuilder.ts",
    output: {
      file: "dist/SlashCommandBuilder.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/Channel.ts",
    output: {
      file: "dist/Channel.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/structure/Guild.ts",
    output: {
      file: "dist/Guild.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs",
      exports: "named",
      sourcemap: false,
      strict: false,
    },
    plugins: [plugin],
  },
];
