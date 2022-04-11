import { readFile } from "./file.js"

export function testFile(files) {
  const maxFileSize = 10 * (1024 * 1024) //10MB
  const allowedExtension = ["str", "big"]
  const file = files[0]
  const errLabel = document.getElementById("errInputFile")

  // no file
  if (files.length === 0) {
    errLabel.hidden = true
    return
  }

  // not right file extension
  const array = file.name.split(".")
  const extensionName = array[array.length - 1]
  if (!allowedExtension.includes(extensionName)) {
    errLabel.textContent = "Invalid format, .str or .big is required"
    errLabel.hidden = false
    return
  }

  // wrong file size
  if (file.size > maxFileSize) {
    console.log("File selected is too big : " + parseInt(file.size / (1024 * 1024)) + "Mo, max is : " + maxFileSize / (1024 * 1024) + "Mo")
    errLabel.textContent = "File selected is too big, " + maxFileSize / (1024 * 1024) + "Mo max"
    errLabel.hidden = false
    return
  }

  errLabel.hidden = true
  return true
}

export function appendBuffer(buffer1, buffer2) {
  let tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
  tmp.set(new Uint8Array(buffer1), 0)
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
  return tmp.buffer
}

export function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i)
}

// some files had different line break format varying between \n and \r\n
export function splitByLineBreak(str) {
  let reg
  if (str.search("\r\n") > -1) {
    reg = /\r\n/
  } else {
    reg = /\n/
  }

  return str.split(reg)
}

export function getShortcut(str) {
  if (str === undefined) {
    return ""
  }
  const searchPos = str.search("&")
  if (searchPos > -1 && isLetter(str.charAt(searchPos + 1))) {
    return str.charAt(searchPos + 1).toUpperCase()
  } else {
    return ""
  }
}

export function getNavigatorLanguage() {
  let language
  if (navigator.browserLanguage) {
    language = navigator.browserLanguage
  } else {
    language = navigator.language
  }

  return language
}

let objGenericSrc
// get the string of the src of image matching the controlName
export async function getSrcControl(controlName, faction, parent) {
  if (objGenericSrc === undefined) {
    const readGenericSrc = await readFile("./assets/data/json/genericSrcControls.json")
    objGenericSrc = JSON.parse(readGenericSrc)
  }
  let srcControl
  if (objGenericSrc[controlName] === undefined) {
    srcControl = faction + "/" + controlName.split(":")[1] + ".png"
  } else {
    if (objGenericSrc[controlName][parent] === undefined) {
      srcControl = "generic/" + objGenericSrc[controlName]
    } else {
      srcControl = "generic/" + objGenericSrc[controlName][parent]
    }
  }

  return srcControl
}
