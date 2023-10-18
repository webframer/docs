import { hasListValue, isString, toJSON, toList } from '@webframer/js'
import fs from 'fs'
import path from 'path'

const HELP_INFO = 'For more info, see https://www.npmjs.com/package/webframe-docs'
export const configFileName = 'webframe.docs.json'
export const configDefault = {
  'projects': [
    {
      'inputComponents': [ // can be an array of paths
        '!**/node_modules',
        './components/**/*.{js,jsx}',
      ],
      'inputDocs': './docs', // must be a single glob string to replace input with output dir
      'outputDocs': './pages/docs', // must be directory path, not glob pattern
      'outputPropTypes': './src/propTypes.json',
    },
  ],
}

// Directory path where the command is called (should have 'webframe.docs.json' file)
export const workDir = process.cwd()
export const configFilePath = path.resolve(workDir, configFileName)

// Webframe Docs Config ----------------------------------------------------------------------------
export function getConfig () {
  let config = configDefault
  let configFileContent

  try {
    configFileContent = fs.readFileSync(configFilePath, 'utf-8')
  } catch (err) {
    console.log(`No '${configFileName}' file found at '${workDir}', using default:\n${toJSON(configDefault, null, 2)}\n${HELP_INFO}`)
  }

  if (configFileContent) {
    try {
      config = JSON.parse(configFileContent)
      config = Object.assign({}, configDefault, config) // extend default config
    } catch (err) {
      console.error(`❌ A valid '${configFileName}' file is required!
  Got ${err}.\n${HELP_INFO}`)
      process.exit(1)
    }
  }

  // Validate configs ------------------------------------------------------------------------------

  if (!hasListValue(config.projects)) {
    console.error(`✋ Please configure "projects" inside '${configFileName}', then try again.\n${HELP_INFO}`)
    process.exit(1)
  }

  let error
  config.projects.find(({
    inputComponents = configDefault.projects[0].inputComponents,
    inputDocs = configDefault.projects[0].inputDocs,
    outputDocs = configDefault.projects[0].outputDocs,
    outputPropTypes = configDefault.projects[0].outputPropTypes,
  }) => {
    if (toList(inputComponents).find((str) => {
      if (!isValidPath(str)) {
        error = {inputComponents}
        return true
      }
    })) return true

    if (!isValidPath(inputDocs)) {
      error = {inputDocs}
      return true
    }

    if (!isValidPath(outputDocs) || String(outputDocs).includes('*')) {
      error = {outputDocs}
      return true
    }

    if (!isValidPath(outputPropTypes) || String(outputPropTypes).includes('*')) {
      error = {outputPropTypes}
      return true
    }
  })

  if (error) {
    console.error(`✋ Invalid "projects" config inside '${configFileName}', expecting a directory path in\n${JSON.stringify(error, null, 2)}.\n${HELP_INFO}`)
    process.exit(1)
  }

  return config
}

function isValidPath (value) {
  return isString(value)
}
