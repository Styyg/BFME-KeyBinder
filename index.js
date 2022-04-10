let arrayDataIn
// used for better treatment, but will send a broken file
let arrayDataInWithoutSpaces
let bufferData
const newFileData = {}
let currentShortcuts = {}
const arrayFaction = ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"]
const arrayBranch = ["basic", "power", "inn"]
const fileToExtract = "data\\lotr.str"
const sizePosInBigHeader = 4
let objGenericSrc

function init() {
  // document.getElementById("main-div").hidden = false
  // createHTMLComponents()
  setEventListeners()
}

function setEventListeners() {
  const inputFile = document.getElementById("inputFile")
  const btnDownload = document.getElementById("btn-download")
  let fileName

  inputFile.addEventListener("change", function selectedFileChanged() {
    if (!testFile(this.files)) return

    const mainDiv = document.getElementById("main-div")
    const loadingRoller = document.querySelector(".lds-roller")
    mainDiv.hidden = true
    loadingRoller.hidden = false

    const file = this.files[0]
    fileName = file.name

    const reader = new FileReader()
    reader.onload = function fileReadCompleted() {
      bufferData = reader.result
      const extractedFile = extractFileFromBIG(fileToExtract, bufferData)

      const regexp = getLineBreakFormat(extractedFile)

      // \t = tab, got some problems with tab at the end of control's name. map is used to trim all elements
      arrayDataInWithoutSpaces = extractedFile
        .replaceAll("\t", "")
        .split(regexp)
        .map((element) => element.trim())

      arrayDataIn = extractedFile.split(regexp)

      // reset factions div to avoid duplication
      for (const element of document.getElementsByName("branch")) {
        element.innerHTML = ""
      }
      document.getElementById("uncategorized").innerHTML = ""

      createHTMLComponents().then(() => {
        extractData(arrayDataIn).then(() => {
          mainDiv.hidden = false
          loadingRoller.hidden = true
        })
      })
    }
    // read data
    reader.readAsArrayBuffer(file)
  })

  btnDownload.addEventListener("click", () => {
    // need to run some test before accepting keys
    downloadFile(fileName)
  })
}

// extract specified file as binary from the BIGF archive
function extractFileFromBIG(fileToExtract, BIG_File) {
  // type of big file, so far i've seen only BIGF or BIG4 for BFME files
  // const decoder = new TextDecoder("utf-8")
  // const type = decoder.decode(new DataView(BIG_File, 0, 4))

  // size of the whole big archive file
  // const archiveSize = new DataView(BIG_File).getUint32(4, true)
  // number of files present in big file
  const nbFiles = new DataView(BIG_File).getUint32(8)
  // size of the header, right before files data
  // const headerSize = new DataView(BIG_File).getUint32(12)

  newFileData["allFiles"] = []

  let dataStartPos = 0
  let dataSize = 0
  // files header start at byte n°16
  let readOffset = 16
  // for each file in archive, header data are stored
  for (let i = 0; i < nbFiles; i++) {
    const headerStartPos = readOffset
    const fDataStartPos = new DataView(BIG_File).getUint32(readOffset)
    readOffset += 4
    const fDataSize = new DataView(BIG_File).getUint32(readOffset)
    readOffset += 4

    // console.log(fDataStartPos)
    // console.log(fDataSize)

    let fileName = ""
    let dataView = new DataView(BIG_File).getInt8(readOffset)
    while (dataView != "") {
      fileName += String.fromCharCode(dataView)
      readOffset++
      dataView = new DataView(BIG_File).getInt8(readOffset)
    }

    readOffset += 1 // +1 to skip the null byte

    newFileData["allFiles"].push({
      dataStartPos: fDataStartPos,
      dataSize: fDataSize,
      headerStartPos: headerStartPos,
      fileName: fileName,
    })

    if (fileName == fileToExtract) {
      // newFileData["dataStartPos"] = fDataStartPos
      // newFileData["dataSize"] = fDataSize
      // newFileData["headerStartPos"] = headerStartPos
      dataStartPos = fDataStartPos
      dataSize = fDataSize
      break
    }
  }

  console.log(newFileData)
  // return null if file is not found
  if (dataSize == 0) {
    console.log("Err: file " + fileToExtract + " not found")
    return null
  }

  // encoding: lotr.str is windows-1252 (latin1 also works), commandmap.ini is utf-8
  const decoderWindows1252 = new TextDecoder("windows-1252")
  const fileData = new DataView(BIG_File, dataStartPos, dataSize)
  const fileDataStr = decoderWindows1252.decode(fileData)
  newFileData["dataStr"] = fileDataStr

  return fileDataStr
}

function replaceFileInBigArchive(newFile) {
  const arrayFiles = newFileData["allFiles"]

  let startIndex = 0
  // get index of file to modify
  while (startIndex < arrayFiles.length && arrayFiles[startIndex]["fileName"] != fileToExtract) {
    startIndex++
  }

  const pos = arrayFiles[startIndex]["dataStartPos"]
  const size = arrayFiles[startIndex]["dataSize"]
  const headerSizePos = arrayFiles[startIndex]["headerStartPos"] + 4
  const encoded = new TextEncoder("windows-1252", { NONSTANDARD_allowLegacyEncoding: true }).encode(newFile)

  // append buffers to make the new big archive
  const newData = appendBuffer(appendBuffer(bufferData.slice(0, pos), encoded), bufferData.slice(pos + size))

  // overwrite whole archive size in header
  const dataView = new DataView(newData)
  dataView.setUint32(sizePosInBigHeader, newData.byteLength, true)

  const newFileSize = newFile.length

  // overwrite file's size in global header
  dataView.setUint32(headerSizePos, newFileSize)
  arrayFiles[startIndex]["dataSize"] = newFileSize

  // update start postion of all files after the one modified (because of the size change)
  for (let i = startIndex + 1; i < arrayFiles.length; i++) {
    const headerPos = arrayFiles[i]["headerStartPos"]
    const newStartPos = arrayFiles[i - 1]["dataStartPos"] + arrayFiles[i - 1]["dataSize"]

    dataView.setUint32(headerPos, newStartPos)
    arrayFiles[i]["dataStartPos"] = newStartPos
  }

  return newData
}

function appendBuffer(buffer1, buffer2) {
  let tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
  tmp.set(new Uint8Array(buffer1), 0)
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
  return tmp.buffer
}

function getNavigatorLanguage() {
  let language
  if (navigator.browserLanguage) {
    language = navigator.browserLanguage
  } else {
    language = navigator.language
  }

  return language
}

function displayFaction(faction) {
  for (const fact of arrayFaction) {
    if (fact == faction) {
      document.getElementById(fact).hidden = false
    } else {
      document.getElementById(fact).hidden = true
    }
  }
}

function toggleDisplayChilds(element) {
  const children = element.querySelectorAll(":scope > .control-main")
  if (children.length > 0) {
    const hidden = children[0].hidden

    for (const child of children) {
      child.hidden = !hidden
    }
  }
}

async function createRowControl(obj, faction, controlName, HTMLparent, gen, parent) {
  const arrayNames = document.getElementsByName(controlName)
  const elementId = document.getElementById(controlName)
  const id = { idMain: "", idCurrent: "", idNew: "", idDesc: "" }
  const name = { nameMain: "", nameCurrent: "", nameNew: "", nameDesc: "" }
  let hidden

  if (gen > 0) {
    hidden = "hidden"
  } else {
    hidden = ""
  }

  // neither id or name found, id is set
  // if (arrayNames.length == 0 && elementId === null) {
  //   id["idMain"] = controlName
  //   id["idCurrent"] = controlName + "-current"
  //   id["idNew"] = controlName + "-new"
  //   id["idDesc"] = controlName + "-desc"
  // }

  // elements with name are found OR id is found, name is set
  // if (arrayNames.length > 0 || elementId !== null) {
  // name["nameMain"] = controlName
  // name["nameCurrent"] = controlName + "-current"
  // name["nameNew"] = controlName + "-new"
  // name["nameDesc"] = controlName + "-desc"
  const nameMain = controlName
  const nameCurrent = nameMain + "-current"
  const nameNew = nameMain + "-new"
  const nameDesc = nameMain + "-desc"
  // }

  // element with id is found, delete id as name is now set
  // if (elementId !== null) {
  //   const elementCurrent = document.getElementById(controlName + "-current")
  //   const elementNew = document.getElementById(controlName + "-new")
  //   const elementDesc = document.getElementById(controlName + "-desc")

  //   elementId.setAttribute("name", name["nameMain"])
  //   elementCurrent.setAttribute("name", name["nameCurrent"])
  //   elementNew.setAttribute("name", name["nameNew"])
  //   elementDesc.setAttribute("name", name["nameDesc"])

  //   elementId.removeAttribute("id")
  //   elementCurrent.removeAttribute("id")
  //   elementNew.removeAttribute("id")
  //   elementDesc.removeAttribute("id")
  // }

  const srcControl = await getSrcControl(controlName, faction, parent)
  // const label = controlName.split(":")[1]

  const numberOfChilds = Object.keys(obj[controlName]).length
  let divArrow = ""
  let toggleClick = ""
  if (numberOfChilds > 0) {
    divArrow = `<div class="arrow-container">
      <div class="arrow"></div>
    </div>`
    toggleClick = "toggleClick"
  }

  const newDiv = `<div name="${nameMain}" class="control-main ${faction}" ${hidden}>
    <div class="${toggleClick}">
      <div class="control-row">
        <img class="icon" src="./assets/images/${srcControl}">

        <div class="description" name="${nameDesc}" >
          ${controlName}
        </div>
        <div class="shortcuts">
          <label>Shortcut</label>

          <div class="current-new">
              <div>
                  current : <label class="current" name="${nameCurrent}"></label>
              </div>
              <div>
                  new : <input name="${nameNew}" class="small-input" maxlength="1"></input>
              </div>
          </div>
        </div>
      </div>
      ${divArrow}
      </div>
  </div>`

  // add html element to parent
  HTMLparent.insertAdjacentHTML("beforeend", newDiv)
  // const currentDiv = HTMLparent.lastChild

  // if (arrayNames.length > 0 || elementId !== null) {
  //   addInputForDuplicates(nameNew)
  addIdInput(nameNew)
  // }
}

function addPreviewChilds() {
  const allControlRowElements = document.querySelectorAll(".control-main")

  for (const controlElement of allControlRowElements) {
    const allChildrenControls = controlElement.querySelectorAll(":scope > .control-main")

    let src = []
    for (const child of allChildrenControls) {
      const source = child.querySelector("img.icon").src
      if (source !== undefined && !src.includes(source)) {
        src.push(source)
      }
    }

    let divImg = ""
    for (const item of src) {
      divImg += `<img src="${item}" class="icon-preview">`
    }
    if (divImg !== "") {
      const divPreview = `<div class="preview">
        <div>
          ${divImg}
        </div>
      </div>`

      const control = controlElement.querySelector(".control-row")
      control.insertAdjacentHTML("beforeend", divPreview)
    }
  }
}

// add toggle display on click
function addToggleEventListeners() {
  const elements = document.querySelectorAll(".toggleClick")
  for (const el of elements) {
    el.addEventListener("click", (e) => {
      if (e.target.nodeName != "INPUT") {
        toggleDisplayChilds(el.parentElement)
      }
    })
  }
}

// some controls can't have shortcuts like inn, power menu etc, shortcuts elements are disabled for thoses
async function deleteShortcutsForExceptions() {
  const exceptions = await readFile("./assets/data/json/exceptions.json")
  const objExceptions = JSON.parse(exceptions)

  for (const controlName in objExceptions) {
    const elementById = document.getElementById(controlName)

    if (elementById !== null) {
      elementById.querySelector(".shortcuts").innerHTML = ""
    } else {
      const elementsByNames = document.getElementsByName(controlName)

      for (const element of elementsByNames) {
        element.querySelector(".shortcuts").innerHTML = ""
      }
    }

    const elements = getElementsByIdAndNames(controlName + "-new")
    for (const elem of elements) {
      elem.remove()
    }
  }
}

function addIdInput(id) {
  // add new input
  let input
  if (document.getElementById(id) === null) {
    const newInput = `<input id="${id}" maxlength="1" type="text"></input>`
    const divShortcuts = document.getElementById("new-shortcuts")
    divShortcuts.insertAdjacentHTML("beforeend", newInput)
    input = divShortcuts.lastChild
  } else {
    input = document.getElementById(id)
  }

  // add event listeners, so all components with same name get same value when changed
  const elements = document.getElementsByName(id)
  elements.forEach((element) => {
    element.addEventListener("input", () => {
      input.value = element.value

      const sameNameElements = document.getElementsByName(element.getAttribute("name"))
      sameNameElements.forEach((elem) => {
        if (elem != element) {
          elem.value = element.value
        }
      })
    })
  })
}

async function createHTMLComponents() {
  const readControlsFactionTree = await readFile("./assets/data/json/controlsFactionTree.json")
  const objControlsFactionTree = JSON.parse(readControlsFactionTree)

  for (const faction of arrayFaction) {
    for (const branch of arrayBranch) {
      const HTMLparent0 = document.getElementById(faction + "-" + branch)
      // generation 0
      for (const controlName_0 in objControlsFactionTree[faction][branch]) {
        const gen = 0
        await createRowControl(objControlsFactionTree[faction][branch], faction, controlName_0, HTMLparent0, gen)
        const HTMLparent1 = HTMLparent0.lastChild

        // generation 1
        for (const controlName_1 in objControlsFactionTree[faction][branch][controlName_0]) {
          const gen = 1
          await createRowControl(objControlsFactionTree[faction][branch][controlName_0], faction, controlName_1, HTMLparent1, gen, controlName_0)
          const HTMLparent2 = HTMLparent1.lastChild

          // generation 2
          for (const controlName_2 in objControlsFactionTree[faction][branch][controlName_0][controlName_1]) {
            const gen = 2
            await createRowControl(
              objControlsFactionTree[faction][branch][controlName_0][controlName_1],
              faction,
              controlName_2,
              HTMLparent2,
              gen,
              controlName_1
            )
            const HTMLparent3 = HTMLparent2.lastChild

            // generation 3
            for (const controlName_3 in objControlsFactionTree[faction][branch][controlName_0][controlName_1][controlName_2]) {
              const gen = 3
              await createRowControl(
                objControlsFactionTree[faction][branch][controlName_0][controlName_1][controlName_2],
                faction,
                controlName_3,
                HTMLparent3,
                gen,
                controlName_2
              )
            }
          }
        }
      }
    }
  }

  deleteShortcutsForExceptions()
  addToggleEventListeners()
  addPreviewChilds()
}

// extract data from file and apply them to HTML components
async function extractData(arrayData) {
  const controlsDesc = await getControlsDesc(arrayData)
  const exceptions = await readFile("./assets/data/json/exceptions.json")
  const objExceptions = JSON.parse(exceptions)

  for (const controlName in controlsDesc) {
    const elementsDesc = getElementsByIdAndNames(controlName + "-desc")

    // if the control is found in the input file
    if (controlsDesc[controlName]["found"]) {
      // apply description for all same elements
      let desc = controlsDesc[controlName]["desc"]
      if (desc !== undefined) {
        desc = desc.replaceAll('"', "")
      }
      for (const elemDesc of elementsDesc) {
        elemDesc.innerText = desc.replace("&", "")
      }

      // if the element can have a shortcut (even if there isn't any)
      if (objExceptions[controlName] === undefined) {
        // apply current shortcut
        const shortcut = getShortcut(desc)
        currentShortcuts[controlName] = shortcut
        const elementsCurrent = getElementsByIdAndNames(controlName + "-current")
        for (const elemCurrent of elementsCurrent) {
          elemCurrent.innerText = shortcut
        }
      } else {
        // inputs are disabled
        const elementsNew = getElementsByIdAndNames(controlName + "-new")
        for (const elemNew of elementsNew) {
          elemNew.disabled = true
        }
      }
    } else {
      // description with MISSING
      for (const elemDesc of elementsDesc) {
        elemDesc.innerHTML = "MISSING: " + elemDesc.innerHTML
      }

      // control-main elements are disabled
      const elementsMain = getElementsByIdAndNames(controlName)
      for (const elemMain of elementsMain) {
        elemMain.classList = "control-main disabled"
      }

      // inputs are disabled
      const elementsNew = getElementsByIdAndNames(controlName + "-new")
      for (const elemNew of elementsNew) {
        elemNew.disabled = true
      }
    }
  }
}

function getElementsByIdAndNames(name) {
  let elements = []
  const byId = document.getElementById(name)
  // get element by Id
  if (byId !== null) {
    elements.push(byId)
  }

  // get elements by name
  const byName = document.getElementsByName(name)
  for (const el of byName) {
    elements.push(el)
  }

  return elements
}

function downloadFile(fileName) {
  const newShortcuts = {}
  for (const element in currentShortcuts) {
    inputNewKey = document.getElementById(element + "-new")
    if (inputNewKey !== null) {
      key = inputNewKey.value.toUpperCase()

      if (isLetter(key)) {
        newShortcuts[element] = {}
        newShortcuts[element]["key"] = key
      } else if (key) {
        // console.log(inputNewKey.parentNode);
        // inputNewKey.classList.add("is-invalid");
      }
    } else {
      console.log("getElementById(" + element + "-new)" + " not found")
    }
  }

  const lengthControls = Object.keys(newShortcuts).length
  if (lengthControls > 0) {
    const newFile = getFileWithNewShortcuts(newShortcuts)
    // const encoded = new TextEncoder("windows-1252", { NONSTANDARD_allowLegacyEncoding: true }).encode(newFile)
    // download(encoded, fileName)
    download(newFile, fileName)
  }
}

async function getSrcControl(controlName, faction, parent) {
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

// { 'controlName': 'control description'}
async function getControlsDesc(arrayDataIn) {
  const readControlsList = await readFile("./assets/data/json/controlsList.json")
  let objControlsList = JSON.parse(readControlsList)
  // let controlsData = objControlsList

  for (const controlName in objControlsList) {
    objControlsList[controlName] = {}
    // if (arrayDataIn.includes(controlName)) {
    if (arrayDataInWithoutSpaces.includes(controlName)) {
      // const index = arrayDataIn.indexOf(controlName)
      objControlsList[controlName]["found"] = true
      const index = arrayDataInWithoutSpaces.indexOf(controlName)
      let offset = 1
      while (!arrayDataInWithoutSpaces[index + offset].startsWith('"')) {
        offset++
      }
      objControlsList[controlName]["desc"] = arrayDataIn[index + offset]
    } else {
      objControlsList[controlName]["found"] = false
    }
  }
  return objControlsList
}

function testFile(files) {
  const maxFileSize = 10 * (1024 * 1024) //10MB
  const allowedExtension = ["str", "big"]
  const file = files[0]
  const errLabel = document.getElementById("errInputFile")

  // no file
  if (files.length === 0) {
    errLabel.style.visibility = "hidden"
    return
  }

  // not right file extension
  const array = file.name.split(".")
  const extensionName = array[array.length - 1]
  if (!allowedExtension.includes(extensionName)) {
    errLabel.textContent = "Invalid format, .str or .big is required"
    errLabel.style.visibility = "visible"
    return
  }

  // wrong file size
  if (file.size > maxFileSize) {
    console.log("File selected is too big : " + parseInt(file.size / (1024 * 1024)) + "Mo, max is : " + maxFileSize / (1024 * 1024) + "Mo")
    errLabel.textContent = "File selected is too big, " + maxFileSize / (1024 * 1024) + "Mo max"
    errLabel.style.visibility = "visible"
    return
  }

  errLabel.style.visibility = "hidden"
  return true
}

// some files had different line break format varying between \n and \r\n
function getLineBreakFormat(str) {
  let reg
  if (str.search("\r\n") > -1) {
    reg = /\r\n/
  } else {
    reg = /\n/
  }

  return reg
}

function getShortcut(str) {
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

function getFileWithNewShortcuts(newShortcuts) {
  for (const controlName in newShortcuts) {
    index = arrayDataInWithoutSpaces.indexOf(controlName) // get ControlBar index

    // if we get the ControlBar
    if (index > -1) {
      key = newShortcuts[controlName]["key"]
      offset = 1
      // need to avoid to change shortcuts in commented lines
      // while (arrayDataIn[index + offset].startsWith("//")) {
      while (!arrayDataInWithoutSpaces[index + offset].startsWith('"')) {
        offset++
      }

      let row = arrayDataInWithoutSpaces[index + offset]

      // searching for '(&.)' or '[&.]' with . as a single character
      const regexpParenthesis = new RegExp("(\\[|\\()&.(\\]|\\))")
      const searchPosParenthesis = row.search(regexpParenthesis)

      // delete old '(&key)'
      if (searchPosParenthesis > -1) {
        // slice and trim to remove space before '[&key]'
        row = row.replace(regexpParenthesis, "").slice(0, -1).trim() + row.slice(-1)
      }

      row = row.replaceAll("&", "")
      searchPos = row.toUpperCase().search(key)

      // new shortcut found in row
      if (searchPos > -1) {
        // add & before new shortcut's key
        row = row.slice(0, searchPos) + "&" + row.slice(searchPos)

        // new shortcut NOT found in row
      } else {
        // slice are used to keep the \" at the beginning and the end of line
        row = row.slice(0, -1).trim() + " [&" + key + "]" + row.slice(-1)
      }

      arrayDataIn[index + offset] = row
    } else {
      console.log(controlName + " was not found")
    }
    // })
  }

  const newFile = arrayDataIn.join("\n")
  const bigFile = replaceFileInBigArchive(newFile)

  return bigFile
}

function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i)
}

async function readFile(path) {
  let response = await fetch(path)
  // read response stream as text
  let text_data = await response.text()
  return text_data
}

// const text = "le contenu du fichier"
// const encoded = new TextEncoder("windows-1252",{ NONSTANDARD_allowLegacyEncoding: true }).encode(text);
// download(encoded, file.name);
function download(content, filename, contentType) {
  if (!contentType) contentType = "application/octet-stream"
  let a = document.createElement("a")
  let blob = new Blob([content], { type: contentType })
  a.href = window.URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

init()
