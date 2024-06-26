import * as Utils from "./utils.js"
import * as File from "./file.js"

export function downloadShortcutsFile(fileName, newShortcuts, arrayData) {
  const lengthControls = Object.keys(newShortcuts).length

  if (lengthControls <= 0 || arrayData == undefined) {
    return
  }

  for (const controlName in newShortcuts) {
    const index = arrayData.indexOf(controlName) // get ControlBar index

    // if we get the ControlBar
    if (index > -1) {
      let key = newShortcuts[controlName]["key"]
      if (Utils.isAlphaNum(key)) {
        key = key.toUpperCase()
      }
      let offset = 1
      // need to avoid to change shortcuts in commented lines
      while (!arrayData[index + offset].startsWith('"')) {
        offset++
      }

      let row = arrayData[index + offset]

      // searching for '(&.)' or '[&.]' with . as a single character
      const regexpParenthesis = new RegExp(/(\[|\()&.(\]|\))/)
      const searchPosParenthesis = row.search(regexpParenthesis)

      // delete old '(&key)'
      if (searchPosParenthesis > -1) {
        // slice and trim to remove space before '[&key]'
        row = row.replace(regexpParenthesis, "").slice(0, -1).trim() + row.slice(-1)
      }

      row = row.replaceAll("&", "")

      let searchPos
      if (Utils.isAlphaNum(key)) {
        searchPos = row.toUpperCase().search(key)
      } else {
        searchPos = row.search("\\" + key)
      }

      // new shortcut found in row
      if (searchPos > 0) {
        // add & before new shortcut's key
        row = row.slice(0, searchPos) + "&" + row.slice(searchPos)

        // new shortcut NOT found in row
      } else {
        // slice are used to keep the \" at the beginning and the end of line
        row = row.slice(0, -1).trim() + " [&" + key + "]" + row.slice(-1)
      }

      arrayData[index + offset] = row
    } else {
      console.log(controlName + " was not found")
    }
  }

  // let newFile = arrayData.join("\n")
  // newFile = File.replaceFileInBigArchive(newFile)
  // newFile = new TextEncoder("windows-1252", { NONSTANDARD_allowLegacyEncoding: true }).encode(newFile)

  const newFile = File.assembleFile(arrayData)

  download(newFile, fileName)
}

export function downloadCommandmapFile(fileName, newCommandMaps, arrayData) {
  const lengthControls = Object.keys(newCommandMaps).length

  if (lengthControls <= 0 || arrayData == undefined) {
    return
  }

  for (const commandmap in newCommandMaps) {
    const commandMapText = "CommandMap"
    const index = arrayData.indexOf(commandMapText + " " + commandmap) // get commandmap index

    // if we get the commandmap
    if (index > -1) {
      let offset = 1

      // while we haven't reached END
      while (!arrayData[index + offset].toUpperCase().startsWith('END')) {

        let row = arrayData[index + offset]
        const attribute = row.split("=")[0].trim()

        // if attribute is found
        if (attribute in newCommandMaps[commandmap]) {

          const searchPos = row.search("=")
          if (searchPos > 0) {
            // change value of attribute
            row = row.slice(0, searchPos +1) + " " + newCommandMaps[commandmap][attribute]
            
            arrayData[index + offset] = row
  
            // new shortcut NOT found in row
          } else {
            console.log(attribute + " was not found for " + commandmap)
          }
        }

        offset++
      }
    } else {
      console.log(commandmap + " was not found")
    }
  }

  const newFile = File.assembleFile(arrayData)

  download(newFile, fileName)

}

function download(content, filename) {
  const contentType = "application/octet-stream"
  const a = document.createElement("a")
  const blob = new Blob([content], { type: contentType })
  a.href = window.URL.createObjectURL(blob)
  a.download = filename
  a.click()
}
