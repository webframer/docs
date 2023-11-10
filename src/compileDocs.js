import { debounce, FORMAT_TIME_FOR_CLI_OPTS, isEmpty, toList } from '@webframer/js'
import { formatDuration } from '@webframer/js/time.js'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { makeDirectory, saveFile } from 'compiler/utils/file.js'
import { readFile, removeFile } from 'core/utils/file.js'
import path from 'path'
import { compileDts } from './compileDts.js'
import { compilePropTypes } from './compilePropTypes.js'
import { getConfig, workDir } from './config.js'

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
    outputComponents,
    inputDocs,
    outputDocs,
    outputPropTypes,
  }) => {
    const inputDocsDir = path.resolve(inputDocs.split('*')[0]) + '/' // relative path
    const docsDir = path.resolve(workDir, inputDocsDir) + '/' // absolute path
    const pagesDir = path.resolve(workDir, outputDocs) + '/' // absolute path
    const transpiledDir = path.resolve(workDir, outputComponents) + '/'
    const propTypesFilePath = path.resolve(workDir, outputPropTypes)
    const componentFilePatterns = toList(inputComponents).map(p => (
      p.startsWith('!') ? p : path.resolve(workDir, p)
    ))
    const componentsWatcher = chokidar.watch(componentFilePatterns)
    const docsWatcher = chokidar.watch(path.resolve(workDir, inputDocs))
    const exitScript = !options.watch ? debounce(() => {
      if (isWatching) {
        isWatching = false
        // Exit compilation when done
        componentsWatcher.close().then()
        docsWatcher.close().then(() => console.log(
          chalk.green('Done'),
          `- compiled ${Object.keys(compiledMdxFiles).length} *.mdx docs in ` +
          formatDuration(Date.now() - start, FORMAT_TIME_FOR_CLI_OPTS),
        ))
      }
    }, 200) : undefined
    const compiledMdxFiles = {}
    let isWatching = true
    let filesQueue = {}

    const compilePropTypesDebounced = debounce(() => {
      compilePropTypes({ // => triggers Next.js reload because of output file changes in code
        componentFilePatterns,
        propTypesFilePath,
      })
        .then((propTypes) => {
          if (!options.declarations || isEmpty(filesQueue)) return
          const start = Date.now()
          const filePaths = Object.keys(filesQueue)
          filesQueue = {} // clear before compilation because this is debounced
          return compileDts(filePaths, {transpiledDir, propTypes})
            .then(dtsFilePaths => {
              dtsFilePaths.forEach(filePath => console.log(
                chalk.magenta('event'), '-', chalk.cyan('saved'), filePath.replace(workDir, ''),
              ))
              console.log(
                chalk.green('Done'),
                `- compiled ${dtsFilePaths.length} *.d.ts files in ` +
                formatDuration(Date.now() - start, FORMAT_TIME_FOR_CLI_OPTS),
              )
            })
        })
        .catch(console.error)
        .finally(exitScript)
    }, 200)

    // Compile component *.d.ts files and propTypes
    componentsWatcher.on('all', function (event, filePath) {
      if (filePath === propTypesFilePath) return

      switch (event) {
        case 'addDir':
          return // terminate early, because nothing needs to be done on empty directory addition
        case 'unlinkDir':
        case 'unlink':
          break // skip compilation of *.d.ts files
        default:
          filesQueue[filePath] = event
      }
      compilePropTypesDebounced.apply(this, arguments)
    })

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
    docsWatcher.on('all', (event, filePath) => {
      const now = Date.now()
      let msg = ''
      let action = event

      switch (event) {
        case 'addDir':
          action = chalk.green(event)
          makeDirectory(filePath.replace(docsDir, pagesDir)).catch(console.error)
          break

        case 'unlinkDir':
        case 'unlink':
          action = chalk.red('delete')
          removeFile(filePath.replace(docsDir, pagesDir))
          break

        case 'add':
        case 'change': {
          action = event === 'add' ? chalk.green(event) : chalk.cyan(event)

          // Parse MDX files to append `source` code as static string for documentation
          let content = readFile(filePath)
          if (filePath.endsWith('.mdx')) {
            content = content.replace(CODE_EXAMPLE_REGEX, (_match, props, children) => (
              `<CodeExample${props}
  source={\`
${children.replaceAll('`', '\\`').replace(CODE_TRIM_REGEX, '')}
\`}>${children}</CodeExample>`
            ))

            msg = `-> compiled in ${formatDuration(Date.now() - now, FORMAT_TIME_FOR_CLI_OPTS)}`
          }

          saveFile(filePath.replace(docsDir, pagesDir), content)
          compiledMdxFiles[filePath] = true
          break
        }
      }

      console.log(chalk.magenta('event'), '-', action, filePath.replace(workDir, ''), msg)
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
