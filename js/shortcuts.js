import * as Utils from "./utils.js"
import * as File from "./file.js"
import * as Rows from "./createRows.js"
import * as Download from "./download.js"

let selectedGame, selectedVersion

function init() {
  getUrlParams()
  selectGameAndVersion(selectedGame, selectedVersion)

  setEventListeners()

  // For debug
  // document.getElementById("main-div").hidden = false
  // Rows.createRows(selectedGame, selectedVersion)
}

function setEventListeners() {
  const inputFile = document.getElementById("inputFile")
  const btnDownload = document.getElementById("btn-download")
  // id starting with 'display'
  const divVersionSelect = document.querySelectorAll(".select-version")
  let extractedData
  let fileName
  let extensionName

  // allows to select the same file again
  inputFile.addEventListener("click", function selectedFileChanged() {
    inputFile.value = ""
  })

  inputFile.addEventListener("change", function selectedFileChanged() {
    const errLabel = document.getElementById("errInputFile")
    if (!Utils.testFile(this.files, errLabel)) return

    const mainDiv = document.getElementById("main-div")
    const loadingRoller = document.querySelector(".lds-roller")

    mainDiv.hidden = true
    loadingRoller.hidden = false

    const file = this.files[0]
    fileName = file.name

    const fileNameSplit = fileName.split(".")
    extensionName = fileNameSplit[fileNameSplit.length - 1].toLowerCase()

    // Reading file
    const reader = new FileReader()
    reader.onload = async function fileReadCompleted() {
      try {
        const rawData = reader.result
        extractedData = await File.extractStrData(rawData, extensionName)
        await Rows.createRows(selectedGame, selectedVersion, extractedData)
      } catch (error) {
        loadingRoller.hidden = true
        setErrInput(error)
        return
      }

      mainDiv.hidden = false
      loadingRoller.hidden = true
      document.getElementById("main-div").scrollIntoView();
    }

    reader.readAsArrayBuffer(file)
  })

  // Download
  btnDownload.addEventListener("click", () => {
    const newShortcuts = {}
    const inputs = document.getElementById("new-shortcuts").querySelectorAll("input")
    const spinner = document.getElementById("download-spinner")

    for (const input of inputs) {
      const key = input.value
      const controlName = input.id.split("-")[0]

      if (key != "" && key != '"') {
        newShortcuts[controlName] = {}
        newShortcuts[controlName]["key"] = key
      }
    }

    const lengthControls = Object.keys(newShortcuts).length
    if (lengthControls > 0 && extractedData != undefined) {
      spinner.hidden = false
      // need to add delay or the spinner won't show
      delay(10).then(() => {
        Download.downloadShortcutsFile(fileName, newShortcuts, extractedData)
        spinner.hidden = true
      })
    }
  })

  // Game select event listeners
  for (const div of divVersionSelect) {
    const game = div.getAttribute("data-game")
    const version = div.getAttribute("data-version")
    div.addEventListener("click", () => {
      const url = new URL(window.location.href)
      url.searchParams.set("game", game)
      url.searchParams.set("version", version)
      window.location.href = url.href
    })
  }
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

function getUrlParams() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  selectedGame = urlParams.get("game")
  selectedVersion = urlParams.get("version")
}

//
function selectGameAndVersion(game, version) {
  // select faction div corresponding to game and version
  const selectFactDiv = document.querySelector('[name="div-version"][data-game="' + game + '"][data-version="' + version + '"]')
  // div containing input file
  const divInput = document.getElementById("div-input")
  // global select faction div
  const mainSelectFactDiv = document.getElementById("div-game-select")

  // show the selected version and hide the rest
  if (selectFactDiv != null) {
    const iconFaction = document.querySelectorAll("[id ^= 'display']")

    let firstFaction = null
    // Add event listeners on display factions icons; and delete those which are not in the game selected
    for (const selectFactDiv of iconFaction) {
      const faction = selectFactDiv.id.slice("display".length)

      if (Rows.arrayFaction[selectedGame].includes(faction.toLowerCase())) {
        const img = selectFactDiv.querySelector("img")
        img.addEventListener("click", () => {
          Utils.displayFaction(faction)
        })

        if (firstFaction == null) {
          firstFaction = faction
        }
      } else {
        selectFactDiv.remove()
      }
    }
    if (firstFaction != null) {
      Utils.displayFaction(firstFaction)
    }

    selectFactDiv.hidden = false
    divInput.hidden = false
    mainSelectFactDiv.hidden = true
    selectedGame = game
    selectedVersion = version

    const divVersion = document.getElementsByName("div-version")
    for (const elem of divVersion) {
      if (elem != selectFactDiv) {
        elem.hidden = true
      }
    }
  } else {
    // show the versions to select
    mainSelectFactDiv.hidden = false
  }
}

function setErrInput(errStr) {
  console.log(errStr)
  const errLabel = document.getElementById("errInputFile")
  errLabel.innerText = errStr
  errLabel.hidden = false
}

init()
