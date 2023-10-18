# Automatic Docs Generator (WIP)

> :warning: **this package is under development! (pending `@webframer/compiler` release)**

Webframe Docs is cli tool for generating documentation of React components, with automatic:

1. PropTypes parsing of code comments into descriptions with `<PropsTable>`
2. Source code generation for component examples wrapped inside `<CodeExample>`.

## Demo Examples

These documentation sites were built with `webframe-docs`:

- [Webframe UI Docs](https://webframe.app/docs/ui)

## Key Benefits

Webframe Docs compiler is:

- An alternative to [Docz](https://github.com/doczjs/docz) (partially inspired by Docz concepts)
- Package and project agnostic (works for any setup, without reliance on Webpack)
- Extendable beyond basic React [PropTypes](https://www.npmjs.com/package/prop-types) with
  custom [type](https://github.com/webframer/ui/blob/main/types.js) system

## How It Works

Currently, `@webframer/docs` supports documentation generated with [Nextra](https://nextra.site/) using Next.js.

It watches for changes in the `--input` directory and compiles files with `.mdx` extension into `--output` directory (
i.e. `pages/docs`). Other files in the input directory also sync with the output directory.

Then it's up to Nextra (ex. using [nextra-theme-docs](https://www.npmjs.com/package/nextra-theme-docs) package) to build
the files for production bundle.

## Setup & Usage

1. Create `webframe.docs.json` config file in your project root directory. All directory paths use [glob patterns](https://www.npmjs.com/package/fast-glob).
```json5
{
  "input": ["./docs"],
  "output": "./pages/docs",
}
```

2. Run the docs compiler (with optional `--watch` mode)

```shell
npx webframe-docs compile --watch
```


