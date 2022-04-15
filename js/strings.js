import * as Utils from "./utils.js"
import * as File from "./file.js"

const fileToExtract = "data\\lotr.str"

function init() {
  // document.getElementById("main-div").hidden = false
  // createHTMLComponents()
  setEventListeners()
}

function setEventListeners() {
  const inputFile = document.getElementById("inputFile")
  const btnDownload = document.getElementById("btn-download")
  // id starting with 'display'
  const iconFaction = document.querySelectorAll("[id ^= 'display']")
  let arrayDataIn
  let arrayDataInWithoutSpaces // used for better treatment
  let fileName
  let extensionName

  inputFile.addEventListener("change", function selectedFileChanged() {
    if (!Utils.testFile(this.files)) return

    const mainDiv = document.getElementById("main-div")
    const loadingRoller = document.querySelector(".lds-roller")
    mainDiv.hidden = true
    loadingRoller.hidden = false

    const file = this.files[0]
    fileName = file.name

    const reader = new FileReader()
    reader.onload = function fileReadCompleted() {
      const data = reader.result
      let extractedFile
      if (extensionName == "big") {
        // need to extract file from big archive
        extractedFile = File.extractFileFromBIG(data, fileToExtract)

        if (extractedFile == null) {
          errFileNotFound()
          loadingRoller.hidden = true
          return
        }
      } else {
        // no need to extract file
        extractedFile = data
      }

      // \t = tab, got some problems with tab at the end of control's name. map is used to trim all elements
      arrayDataInWithoutSpaces = Utils.splitByLineBreak(extractedFile.replaceAll("\t", "")).map((element) => element.trim())
      arrayDataIn = Utils.splitByLineBreak(extractedFile)

      // reset factions div to avoid duplication
      for (const element of document.getElementsByName("branch")) {
        element.innerHTML = ""
      }
      document.getElementById("uncategorized").innerHTML = ""

      createHTMLComponents().then(() => {
        extractData(arrayDataIn, arrayDataInWithoutSpaces).then(() => {
          mainDiv.hidden = false
          loadingRoller.hidden = true
        })
      })
    }

    const fileNameSplit = fileName.split(".")
    extensionName = fileNameSplit[fileNameSplit.length - 1]

    // read data
    if (extensionName == "big") {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file, "windows-1252")
    }
  })

  btnDownload.addEventListener("click", () => {
    // need to run some test before accepting keys
    const isBigArchive = extensionName == "big"
    File.downloadStringsFile(fileName, arrayDataIn, arrayDataInWithoutSpaces, isBigArchive, fileToExtract)
  })

  for (const img of iconFaction) {
    img.addEventListener("click", () => {
      const faction = img.id.slice("display".length)
      displayFaction(faction)
    })
  }
}

function errFileNotFound() {
  console.log("file not found")
  const errLabel = document.getElementById("errInputFile")
  errLabel.innerText = fileToExtract + " was not found in big archive"
  errLabel.hidden = false
}

function displayFaction(faction) {
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

  const nameMain = controlName
  const nameCurrent = nameMain + "-current"
  const nameNew = nameMain + "-new"
  const nameDesc = nameMain + "-desc"

  const srcControl = await Utils.getSrcControl(controlName, faction, parent)
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
        <img class="icon" src="${srcControl}">

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

  addNewShortcutsInput(nameNew)
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
  const exceptions = await File.readFile("../assets/data/json/exceptions.json")
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

    document.getElementById(controlName + "-new").remove()
    // const elements = getElementsByIdAndNames(controlName + "-new")
    // for (const elem of elements) {
    //   elem.remove()
    // }
  }
}

function addNewShortcutsInput(id) {
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
  const arrayFaction = ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"]
  const arrayBranch = ["basic", "power", "inn"]
  const readControlsFactionTree = await File.readFile("../assets/data/json/controlsFactionTree.json")
  const objControlsFactionTree = JSON.parse(readControlsFactionTree)

  // create all rows for shortcurts
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
async function extractData(arrayData, arrayDataInWithoutSpaces) {
  const controlsDesc = await getControlsDesc(arrayData, arrayDataInWithoutSpaces)
  const exceptions = await File.readFile("../assets/data/json/exceptions.json")
  const objExceptions = JSON.parse(exceptions)

  for (const controlName in controlsDesc) {
    // const elementsDesc = getElementsByIdAndNames(controlName + "-desc")
    const elementsDesc = document.getElementsByName(controlName + "-desc")

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
        const shortcut = Utils.getShortcut(desc)
        // const elementsCurrent = getElementsByIdAndNames(controlName + "-current")
        const elementsCurrent = document.getElementsByName(controlName + "-current")
        for (const elemCurrent of elementsCurrent) {
          elemCurrent.innerText = shortcut
        }
      } else {
        // inputs are disabled
        // const elementsNew = getElementsByIdAndNames(controlName + "-new")
        const elementsNew = document.getElementsByName(controlName + "-new")
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
      // const elementsMain = getElementsByIdAndNames(controlName)
      const elementsMain = document.getElementsByName(controlName)
      for (const elemMain of elementsMain) {
        // elemMain.classList = "control-main disabled"
        elemMain.querySelector(".control-row").classList = "control-row disabled"
      }

      // inputs are disabled
      // const elementsNew = getElementsByIdAndNames(controlName + "-new")
      if (document.getElementById(controlName + "-new") != null) {
        document.getElementById(controlName + "-new").remove()
      }
      const elementsNew = document.getElementsByName(controlName + "-new")
      for (const elemNew of elementsNew) {
        elemNew.disabled = true
      }
    }
  }
}

// { 'controlName': 'control description'}
async function getControlsDesc(arrayDataIn, arrayDataInWithoutSpaces) {
  const readControlsList = await File.readFile("../assets/data/json/controlsList.json")
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

init()
