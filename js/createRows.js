import * as Utils from "./utils.js"

export const arrayFaction = {
  rotwk: ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"],
  bfme2: ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "misc"],
  bfme1: ["rohan", "men", "isengard", "mordor", "misc"],
  any: [],
}
const arrayBranch = {
  rotwk: ["basic", "power", "inn", "port"],
  bfme2: ["basic", "power", "inn", "port"],
  bfme1: ["basic", "power"],
  any: [],
}

export async function createRows(game, version, arrayData) {
  if (game == "any" && version == "any") {
    createUncategorizedRows(arrayData)
  } else {
    await createCategorizedRows(game, version, arrayData)
  }
}

async function createCategorizedRows(game, version, arrayData) {
  // reset factions div to avoid duplication
  for (const element of document.getElementsByName("branch")) {
    element.innerHTML = ""
  }

  const filePath = "../assets/data/json/" + game.toUpperCase() + " " + version + "-controlsTreeStruct.json"
  const readControlsFactionTree = await Utils.readFile(filePath)
  const objControlsFactionTree = JSON.parse(readControlsFactionTree)

  // create all rows for shortcurts
  for (const faction of arrayFaction[game]) {
    for (const branch of arrayBranch[game]) {
      const HTMLparent0 = document.getElementById(faction + "-" + branch)
      // generation 0
      for (const controlName_0 in objControlsFactionTree[faction][branch]) {
        const gen = 0
        await createRowControl(game, version, objControlsFactionTree[faction][branch], faction, controlName_0, HTMLparent0, gen)
        const HTMLparent1 = HTMLparent0.lastChild

        // generation 1
        for (const controlName_1 in objControlsFactionTree[faction][branch][controlName_0]) {
          const gen = 1
          await createRowControl(game, version, objControlsFactionTree[faction][branch][controlName_0], faction, controlName_1, HTMLparent1, gen, controlName_0)
          const HTMLparent2 = HTMLparent1.lastChild

          // generation 2
          for (const controlName_2 in objControlsFactionTree[faction][branch][controlName_0][controlName_1]) {
            const gen = 2
            await createRowControl(
              game,
              version,
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
                game,
                version,
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

  addToggleEventListeners()
  addPreviewChilds()

  await extractData(game, version, arrayData)
}

// extract data from file and apply them to HTML components
async function extractData(game, version, arrayData) {
  const filePath = "../assets/data/json/noShortcutsExceptions.json"
  const exceptions = await Utils.readFile(filePath)
  const objExceptions = JSON.parse(exceptions)
  const controlsDesc = await getControlsDesc(game, version, arrayData)

  let nbrMissing = 0
  let nbrControls = 0
  for (const controlName in controlsDesc) {
    const elementsDesc = document.getElementsByName(controlName + "-desc")

    // if the control is found in the input file
    if (controlsDesc[controlName]["found"]) {
      // apply description for all same elements
      let desc = controlsDesc[controlName]["desc"]
      if (desc !== undefined) {
        desc = desc.replaceAll('"', "")
      }
      for (const elemDesc of elementsDesc) {
        elemDesc.innerText = desc.replaceAll("&", "")
      }

      // if the element can have a shortcut (even if there isn't any)
      if (objExceptions[game][controlName] === undefined) {
        // apply current shortcut
        const shortcut = Utils.getShortcut(desc)
        const elementsCurrent = document.getElementsByName(controlName + "-current")
        for (const elemCurrent of elementsCurrent) {
          elemCurrent.innerText = shortcut
        }
        // the element can't have a shortcut
      } else {
        // inputs are deleted
        const elements = document.getElementsByName(controlName)
        for (const element of elements) {
          element.querySelector(".shortcuts").innerHTML = ""
        }

        document.getElementById(controlName + "-new").remove()
      }
      // control is NOT found
    } else {
      // description with MISSING
      for (const elemDesc of elementsDesc) {
        elemDesc.innerHTML = "MISSING: " + elemDesc.innerHTML
      }

      // control-row elements are disabled
      const elementsMain = document.getElementsByName(controlName)
      for (const elemMain of elementsMain) {
        elemMain.querySelector(".control-row").classList += " disabled"
      }

      // preview images
      const elementsPreview = document.getElementsByName(controlName + "-preview")
      for (const elemPrev of elementsPreview) {
        elemPrev.classList += " disabled-preview"
      }

      // inputs are disabled
      if (document.getElementById(controlName + "-new") != null) {
        document.getElementById(controlName + "-new").remove()
      }
      const elementsNew = document.getElementsByName(controlName + "-new")
      for (const elemNew of elementsNew) {
        elemNew.disabled = true
      }

      console.log("MISSING: " + controlName)
      nbrMissing++
    }
    nbrControls++
  }

  if (nbrMissing == nbrControls) {
    const controlFound = nbrControls - nbrMissing
    throw "controls found found in file: " + controlFound + "/" + nbrControls
  }
}

// { 'controlName': 'control description'}
async function getControlsDesc(game, version, arrayDataIn) {
  const filePath = "../assets/data/json/" + game.toUpperCase() + " " + version + "-controlsList.json"
  const readControlsList = await Utils.readFile(filePath)
  let objControlsList = JSON.parse(readControlsList)

  for (const controlName in objControlsList) {
    objControlsList[controlName] = {}
    if (arrayDataIn.includes(controlName)) {
      objControlsList[controlName]["found"] = true
      const index = arrayDataIn.indexOf(controlName)
      let offset = 1
      while (!arrayDataIn[index + offset].startsWith('"')) {
        offset++
      }
      objControlsList[controlName]["desc"] = arrayDataIn[index + offset]
    } else {
      objControlsList[controlName]["found"] = false
    }
  }
  return objControlsList
}

async function createRowControl(game, version, obj, faction, controlName, HTMLparent, gen, parent) {
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

  const srcControl = await Utils.getSrcControl(game, version, controlName, faction, parent)
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
          <img class="icon" src="${srcControl}" loading="lazy">
  
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

/**
 * @param {Array<string>} arrayData
 */
function createUncategorizedRows(arrayData) {
  const divUncategorized = document.getElementById("div-uncategorized")
  divUncategorized.innerHTML = ""

  arrayData = arrayData.filter((row) => row != "" && !row.startsWith("//") && row.toUpperCase() != "END" && !row.toLowerCase().includes("tooltip"))

  for (let i = 0; i < arrayData.length; i++) {
    const controlName = arrayData[i]
    if (!controlName.startsWith('"')) {
      if (controlName.toLowerCase().startsWith("controlbar:")) {
        i++
        // if (arrayData[i].includes("&")) {
        const descWithKey = arrayData[i]
        const desc = descWithKey.slice(1, -1).replaceAll("&", "")
        const key = Utils.getShortcut(descWithKey)

        createUncategorizedRowControl(controlName, desc, key)
        // }
      }
    }
  }

  divUncategorized.hidden = false
}

async function createUncategorizedRowControl(controlName, desc, key) {
  let source
  // if (controlName.toLowerCase().includes("construct")) {
  //   source = "../assets/images/men/ConstructMenFarm.png"
  // } else if (controlName.toLowerCase().includes("upgrade")) {
  //   source = "../assets/images/generic/upgrade.png"
  // } else {
  source = "../assets/images/uncategorized.png"
  // }

  const newDiv = `<div id="${controlName}" class="control-main misc">
    <div id="${controlName}-row" class="control-row">
      <img class="icon" src="${source}" loading="lazy">

      <div class="description" >
        ${controlName}
      </div>
      <div class="shortcuts">
        <label>Shortcut</label>

        <div class="current-new">
            <div>
                current : <label id="${controlName}-current" class="current" >${key}</label>
            </div>
            <div>
                new : <input name="${controlName}-new" class="small-input" maxlength="1"></input>
            </div>
        </div>
      </div>
      <div class="description" >
        ${desc}
      </div>
    </div>
  </div>`

  // add html element to parent
  const divUncategorized = document.getElementById("div-uncategorized")
  divUncategorized.insertAdjacentHTML("beforeend", newDiv)

  addNewShortcutsInput(controlName + "-new")
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

function addPreviewChilds() {
  const allControlRowElements = document.querySelectorAll(".control-main")

  for (const controlElement of allControlRowElements) {
    const allChildrenControls = controlElement.querySelectorAll(":scope > .control-main")

    let imgAttributes = []
    for (const child of allChildrenControls) {
      const source = child.querySelector("img.icon").src
      if (source !== undefined && !imgAttributes.includes(source)) {
        const name = child.getAttribute("name")
        imgAttributes.push({ src: source, name: name })
      }
    }

    let divImg = ""
    for (const item of imgAttributes) {
      divImg += `<div name="${item.name}-preview" class="icon-preview" >
        <img src="${item.src}" loading="lazy">
      </div>`
    }
    if (divImg !== "") {
      const divPreview = `<div class="preview">
          ${divImg}
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
