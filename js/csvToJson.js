const fs = require("fs")

const arrayFaction = {
  rotwk: ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"],
  bfme2: ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "misc"],
  bfme1: ["rohan", "men", "isengard", "mordor", "misc"],
}
const arrayBranch = {
  rotwk: ["basic", "power", "inn", "port"],
  bfme2: ["basic", "power", "inn", "port"],
  bfme1: ["basic", "power"],
}

const jsonPath = "./assets/data/json/"

function createFactionTreeStructure(game, version, arrayFile) {
  const controlsList = {}
  const controlsFactionTree = {}

  // set up the object
  for (const faction of arrayFaction[game]) {
    controlsFactionTree[faction] = {}
    for (const branch of arrayBranch[game]) {
      controlsFactionTree[faction][branch] = {}
    }
  }

  // if we're in gen2 / gen3, it allows to know the name of parents in the tree until oldest parent
  let storeParent0, storeParent1
  // for each row
  for (const row of arrayFile) {
    const columns = row.split(",")
    const name = columns[0]
    const faction = columns[1]
    const parent = columns[2]
    const branch = columns[3]
    const gen = parseInt(columns[4])

    controlsList[name] = ""

    switch (gen) {
      case 0:
        storeParent0 = name
        controlsFactionTree[faction][branch][name] = {}
        break
      case 1:
        storeParent1 = name
        controlsFactionTree[faction][branch][parent][name] = {}
        break
      case 2:
        controlsFactionTree[faction][branch][storeParent0][parent][name] = {}
        break
      case 3:
        controlsFactionTree[faction][branch][storeParent0][storeParent1][parent][name] = {}
        break

      default:
        break
    }
  }

  const listFile = game.toUpperCase() + " " + version + "-controlsList.json"
  const treeStructFile = game.toUpperCase() + " " + version + "-controlsTreeStruct.json"

  fs.writeFileSync(jsonPath + listFile, JSON.stringify(controlsList))
  fs.writeFileSync(jsonPath + treeStructFile, JSON.stringify(controlsFactionTree))
}

function createCommandMapTree(arrayFile) {
  const commandmap = {}

  // for each row
  for (const row of arrayFile) {
    const columns = row.split(",")
    const name = columns[0]
    const notes = columns[1]

    commandmap[name] = {}
    commandmap[name]["notes"] = notes
  }

  fs.writeFileSync(jsonPath + "commandmap.json", JSON.stringify(commandmap))
}

const ROTWK = "rotwk"
const BFME2 = "bfme2"
const BFME1 = "bfme1"

const csvPath = {
  "rotwk 2.02 9.4.1": "./assets/data/csv/rotwk 2.02 9.4.1.csv",
  "bfme2 1.09v2": "./assets/data/csv/bfme2 1.09v2.csv",
  "bfme2 1.06": "./assets/data/csv/bfme2 1.06.csv",
  "bfme1 2.22": "./assets/data/csv/bfme1 2.22.csv",
  "bfme1 1.06": "./assets/data/csv/bfme1 1.06.csv",
  "commandmap": "./assets/data/csv/CommandMap.csv",
}

const ROTWK_900 = "2.02 9.4.1"
const fileROTWK_900 = fs.readFileSync(csvPath[ROTWK + " " + ROTWK_900], "utf-8")
const arrayFileROTWK_900 = fileROTWK_900.split(/\r\n/)
arrayFileROTWK_900.shift()
createFactionTreeStructure(ROTWK, ROTWK_900, arrayFileROTWK_900)

// const BFME2_106 = "1.06"
// const fileBFME2_106 = fs.readFileSync(csvPath[BFME2 + " " + BFME2_106], "utf-8")
// const arrayFileBFME2_106 = fileBFME2_106.split(/\r\n/)
// arrayFileBFME2_106.shift()
// createFactionTreeStructure(BFME2, BFME2_106, arrayFileBFME2_106)

// const BFME2_109v2 = "1.09v2"
// const fileBFME2_109v2 = fs.readFileSync(csvPath[BFME2 + " " + BFME2_109v2], "utf-8")
// const arrayFileBFME2_109v2 = fileBFME2_109v2.split(/\r\n/)
// arrayFileBFME2_109v2.shift()
// createFactionTreeStructure(BFME2, BFME2_109v2, arrayFileBFME2_109v2)

// const BFME1_222 = "2.22"
// const fileBFME1_222 = fs.readFileSync(csvPath[BFME1 + " " + BFME1_222], "utf-8")
// const arrayFileBFME1_222 = fileBFME1_222.split(/\r\n/)
// arrayFileBFME1_222.shift()
// createFactionTreeStructure(BFME1, BFME1_222, arrayFileBFME1_222)

// const BFME1_106 = "1.06"
// const fileBFME1_106 = fs.readFileSync(csvPath[BFME1 + " " + BFME1_106], "utf-8")
// const arrayFileBFME1_106 = fileBFME1_106.split(/\r\n/)
// arrayFileBFME1_106.shift()
// createFactionTreeStructure(BFME1, BFME1_106, arrayFileBFME1_106)

// const fileCommandMap = fs.readFileSync(csvPath["commandmap"], "utf-8")
// const arrayFileCommandMap = fileCommandMap.split(/\r\n/)
// arrayFileCommandMap.shift()
// createCommandMapTree(arrayFileCommandMap)
