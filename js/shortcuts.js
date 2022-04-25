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
  const iconFaction = document.querySelectorAll("[id ^= 'display']")
  const divVersionSelect = document.querySelectorAll(".select-version")
  let arrayDataIn
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

    // Reading file
    reader.onload = async function fileReadCompleted() {
      const rawData = reader.result
      let extractedData
      try {
        extractedData = File.extractStrData(rawData, extensionName)
      } catch (error) {
        loadingRoller.hidden = true
        setErrInput(error)
        return
      }

      // trim because I got some problems with tabs or space at the end of control's name.
      arrayDataIn = extractedData
        .replaceAll(/\r/g, "")
        .split(/\n/)
        .map((element) => element.trim())

      // reset factions div to avoid duplication
      for (const element of document.getElementsByName("branch")) {
        element.innerHTML = ""
      }
      document.getElementById("uncategorized").innerHTML = ""

      try {
        await Rows.createRows(selectedGame, selectedVersion, arrayDataIn)
      } catch (error) {
        setErrInput(error)
        loadingRoller.hidden = true
        return
      }

      mainDiv.hidden = false
      loadingRoller.hidden = true
    }

    const fileNameSplit = fileName.split(".")
    extensionName = fileNameSplit[fileNameSplit.length - 1].toLowerCase()

    reader.readAsArrayBuffer(file)
  })

  // Download
  btnDownload.addEventListener("click", () => {
    const isBigArchive = extensionName == "big"
    const newShortcuts = {}
    const inputs = document.getElementById("new-shortcuts").querySelectorAll("input")

    for (const input of inputs) {
      const key = input.value
      const controlName = input.id.split("-")[0]

      if (key != "" && key != '"') {
        newShortcuts[controlName] = {}
        newShortcuts[controlName]["key"] = key
      }
    }

    Download.downloadStringsFile(fileName, newShortcuts, arrayDataIn)
  })

  // Display factions
  for (const img of iconFaction) {
    img.addEventListener("click", () => {
      const faction = img.id.slice("display".length)
      Utils.displayFaction(faction)
    })
  }

  // Game select
  for (const div of divVersionSelect) {
    const game = div.getAttribute("data-game")
    const version = div.getAttribute("data-version")

    div.addEventListener("click", () => {
      // selectGameAndVersion(game, version)
      const url = new URL(window.location.href)
      url.searchParams.set("game", game)
      url.searchParams.set("version", version)
      window.location.href = url.href
      // window.history.replaceState(null, null, url.origin + url.pathname)
      // window.history.pushState({ path: url.href }, "", url.href)
    })
    // div.setAttribute("href", url)
  }
}

function getUrlParams() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  selectedGame = urlParams.get("game")
  selectedVersion = urlParams.get("version")
}

function selectGameAndVersion(game, version) {
  // information div corresponding to game and version
  const div = document.querySelector('[name="div-version"][data-game="' + game + '"][data-version="' + version + '"]')
  // div containing input file
  const divInput = document.getElementById("div-input")
  // div
  const divSelect = document.getElementById("div-game-select")

  if (div != null) {
    div.hidden = false
    divInput.hidden = false
    divSelect.hidden = true
    selectedGame = game
    selectedVersion = version

    const divVersion = document.getElementsByName("div-version")
    for (const elem of divVersion) {
      if (elem != div) {
        elem.hidden = true
      }
    }
  } else {
    divSelect.hidden = false
  }
}

function setErrInput(errStr) {
  console.log(errStr)
  const errLabel = document.getElementById("errInputFile")
  errLabel.innerText = errStr
  errLabel.hidden = false
}

init()
