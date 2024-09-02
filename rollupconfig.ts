import fs from "node:fs";
import path from "node:path";

const paths: string[] = [];

const directories = fs.readdirSync("./src");
for (let i = 0; i < directories.length; i++) {
  const fileName = directories[i];
  if (fileName.endsWith(".ts")) {
    paths.push(`src/${fileName}`);
  } else {
    const directory = fs.readdirSync(path.join(__dirname, "src", fileName));
    for (let i = 0; i < directory.length; i++) {
      paths.push(`src/${fileName}/${directory[i]}`);
    }
  }
}

fs.writeFileSync(
  "rollup.config.js",
  `
  const typescript = require("rollup-plugin-typescript2")
  const plugin = typescript({
      exclude: ["structure", "src"]
  })

  module.exports = ${paths.map((path) => {
    return `
      {
          input: "${path}",
          output:
          {
              file: "dist/${path.split("/").length === 3 ? path.split("/")[2].replace(".ts", ".js") : path.split("/")[1].replace(".ts", ".js")}",
              format: 'cjs',
              exports: 'named',
              sourcemap: false,
              strict: false
          }
          ,
          plugins: [
              plugin
          ],
      }
    `;
  })}`,
);
