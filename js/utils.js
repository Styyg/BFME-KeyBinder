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

// export function isLetter(str) {
//   return str.length === 1 && str.match(/[a-z]/i)
// }

export function isAlphaNum(str) {
  return str.length === 1 && str.match(/[a-z]|[0-9]/i)
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
  if (searchPos > -1 && searchPos + 1 < str.length) {
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
export async function getSrcControl(game, controlName, faction, parent) {
  const path = "../assets/images/"
  if (objGenericSrc === undefined) {
    const readGenericSrc = await readFile("../assets/data/json/genericSrcControls.json")
    objGenericSrc = JSON.parse(readGenericSrc)
  }

  if (controlName == "CONTROLBAR:FireWorks") {
    console.log()
  }
  let genericControl
  if (objGenericSrc[game][controlName] !== undefined) {
    genericControl = objGenericSrc[game][controlName]
  } else {
    if (objGenericSrc[controlName] !== undefined) {
      genericControl = objGenericSrc[controlName]
    }
  }

  let srcControl
  if (genericControl === undefined) {
    srcControl = path + faction + "/" + controlName.split(":")[1] + ".png"
  } else {
    if (genericControl[parent] === undefined) {
      srcControl = path + genericControl
    } else {
      srcControl = path + genericControl[parent]
    }
  }

  return srcControl
}

export function displayFaction(faction) {
  const mainDivFact = document.getElementById("div-faction")
  const divsFact = mainDivFact.children

  for (const divFact of divsFact) {
    if (divFact.id.toLowerCase() == faction.toLowerCase()) {
      divFact.hidden = false
    } else {
      divFact.hidden = true
    }
  }
}
