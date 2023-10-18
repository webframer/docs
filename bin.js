#!/usr/bin/env node
import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { compileDocs } from './src/compileDocs.js'

// Webframe Docs CLI ===============================================================================
const program = new Command()

// Parse package.json of this npm package to get its program info
const thisFilePath = fileURLToPath(import.meta.url)
const thisFileDirPath = path.dirname(thisFilePath)
const pkgPath = path.resolve(thisFileDirPath, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

/**
 * To test this program locally, run `npm link`, then:
 *    webframe-docs -v
 * @see: https://docs.npmjs.com/cli/v8/commands/npm-link
 */
program
  .name(pkg.name)
  .description('CLI to generate documentation for React Components with .mdx files')
  .version(pkg.version, '-v, --version', `get current '${pkg.name}' compiler version`)

program
  .command('compile')
  .description('parse source code from components and docs, then compile to output directories')
  .option('-w, --watch', 'recompile documentation when there are changes in the input directories')
  .action(compileDocs)

program.parse()
