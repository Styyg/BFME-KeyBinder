import * as Utils from "./utils.js"
import * as File from "./file.js"
import * as Rows from "./createRows.js"
import * as Download from "./download.js"

function init() {
  // document.getElementById("main-div").hidden = false
  // Rows.createRows("bfme2")
  setEventListeners()
}

function setEventListeners() {
  const inputFile = document.getElementById("inputFile")
  const btnDownload = document.getElementById("btn-download")
  // id starting with 'display'
  const iconFaction = document.querySelectorAll("[id ^= 'display']")
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
    reader.onload = function fileReadCompleted() {
      const rawData = reader.result
      const extractedData = File.extractStrData(rawData, extensionName)
      const game = "bfme2"

      // trim because I got some problems with tabs or space at the end of control's name.
      arrayDataIn = Utils.splitByLineBreak(extractedData).map((element) => element.trim())

      // reset factions div to avoid duplication
      for (const element of document.getElementsByName("branch")) {
        element.innerHTML = ""
      }
      document.getElementById("uncategorized").innerHTML = ""

      Rows.createRows(game, arrayDataIn).then(() => {
        mainDiv.hidden = false
        loadingRoller.hidden = true
      })
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
}

init()
