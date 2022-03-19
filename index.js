let rawDataIn
let currentShortcuts = { controls: {} }
let newShortcuts = { controls: {} }
const arrayFaction = ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"]
const arrayBranch = ["basic", "power", "inn", "port"]

function init() {
  createHTMLComponents()
  setEventListeners()
}

async function setEventListeners() {
  const inputFile = document.getElementById("inputFile")
  const selectFaction = document.getElementById("select-faction")
  const btnDownload = document.getElementById("btn-download")
  const btnUncategorized = document.getElementById("btn-uncategorized")
  let fileName

  inputFile.addEventListener("change", function selectedFileChanged() {
    if (!testFile(this.files)) return

    const file = this.files[0]
    fileName = file.name

    const reader = new FileReader()
    reader.onload = function fileReadCompleted() {
      rawDataIn = reader.result
      // console.log(rawDataIn)
      // console.log(JSON.stringify(rawDataIn)) // used to see \n and \r in console

      const regexp = getLineBreakFormat(rawDataIn)
      const arrayData = rawDataIn.split(regexp)

      // reset factions div to avoid duplication
      for (const element of document.getElementsByName("branch")) {
        element.innerHTML = ""
      }
      document.getElementById("uncategorized").innerHTML = ""

      // read data
      // extractData(arrayData)
    }
    reader.readAsText(file, "windows-1252")
    // document.getElementById("main-div").style.display = "block"
    document.getElementById("main-div").hidden = false
  })

  selectFaction.addEventListener("change", function factionChange() {
    const currentFaction = this.value
    arrayFaction.forEach((faction) => {
      if (currentFaction == faction) {
        document.getElementById(faction).hidden = false
      } else {
        document.getElementById(faction).hidden = true
      }
    })
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

function toggleDisplayChildsAfterMe(me) {
  const arrayChildren = Array.from(me.parentNode.children)
  const index = arrayChildren.indexOf(me)
  const hidden = arrayChildren[index + 1].hidden

  for (i = index + 1; i < arrayChildren.length; i++) {
    arrayChildren[i].hidden = !hidden
  }
}

function createRowControl(obj, faction, controlName, parent, gen) {
  const arrayNames = document.getElementsByName(controlName)
  const elementId = document.getElementById(controlName)
  let id = "",
    name = ""
  // if controlName is already an id, it's deleted and set to name attribute for both old and new element (to avoid duplicated id)
  // if controlName is already a name, it's set to currentDiv's name
  // if controlName is not affected anywhere, it's set to currentDiv's id
  if (arrayNames.length > 0) {
    name = controlName
  } else {
    if (elementId === null) {
      id = controlName
    } else {
      name = controlName
      elementId.setAttribute("name", controlName)
      elementId.removeAttribute("id")
    }
  }

  const srcControl = controlName.split(":")[1]
  // div = 1 control
  const newDiv = `<div id="${id}" name="${name}" class="mt-2 border border-secondary border-3 rounded-3">
    <div class="row align-items-center" >
      <div class="col-md-1">
          <img class="icon" src="./assets/images/${faction}/gen${gen}/${srcControl}.png">
      </div>
      <div class="col-md-3">
          <label class="form-label">${controlName}</label>
      </div>
      <div class="col-md-3 text-center">
          <div class="row">
              <label class="form-label">Shortcut</label>
          </div>
          <div class="row align-items-center">
              <div class="col">
                  <label>current : </label>
                  <output id="${id}-current" name="${name}-current" ></output>
              </div>
              <div class="col">
                  <label>new : </label>
                  <input id="${id}-new" name="${name}-new" class="form-control small-input" maxlength="1" type="text"></input>
              </div>
          </div>
      </div>
      <div class="col">
          <div class="row text-center">
              <label id="${id}-desc" name="${name}-desc class="form-label">Description</label>
          </div>
      </div>
    </div>
  </div>`

  // add html element to parent
  parent.insertAdjacentHTML("beforeend", newDiv)
  const currentDiv = parent.lastChild

  // add button to toggle display of childs elements
  const numberOfChilds = Object.keys(obj[controlName]).length
  if (numberOfChilds > 0) {
    const divRow = `<div class="text-center border border-warning border-3">
      ->
    </div>`
    currentDiv.insertAdjacentHTML("beforeend", divRow)
    const addedDiv = currentDiv.lastChild
    addedDiv.addEventListener("click", () => {
      toggleDisplayChildsAfterMe(addedDiv)
    })
  }
}

// extract data from file content, store current shortcuts and create html
async function createHTMLComponents() {
  // all controls from input file
  // const jsonAllControls = getAllControlsWithShortcuts(arrayData)
  // controls from csv controls file (list of all controls)
  // const fileControls = await readFileFromServer("./assets/data/controlsList.json");
  // const jsonControls = JSON.parse(fileControls);
  // controls from csv faction file (splited by faction, faction splited by type: buildings, units etc)
  const readControlsFactionTree = await readFile("./assets/data/json/controlsFactionTree.json")
  const objControlsFactionTree = JSON.parse(readControlsFactionTree)
  // arrays of controls
  // const arrayCsvControlsNames = Object.keys(jsonControls);
  // const arrayControlsFaction = Object.keys(jsonControlsFact)
  // const arrayAllControlsNames = Object.keys(jsonAllControls)
  // div that contains all uncategorized controls (not from csv but presents in input file)
  // const divUncategorized = (document.getElementById("uncategorized").innerHTML = "")

  for (const faction of arrayFaction) {
    for (const branch of arrayBranch) {
      const parent0 = document.getElementById(faction + "-" + branch)
      // generation 0
      for (const controlName_0 in objControlsFactionTree[faction][branch]) {
        const gen = 0
        createRowControl(objControlsFactionTree[faction][branch], faction, controlName_0, parent0, gen)
        const parent1 = parent0.lastChild

        // generation 1
        for (const controlName_1 in objControlsFactionTree[faction][branch][controlName_0]) {
          const gen = 1
          createRowControl(objControlsFactionTree[faction][branch][controlName_0], faction, controlName_1, parent1, gen)
          const parent2 = parent1.lastChild

          // generation 2
          for (const controlName_2 in objControlsFactionTree[faction][branch][controlName_0][controlName_1]) {
            const gen = 2
            createRowControl(objControlsFactionTree[faction][branch][controlName_0][controlName_1], faction, controlName_2, parent2, gen)
            const parent3 = parent2.lastChild

            // generation 3
            for (const controlName_3 in objControlsFactionTree[faction][branch][controlName_0][controlName_1][controlName_2]) {
              const gen = 3
              createRowControl(
                objControlsFactionTree[faction][branch][controlName_0][controlName_1][controlName_2],
                faction,
                controlName_3,
                parent3,
                gen
              )
            }
          }
        }
      }
    }
  }

  // let duplicatedNames = []
  // for (const faction in jsonControlsFact) {
  //   // arrayControlsFaction.forEach((faction) => {
  //   const arrayGen = Object.keys(jsonControlsFact[faction])

  //   arrayGen.forEach((generation) => {
  //     const arrayRank = Object.keys(jsonControlsFact[faction][generation])

  //     arrayRank.forEach((rank) => {
  //       const control = jsonControlsFact[faction][generation][rank]["name"]
  //       const parent = jsonControlsFact[faction][generation][rank]["parent"]
  //       const duplicated = jsonControlsFact[faction][generation][rank]["duplicated"]
  //       const key = getShortcut(jsonAllControls[control])
  //       let desc
  //       if (jsonAllControls[control] === undefined) {
  //         desc = ""
  //       } else {
  //         desc = jsonAllControls[control].replace("&", "")
  //       }
  //       const titre = control.split(":")[1]

  //       let src, name, id, idNew, divId, hidden

  //       // store keys in a json object
  //       currentShortcuts.controls[control] = { key: key }

  //       // type = jsonControls[control]['type']
  //       // name = faction + "-" + type
  //       src = "./assets/images/" + faction + "/" + generation + "/" + titre + ".png"
  //       if (duplicated == true) {
  //         id = ""
  //         idNew = ""
  //         name = control
  //         if (!duplicatedNames.includes(control)) {
  //           duplicatedNames.push(control)
  //         }
  //         if (document.getElementById(control + "-new") === null) {
  //           const inputControl = `<input class="form-control small-input"
  //               id="${control}-new"
  //               maxlength="1"
  //               type="text">
  //           </input>`
  //           document.getElementById("duplicated").insertAdjacentHTML("beforeend", inputControl)
  //         }
  //       } else {
  //         id = control
  //         // id = 'id="' + control + '"'
  //         idNew = control + "-new"
  //         name = ""
  //       }

  //       if (parent == "") {
  //         divId = faction
  //         // hidden = ''
  //       } else {
  //         divId = parent
  //         // hidden = 'hidden'
  //       }

  //       // div format for each controls
  //       const divControlRow = `<div id="${id}" class="mt-2 border border-secondary border-3 rounded-3" ${hidden}>
  //         <div class="row align-items-center" >
  //           <div class="col-md-1">
  //               <img class="icon" src="${src}">
  //           </div>
  //           <div class="col-md-3">
  //               <label class="form-label">${titre}</label>
  //           </div>
  //           <div class="col-md-3 text-center">
  //               <div class="row">
  //                   <label class="form-label">Shortcut</label>
  //               </div>
  //               <div class="row align-items-center">
  //                   <div class="col">
  //                       <label>current : </label>
  //                       <output>${key}</output>
  //                   </div>
  //                   <div class="col">
  //                       <label>new : </label>
  //                       <input class="form-control small-input" id="${idNew}" name="${name}" maxlength="1" type="text"></input>
  //                   </div>
  //               </div>
  //           </div>
  //           <div class="col">
  //               <div class="row text-center">
  //                   <label class="form-label" id="${control}-desc">${desc}</label>
  //               </div>
  //           </div>
  //         </div>
  //       </div>`

  //       // if(arrayCsvControlsNames.includes(control)) {
  //       // if(jsonControls[control]['hasChild']) {
  //       if (document.getElementById(parent + "-toggle") === null && generation != "gen0") {
  //         const divFleche = `<div id="${parent}-toggle" class="text-center border border-warning border-3" onclick="toggleHiddenChildsAfterMe(this)">
  //             ->
  //           </div>`
  //         //onclick="testToggle(this, document.getElementById('child1'))"
  //         document.getElementById(parent).insertAdjacentHTML("beforeend", divFleche)
  //       }
  //       // }

  //       // add html element
  //       document.getElementById(divId).insertAdjacentHTML("beforeend", divControlRow)

  //       const selectedFaction = document.getElementById("select-faction").value
  //       if (selectedFaction == faction) {
  //         document.getElementById(faction).hidden = false
  //       } else {
  //         document.getElementById(faction).hidden = true
  //       }
  //     })
  //   })
  //   // });
  // }

  // duplicatedNames.forEach((name) => {
  //   const arrayElements = document.getElementsByName(name)
  //   const input = document.getElementById(name + "-new")

  //   arrayElements.forEach((element) => {
  //     element.addEventListener("input", () => {
  //       input.value = element.value

  //       sameNameElements = document.getElementsByName(name)
  //       sameNameElements.forEach((elem) => {
  //         if (elem != element) {
  //           elem.value = element.value
  //         }
  //       })
  //     })
  //   })
  // })
}

async function extractData(arrayData) {
  const readControlsFactionTree = await readFile("./assets/data/json/controlsFactionTree.json")
  const objControlsFactionTree = JSON.parse(readControlsFactionTree)

  for (const faction of arrayFaction) {
    for (const branch of arrayBranch) {
      const parent0 = document.getElementById(faction + "-" + branch)
      // generation 0
      for (const controlName_0 in objControlsFactionTree[faction][branch]) {
        createRowControl(objControlsFactionTree[faction][branch], controlName_0, parent0)
        const parent1 = parent0.lastChild

        // generation 1
        for (const controlName_1 in objControlsFactionTree[faction][branch][controlName_0]) {
          createRowControl(objControlsFactionTree[faction][branch][controlName_0], controlName_1, parent1)
          const parent2 = parent1.lastChild

          // generation 2
          for (const controlName_2 in objControlsFactionTree[faction][branch][controlName_0][controlName_1]) {
            createRowControl(objControlsFactionTree[faction][branch][controlName_0][controlName_1], controlName_2, parent2)
            const parent3 = parent2.lastChild

            // generation 3
            for (const controlName_3 in objControlsFactionTree[faction][branch][controlName_0][controlName_1][controlName_2]) {
              createRowControl(objControlsFactionTree[faction][branch][controlName_0][controlName_1][controlName_2], controlName_3, parent3)
            }
          }
        }
      }
    }
  }
}

function downloadFile(fileName) {
  arrayControlsName = Object.keys(currentShortcuts.controls)
  // newShortcuts.controls = {}
  arrayControlsName.forEach((element) => {
    inputNewKey = document.getElementById(element + "-new")
    if (inputNewKey !== null) {
      key = inputNewKey.value.toUpperCase()

      if (isLetter(key)) {
        newShortcuts.controls[element] = {}
        newShortcuts.controls[element]["key"] = key
      } else if (key) {
        // console.log(inputNewKey.parentNode);
        // inputNewKey.classList.add("is-invalid");
      }
    } else {
      console.log("getElementById(" + element + "-new)" + " not found")
    }
  })

  const lengthControls = Object.keys(newShortcuts.controls).length
  if (lengthControls) {
    const newFile = getFileWithNewShortcuts()
    const encoded = new TextEncoder("windows-1252", { NONSTANDARD_allowLegacyEncoding: true }).encode(newFile)
    download(encoded, fileName)
  }
}

function getAllControlsWithShortcuts(array) {
  let results = {}

  for (let i = 1; i < array.length; i++) {
    const element = array[i]
    if (element.trim().startsWith('"') && element.includes("&") && isLetter(element.charAt(element.search("&") + 1))) {
      let offset = 1
      while (array[i - offset].trim().startsWith('"') || array[i - offset].trim().startsWith("//")) {
        offset++
      }
      results[array[i - offset].trim()] = array[i].trim()
    }
  }
  return results
}

function testFile(files) {
  const maxFileSize = 2 * 1024 * 1024 //2MB
  const allowedExtension = ["str", "big"]
  const file = files[0]

  // no file
  if (files.length === 0) {
    document.getElementById("errInputFile").style.visibility = "hidden"
    return
  }

  // not right file extension
  const array = file.name.split(".")
  const extensionName = array[array.length - 1]
  if (!allowedExtension.includes(extensionName)) {
    document.getElementById("errInputFile").textContent = "Invalid format, .str or .big is required"
    document.getElementById("errInputFile").style.visibility = "visible"
    return
  }

  // wrong file size
  if (file.size > maxFileSize) {
    console.log("File selected is too big : " + file.size + "o, max is : " + maxFileSize + "o")
    document.getElementById("errInputFile").textContent = "File selected is too big, 2Mo max"
    document.getElementById("errInputFile").style.visibility = "visible"
    return
  }

  document.getElementById("errInputFile").style.visibility = "hidden"
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
  if (str === undefined) return ""
  const searchPos = str.search("&")
  if (searchPos > -1 && isLetter(str.charAt(searchPos + 1))) return str.charAt(searchPos + 1).toUpperCase()
  else return ""
}

function getFileWithNewShortcuts() {
  const arrayControlsNames = Object.keys(newShortcuts.controls)
  // split data by line break
  const regexp = getLineBreakFormat(rawDataIn)
  dataIn = rawDataIn.split(regexp)

  arrayControlsNames.forEach((name) => {
    index = dataIn.indexOf(name) // get ControlBar index

    // if we get the ControlBar
    if (index > -1) {
      key = newShortcuts.controls[name]["key"]
      offset = 1
      // need to avoid to change shortcuts in commented lines
      while (dataIn[index + offset].startsWith("//")) {
        offset++
      }
      dataIn[index + offset] = dataIn[index + offset].replaceAll("&", "")
      searchPos = dataIn[index + offset].toUpperCase().search(key)

      if (searchPos > -1) {
        if (searchPos < dataIn[index + offset].length - 2) {
          dataIn[index + offset] = dataIn[index + offset].replace(" [" + key + "]", "")
        }
        dataIn[index + offset] = dataIn[index + offset].slice(0, searchPos) + "&" + dataIn[index + offset].slice(searchPos)
      } else {
        // console.log(dataIn[index + offset]);
        if (dataIn[index + offset].endsWith(']"')) {
          dataIn[index + offset] = dataIn[index + offset].slice(0, -3) + "&" + key + dataIn[index + offset].slice(-2)
        } else {
          dataIn[index + offset] = dataIn[index + offset].slice(0, -1) + " [&" + key + "]" + dataIn[index + offset].slice(-1)
        }
      }
    } else {
      console.log(name + " was not found")
    }
  })

  let newFile
  if (regexp.source == "\\r\\n") newFile = dataIn.join("\r\n")
  else newFile = dataIn.join("\n")

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
