let arrayDataIn
// used for better treatment, but will send a broken file
let arrayDataInWithoutSpaces
let regexp
let currentShortcuts = {}
const arrayFaction = ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"]
const arrayBranch = ["basic", "power", "inn"]
let objGenericSrc

function init() {
  document.getElementById("main-div").hidden = false
  createHTMLComponents()
  setEventListeners()
}

function setEventListeners() {
  const inputFile = document.getElementById("inputFile")
  const btnDownload = document.getElementById("btn-download")
  const btnUncategorized = document.getElementById("btn-uncategorized")
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
      rawDataIn = reader.result
      // console.log(rawDataIn)
      // console.log(JSON.stringify(rawDataIn)) // used to see \n and \r in console

      regexp = getLineBreakFormat(rawDataIn)

      // \t = tab, got some problems with tab at the end of control's name. map is used to trim all elements
      arrayDataInWithoutSpaces = rawDataIn
        .replaceAll("\t", "")
        .split(regexp)
        .map((element) => element.trim())

      arrayDataIn = rawDataIn.split(regexp)

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
    reader.readAsText(file, "windows-1252")
  })

  btnDownload.addEventListener("click", () => {
    // need to run some test before accepting keys
    downloadFile(fileName)
  })

  btnUncategorized.addEventListener("click", () => {
    div = document.getElementById("div-uncategorized")
    if (div.hidden) {
      div.hidden = false
      btnUncategorized.innerText = "Hide uncategorized controls"
    } else {
      div.hidden = true
      btnUncategorized.innerText = "Show uncategorized controls"
    }
  })
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

function toggleDisplayChildsAfterMe(me) {
  const arrayChildren = Array.from(me.parentNode.children)
  const index = arrayChildren.indexOf(me)
  const hidden = arrayChildren[index + 1].hidden

  for (i = index + 1; i < arrayChildren.length; i++) {
    arrayChildren[i].hidden = !hidden
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
  if (arrayNames.length == 0 && elementId === null) {
    id["idMain"] = controlName
    id["idCurrent"] = controlName + "-current"
    id["idNew"] = controlName + "-new"
    id["idDesc"] = controlName + "-desc"
  }

  // elements with name are found OR id is found, name is set
  if (arrayNames.length > 0 || elementId !== null) {
    name["nameMain"] = controlName
    name["nameCurrent"] = controlName + "-current"
    name["nameNew"] = controlName + "-new"
    name["nameDesc"] = controlName + "-desc"
  }

  // element with id is found, delete id as name is now set
  if (elementId !== null) {
    const elementCurrent = document.getElementById(controlName + "-current")
    const elementNew = document.getElementById(controlName + "-new")
    const elementDesc = document.getElementById(controlName + "-desc")

    elementId.setAttribute("name", name["nameMain"])
    elementCurrent.setAttribute("name", name["nameCurrent"])
    elementNew.setAttribute("name", name["nameNew"])
    elementDesc.setAttribute("name", name["nameDesc"])

    elementId.removeAttribute("id")
    elementCurrent.removeAttribute("id")
    elementNew.removeAttribute("id")
    elementDesc.removeAttribute("id")
  }

  const srcControl = await getSrcControl(controlName, faction, parent)
  // const label = controlName.split(":")[1]

  const numberOfChilds = Object.keys(obj[controlName]).length
  let divArrow = ""
  if (numberOfChilds > 0) {
    divArrow = `<div class="arrow-container">
      <div class="arrow"></div>
    </div>`
  }

  const newDiv = `<div id="${id["idMain"]}" name="${name["nameMain"]}" class="control-main ${faction}" ${hidden}>
    <div class="control-row">
      <img class="icon" src="./assets/images/${srcControl}">

      <div class="description" id="${id["idDesc"]}" name="${name["nameDesc"]}" >
        ${controlName}
      </div>
      <div class="shortcuts">
        <label>Shortcut</label>

        <div class="current-new">
            <div>
                current : <label class="current" id="${id["idCurrent"]}" name="${name["nameCurrent"]}"></label>
            </div>
            <div>
                new : <input id="${id["idNew"]}" name="${name["nameNew"]}" class="small-input" maxlength="1"></input>
            </div>
        </div>
      </div>
    </div>
    ${divArrow}
  </div>`

  // add html element to parent
  HTMLparent.insertAdjacentHTML("beforeend", newDiv)
  const currentDiv = HTMLparent.lastChild

  if (arrayNames.length > 0 || elementId !== null) {
    addInputForDuplicates(name["nameNew"])
  }
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
        ${divImg}
      </div>`

      const control = controlElement.querySelector(":scope > .control-row")
      control.insertAdjacentHTML("beforeend", divPreview)
    }
  }
}

function addArrowsEventListeners() {
  const arrowContainers = document.querySelectorAll(".arrow-container")
  for (const element of arrowContainers) {
    element.addEventListener("click", () => {
      toggleDisplayChildsAfterMe(element)
    })
  }
}

function addInputForDuplicates(id) {
  // add new input
  let input
  if (document.getElementById(id) === null) {
    const newInput = `<input id="${id}" maxlength="1" type="text"></input>`
    const divDuplicates = document.getElementById("duplicates")
    divDuplicates.insertAdjacentHTML("beforeend", newInput)
    input = divDuplicates.lastChild
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

  addArrowsEventListeners()
  addPreviewChilds()
}

// extract data from file and apply them to HTML components
async function extractData(arrayData) {
  const controlsData = await getControlsData(arrayData)

  for (const controlName in controlsData) {
    const elementMain = document.getElementById(controlName)
    let desc = controlsData[controlName]["desc"]
    if (desc !== undefined) {
      desc = desc.replaceAll('"', "")
    }

    // if the control is found in file
    if (controlsData[controlName]["found"]) {
      const shortcut = getShortcut(desc)

      currentShortcuts[controlName] = shortcut

      // if id give nothing, start searching for names
      if (elementMain !== null) {
        const elementCurrent = document.getElementById(controlName + "-current")
        const elementDesc = document.getElementById(controlName + "-desc")

        elementCurrent.innerText = shortcut
        elementDesc.innerText = desc.replace("&", "")
      } else {
        const elementsCurrent = document.getElementsByName(controlName + "-current")
        const elementsDesc = document.getElementsByName(controlName + "-desc")

        elementsCurrent.forEach((element) => {
          element.innerText = shortcut
        })
        elementsDesc.forEach((element) => {
          element.innerText = desc.replace("&", "")
        })
      }

      // when the control is not found, inputs are disabled
    } else {
      // console.log(controlName)

      if (elementMain !== null) {
        const elementNew = document.getElementById(controlName + "-new")
        const elementDesc = document.getElementById(controlName + "-desc")

        elementMain.classList = "control-main disabled"
        elementNew.setAttribute("disabled", true)
        elementDesc.innerHTML = "MISSING: " + elementDesc.innerHTML
      } else {
        const elementsMain = document.getElementsByName(controlName)
        const elementsNew = document.getElementsByName(controlName + "-new")
        const elementsDesc = document.getElementsByName(controlName + "-desc")

        elementsMain.forEach((elem) => {
          elem.classList = "control-main disabled"
        })
        elementsNew.forEach((elem) => {
          elem.setAttribute("disabled", true)
        })
        elementsDesc.forEach((elem) => {
          elem.innerHTML = "MISSING: " + elem.innerHTML
        })
      }
    }
  }
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
    const encoded = new TextEncoder("windows-1252", { NONSTANDARD_allowLegacyEncoding: true }).encode(newFile)
    download(encoded, fileName)
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
async function getControlsData(arrayDataIn) {
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
  const maxFileSize = 2 * 1024 * 1024 //2MB
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
    console.log("File selected is too big : " + file.size + "o, max is : " + maxFileSize + "o")
    errLabel.textContent = "File selected is too big, 2Mo max"
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
  const arrayControlsNames = Object.keys(newShortcuts)

  arrayControlsNames.forEach((controlName) => {
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
  })

  let newFile
  if (regexp.source == "\\r\\n") newFile = arrayDataIn.join("\r\n")
  else newFile = arrayDataIn.join("\n")

  return newFile
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
