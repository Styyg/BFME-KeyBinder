import * as Utils from "./utils.js"
import * as File from "./file.js"
import * as Download from "./download.js"

function init() {  
    setEventListeners()
}

function setEventListeners() {
  // File 1 : FROM
  // File 2 : TO
  const inputFile1 = document.getElementById("inputFile1")
  const inputFile2 = document.getElementById("inputFile2")
  const btnDownload = document.getElementById("btn-download")

  let extractedData1
  let extractedData2
  let fileName1
  let fileName2
  let extensionName1
  let extensionName2
  let validFile1 = false
  let validFile2 = false
  
  // allows to select the same file again
  inputFile1.addEventListener("click", function selectedFileChanged() {
    inputFile1.value = ""
    validFile1 = false
  })
  inputFile2.addEventListener("click", function selectedFileChanged() {
    inputFile2.value = ""
    validFile2 = false
  })
  
  inputFile1.addEventListener("change", function selectedFileChanged() {
    const errLabel = document.getElementById("errInputFile1")
    errLabel.hidden = true
    errLabel.innerText = ""

    if (!Utils.testFile(this.files, errLabel)) return

    const loadingRoller = document.getElementById("roller1")
    loadingRoller.hidden = false

    const file = this.files[0]
    fileName1 = file.name

    const fileNameSplit = fileName1.split(".")
    extensionName1 = fileNameSplit[fileNameSplit.length - 1].toLowerCase()

    // Reading file
    const reader = new FileReader()
    reader.onload = async function fileReadCompleted() {
    try {
        const rawData = reader.result
        extractedData1 = await File.extractStrData(rawData, extensionName1)
        validFile1 = true
    } catch (error) {
        loadingRoller.hidden = true
        setErrInput(error, errLabel)
        return
    }

    loadingRoller.hidden = true
    }

    reader.readAsArrayBuffer(file)
  })

  inputFile2.addEventListener("change", function selectedFileChanged() {
    const errLabel = document.getElementById("errInputFile2")
    errLabel.hidden = true
    errLabel.innerText = ""
    
    if (!Utils.testFile(this.files, errLabel)) return

    const loadingRoller = document.getElementById("roller2")
    loadingRoller.hidden = false

    const file = this.files[0]
    fileName2 = file.name

    const fileNameSplit = fileName2.split(".")
    extensionName2 = fileNameSplit[fileNameSplit.length - 1].toLowerCase()
    
    // Reading file
    const reader = new FileReader()
    reader.onload = async function fileReadCompleted() {
    try {
        const rawData = reader.result
        extractedData2 = await File.extractStrData(rawData, extensionName2)
        validFile2 = true
    } catch (error) {
        loadingRoller.hidden = true
        setErrInput(error, errLabel)
        return
    }

    loadingRoller.hidden = true
    }

    reader.readAsArrayBuffer(file)
  })


  // DOWNLOAD
  btnDownload.addEventListener("click", () => {
    if (validFile1 == false || validFile2 == false) return
    const newShortcuts = {}
    const spinner = document.getElementById("download-spinner")
    const extractedData = extractedData1.filter((row) => row != "" && !row.startsWith("//") && row.toUpperCase() != "END" && !row.toLowerCase().includes("tooltip"))

    for (let i = 0; i < extractedData.length; i++) {
      const controlName = extractedData[i]
      if (!controlName.startsWith('"')) {
        if (controlName.toLowerCase().startsWith("controlbar:")) {
          i++
          if (extractedData[i].includes("&")) {
            const descWithKey = extractedData[i]
            const key = Utils.getShortcut(descWithKey)
    
            newShortcuts[controlName] = {}
            newShortcuts[controlName]["key"] = key
          }
        }
      }
    }

    const lengthControls = Object.keys(newShortcuts).length
    if (lengthControls > 0 && extractedData2 != undefined) {
      spinner.hidden = false
      // need to add delay or the spinner won't show
      delay(10).then(() => {
        Download.downloadShortcutsFile(fileName2, newShortcuts, extractedData2)
        spinner.hidden = true
      })
    }
  })
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

function setErrInput(errStr, errLabel) {
  console.log(errStr)
  errLabel.innerText = errStr
  errLabel.hidden = false
}

init()