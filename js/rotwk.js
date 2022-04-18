import * as Utils from "./utils.js"
import * as File from "./file.js"
import * as Rows from "./createRows.js"
import * as Download from "./download.js"

const fileToExtract = "data\\lotr.str"

function init() {
  // document.getElementById("main-div").hidden = false
  // Rows.createRows()
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

      Rows.createRows(arrayDataIn, arrayDataInWithoutSpaces).then(() => {
        mainDiv.hidden = false
        loadingRoller.hidden = true
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

    Download.downloadStringsFile(fileName, newShortcuts, arrayDataIn, arrayDataInWithoutSpaces, isBigArchive, fileToExtract)
  })

  for (const img of iconFaction) {
    img.addEventListener("click", () => {
      const faction = img.id.slice("display".length)
      Utils.displayFaction(faction)
    })
  }
}

function errFileNotFound() {
  console.log("file not found")
  const errLabel = document.getElementById("errInputFile")
  errLabel.innerText = fileToExtract + " was not found in big archive"
  errLabel.hidden = false
}

init()
