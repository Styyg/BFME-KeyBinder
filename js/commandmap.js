import * as Utils from "./utils.js"
import * as File from "./file.js"

const fileToExtract = "commandmap.ini"

function init() {
  // document.getElementById("main-div").hidden = false
  // createHTMLComponents()
  setEventListeners()
}

function setEventListeners() {
  const inputFile = document.getElementById("inputFile")
  const btnDownload = document.getElementById("btn-download")
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

      createHTMLComponents(getCommandMaps(arrayDataIn))

      mainDiv.hidden = false
      loadingRoller.hidden = true
    }

    const fileNameSplit = fileName.split(".")
    extensionName = fileNameSplit[fileNameSplit.length - 1]

    // read data
    if (extensionName == "big") {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file, "utf-8")
    }
  })

  btnDownload.addEventListener("click", () => {
    // need to run some test before accepting keys
    const isBigArchive = extensionName == "big"
    File.downloadFile(fileName, arrayDataIn, arrayDataInWithoutSpaces, isBigArchive)
  })
}

function errFileNotFound() {
  console.log("file not found")
  const errLabel = document.getElementById("errInputFile")
  errLabel.innerText = fileToExtract + " was not found in big archive"
  errLabel.hidden = false
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

  // add html element to parent
  HTMLparent.insertAdjacentHTML("beforeend", newDiv)

  addNewShortcutsInput(nameNew)
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
}

function createHTMLComponents(commandMaps) {
  const div = document.getElementById("commandmaps")

  for (const commandMap in commandMaps) {
    const key = commandMaps[commandMap]["key"]
    const modifiers = commandMaps[commandMap]["modifiers"]

    let modifier
    if (modifiers.toUpperCase() == "NONE") {
      modifier = key
    } else {
      modifier = modifiers + " + " + key
    }

    const newDiv = `
    <div id="${commandMap}" class="line">
      <div class="name">
        ${commandMap}
      </div>
      
      <div class="shortcuts">
        <label>Shortcut</label>

        <div class="current-new">
            <div>
                current : <label class="current" id="${commandMap}-current">${modifier}</label>
            </div>
            <div>
                new : <input id="${commandMap}-new" maxlength="10"></input>
            </div>
        </div>
      </div>
    </div>`

    div.insertAdjacentHTML("beforeend", newDiv)
  }
}

// extract data from file and apply them to HTML components
function getCommandMaps(arrayData) {
  const propertyToAdd = ["key", "modifiers"]
  const searchCmdMap = "commandmap "
  const searchEnd = "end"
  const commandMaps = {}

  //
  for (let i = 0; i < arrayData.length; i++) {
    if (arrayData[i].trim().toLowerCase().startsWith(searchCmdMap)) {
      const commandMap = arrayData[i].split(" ")[1]
      commandMaps[commandMap] = {}

      i++
      while (!arrayData[i].trim().toLowerCase().startsWith(searchEnd)) {
        const propertySplit = arrayData[i].trim().split(" ")
        const propertyName = propertySplit[0]
        const propertyValue = propertySplit[propertySplit.length - 1]

        if (propertyToAdd.includes(propertyName.toLowerCase())) {
          commandMaps[commandMap][propertyName.toLowerCase()] = propertyValue
        }

        i++
      }
    }
  }

  return commandMaps
}

init()
