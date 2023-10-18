import { debounce, FORMAT_TIME_FOR_CLI_OPTS, toList } from '@webframer/js'
import { formatDuration } from '@webframer/js/time.js'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { makeDirectory, saveFile } from 'compiler/utils/file.js'
import { readFile, removeFile } from 'core/utils/file.js'
import path from 'path'
import { getConfig, workDir } from './config.js'
import { compilePropTypes } from './parsePropTypes.js'

/**
 * =================================================================================================
 * What the compiler does:
 * 1. Parse Component library to compile propTypes
 * 2. Read files in `inputDocs` folder, then compiles to `outputDocs` folder
 * 3. Optional `--watch` mode.
 *
 * MDX files with <CodeExample> will have source code appended as literal string for documentation.
 *
 * =================================================================================================
 * @param options - 'commander' program.opts()
 */
export function compileDocs (options) {
  console.log(chalk.cyan('Compiling Docs'))
  const start = Date.now()
  const config = getConfig()
  config.projects.forEach(({
    inputComponents,
    inputDocs,
    outputDocs,
    outputPropTypes,
  }) => {
    const inputDocsDir = path.resolve(inputDocs.split('*')[0]) + '/'
    const docsDir = path.resolve(workDir, inputDocsDir) + '/'
    const pagesDir = path.resolve(workDir, outputDocs) + '/'
    const propTypesFilePath = path.resolve(workDir, outputPropTypes)
    const componentFilePatterns = toList(inputComponents).map(p => (
      p.startsWith('!') ? p : path.resolve(workDir, p)
    ))
    const componentsWatcher = chokidar.watch(componentFilePatterns)
    const docsWatcher = chokidar.watch(path.resolve(workDir, inputDocs))
    const exitScript = !options.watch ? debounce(() => {
      // Exit compilation when done
      componentsWatcher.close().then()
      docsWatcher.close().then(() => console.log(
        chalk.green('Done'),
        `- compiled docs in ${formatDuration(Date.now() - start, FORMAT_TIME_FOR_CLI_OPTS)}`),
      )
    }, 200) : undefined

    // Compile component propTypes
    componentsWatcher.on('all', debounce(() => {
      compilePropTypes({ // => triggers Next.js reload because of output file changes in code
        componentFilePatterns,
        propTypesFilePath,
      }).catch(console.error)
        .finally(exitScript)
    }, 200))

    /**
     * Compile docs .mdx files
     *
     * On init, chokidar fires these events for all existing files:
     *  - addDir <docFilePatterns>
     *  - addDir <docFilePatterns>**
     *  - add <docFilePatterns>**\/*.mdx
     *
     * On file changes, it fires:
     *  - change <docFilePatterns>**\/*.mdx
     *
     * On deletion, it fires:
     *  - unlink <docFilePatterns>**\/*.mdx
     *  - unlinkDir <docFilePatterns>**
     */
    docsWatcher.on('all', (event, path) => {
      const now = Date.now()
      let msg = ''
      let action = event

      switch (event) {
        case 'addDir':
          action = chalk.green(event)
          makeDirectory(path.replace(docsDir, pagesDir)).catch(console.error)
          break

        case 'unlinkDir':
        case 'unlink':
          action = chalk.red('delete')
          removeFile(path.replace(docsDir, pagesDir))
          break

        case 'add':
        case 'change': {
          action = event === 'add' ? chalk.green(event) : chalk.cyan(event)

          // Parse MDX files to append `source` code as static string for documentation
          let content = readFile(path)
          if (path.endsWith('.mdx')) {
            content = content.replace(CODE_EXAMPLE_REGEX, (_match, props, children) => (
              `<CodeExample${props}
  source={\`
${children.replaceAll('`', '\\`').replace(CODE_TRIM_REGEX, '')}
\`}>${children}</CodeExample>`
            ))

            msg = `-> compiled in ${formatDuration(Date.now() - now, FORMAT_TIME_FOR_CLI_OPTS)}`
          }

          saveFile(path.replace(docsDir, pagesDir), content)
          break
        }
      }

      console.log(chalk.magenta('event'), '-', action, path.replace(docsDir, inputDocsDir), msg)
      exitScript && exitScript()
    })
  })
}

/**
 * Regex pattern to append `children` as static source code for documentation.
 * Notes:
 *  - <CodeExample> cannot have <JSX> in props because regex matches the first `>` character
 * @see: https://regex101.com/r/y3yFeE/1
 */
export const CODE_EXAMPLE_REGEX = /<CodeExample([^]*?)>([^]*?)<\/CodeExample>/gm
export const CODE_TRIM_REGEX = /^\n+|\n+$/g
