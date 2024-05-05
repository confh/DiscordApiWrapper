
const typescript = require("rollup-plugin-typescript2")
const pkg = require("./package.json")

module.exports = [{
        input: "src/index.ts",
        output:
        {
            file: "dist/index.js",
            format: 'cjs',
            exports: 'named',
            sourcemap: true,
            strict: false
        }
        ,
        plugins: [
            typescript()
        ],
    },{
        input: "src/PermissionCalculator.ts",
        output:
        {
            file: "dist/PermissionCalculator.js",
            format: 'cjs',
            exports: 'named',
            sourcemap: true,
            strict: false
        }
        ,
        plugins: [
            typescript()
        ],
    },{
        input: "src/types.ts",
        output:
        {
            file: "dist/types.js",
            format: 'cjs',
            exports: 'named',
            sourcemap: true,
            strict: false
        }
        ,
        plugins: [
            typescript()
        ],
    }]