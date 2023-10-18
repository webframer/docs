# Automatic Docs Generator for React Components (WIP)

> :warning: **this package is under development! (pending `@webframer/compiler` release)**

Webframe Docs is a CLI tool for generating documentation of React components, with automatic:

1. PropTypes parsing of code comments into descriptions with `<PropsTable>`
2. Source code generation for component examples wrapped inside `<CodeExample>`.

## Demo & Examples

These documentation sites were built using `webframe-docs` CLI:

- [Webframe UI Docs](https://webframe.app/docs/ui)

## Key Benefits

Webframe Docs compiler is:

- An alternative to [Docz](https://github.com/doczjs/docz) (partially inspired by Docz concepts)
- Package and project agnostic (works for any setup, without reliance on Webpack)
- Extendable beyond basic React [PropTypes](https://www.npmjs.com/package/prop-types) with
  custom [type](https://github.com/webframer/ui/blob/main/types.js) system

## Setup & Usage

1. Optionally create a `webframe.docs.json` config file in your project.
   Directory paths use [glob patterns](https://www.npmjs.com/package/fast-glob),
   which are relative to the location of the config file,
   and can be outside the project root directory.
   This is the default config when no config file exists:

```json5
{
  "projects": [
    {
      // Directory containing React Components to document
      "inputComponents": [
        "!**/node_modules",
        "./components/**/*.{js,jsx}"
      ],
      // Directory containing source .mdx files to compile (or glob pattern)
      "inputDocs": "./docs",
      // Directory path where to save compiled doc files
      "outputDocs": "./pages/docs",
      // Where to save parsed React Component PropTypes
      "outputPropTypes": "./src/propTypes.json",
    },
  ],
}
```

2. Run the docs compiler command in Terminal (with optional `--watch` mode)

```shell
# Runs this command inside project root, 
# or where there is webframe.docs.json config file.
npx webframe-docs compile --watch
```

## How It Works

Currently, `webframe-docs` supports documentation generated with [Nextra](https://nextra.site/) using Next.js.

It watches for changes in the input directories and compiles files with `.mdx` extension into output directories (
ex. `pages/docs`). Other files in the `inputDocs` directory also sync with the `outputDocs` directory.

Then it's up to Nextra (ex. using [nextra-theme-docs](https://www.npmjs.com/package/nextra-theme-docs) package) to build
the files for production bundle.


