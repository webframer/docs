import { longestCommonSubstring } from '@webframer/js'
import { saveFile } from 'compiler/utils/file.js'
import { componentPropsInterface } from 'compiler/utils/propType.js'
import {
  createDtsFromJSX,
  JSX_FILE_EXTENSION_REPLACE_REGEX,
  transpileJSX,
  updateDtsPropTypes,
} from 'compiler/utils/ts.js'
import { readFile, writeFile } from 'core/utils/file.js'
import path from 'path'

/**
 * Parse source code of React Components to create TypeScript declarations in *.d.ts files.
 * todo: write test
 * @param {string[]} filePaths - absolute file paths for JSX component files
 * @param {object} o - options
 * @param {object} o.propTypes - JSON manifest for all Component.propTypes and .defaultProps
 * @param {string} o.transpiledDir - absolute directory path of transpiled JSX files
 * @returns {Promise<string[]>} filePaths - saved *.d.ts absolute file paths
 */
export async function compileDts (filePaths, {transpiledDir, propTypes}) {
  // Note: a single file may contain multiple Components, so the map must be by Component name
  const componentByName = {}

  // Transpile components, save them to `transpiledDir`, and dynamic import for updated live propTypes
  await Promise.all(filePaths.map(p => {
    const filePath = p.replace(JSX_FILE_EXTENSION_REPLACE_REGEX, '.js')
    const baseDir = longestCommonSubstring(filePath, transpiledDir)
    const relativeFilePath = filePath.replace(baseDir, '')
    const transpiledPath = path.resolve(transpiledDir, relativeFilePath)
    saveFile(transpiledPath, transpileJSX(readFile(p)))
    return import(transpiledPath)
      .then(module => {
        for (const key in module) {
          const maybeComponent = module[key]
          if (maybeComponent?.propTypes && maybeComponent.name)
            componentByName[maybeComponent.name] = maybeComponent
        }
      })
      .catch(console.error) // errors must be fixed, else components will not compile
  }))

  // Compute new componentProps
  const componentPropsByName = {}
  for (const name in componentByName) {
    componentPropsByName[name] = componentPropsInterface(componentByName[name], propTypes)
  }

  // Create *.d.ts files
  let dtsFileMap = createDtsFromJSX(filePaths)
  dtsFileMap = updateDtsPropTypes(dtsFileMap, componentPropsByName)

  // Save *.d.ts files
  for (const filePath in dtsFileMap) {
    writeFile(filePath, dtsFileMap[filePath].content)
  }

  return Object.keys(dtsFileMap)
}
