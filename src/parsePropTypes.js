import { toJSON } from '@webframer/js'
import { formatDuration } from '@webframer/js/time.js'
import chalk from 'chalk'
import { parseProptypes } from 'compiler/utils/babel.js'
import { saveFile } from 'compiler/utils/file.js'
import glob from 'fast-glob'
import fs from 'fs'

/**
 * Parse source code for React Component.propTypes and Component.defaultProps definitions,
 * and then compile them to a JSON manifest file.
 * @param {object} c - config
 * @param {string|string[]} c.componentFilePatterns - input components directory to parse source code
 * @param {string} c.propTypesFilePath - absolute file path of the output JSON file to save
 */
export async function compilePropTypes ({componentFilePatterns, propTypesFilePath}) {
  const start = Date.now()
  const componentFilePaths = await glob(componentFilePatterns)
  const proptypes = {}

  // Parse React Components
  console.log(chalk.magenta('event'), '- parsing source code from', componentFilePatterns)
  let fileSrc
  for (const filePath of componentFilePaths) {
    fileSrc = fs.readFileSync(filePath, 'utf-8')
    Object.assign(proptypes, parseProptypes(fileSrc))
  }

  // Write to output propTypes.json file
  saveFile(propTypesFilePath, toJSON(proptypes, null, 2))

  // Output message
  console.log(
    chalk.green('Done'),
    `- parsed to ${propTypesFilePath} in ${formatDuration(Date.now() - start, {round: false, largest: 2})}`,
  )
}
