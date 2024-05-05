import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs"],
    target: "es6",
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
});