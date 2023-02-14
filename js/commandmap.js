import * as Utils from "./utils.js"
import * as File from "./file.js"
import * as Rows from "./createRows.js"
import * as Download from "./download.js"

function init() {
  setEventListeners()
}

function setEventListeners() {
  const inputFile = document.getElementById("inputFile")
  const btnDownload = document.getElementById("btn-download")
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

    const searchFile = "commandmap"

    // Reading file
    const reader = new FileReader()
    reader.onload = async function fileReadCompleted() {
      try {
        const rawData = reader.result
        extractedData = await File.extractStrData(rawData, extensionName, searchFile)
        await Rows.createCommandMapRows(extractedData)
      } catch (error) {
        loadingRoller.hidden = true
        setErrInput(error)
        return
      }

      mainDiv.hidden = false
      loadingRoller.hidden = true
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
        Download.downloadStringsFile(fileName, newShortcuts, extractedData)
        spinner.hidden = true
      })
    }
  })
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

function setErrInput(errStr) {
  console.log(errStr)
  const errLabel = document.getElementById("errInputFile")
  errLabel.innerText = errStr
  errLabel.hidden = false
}

init()
