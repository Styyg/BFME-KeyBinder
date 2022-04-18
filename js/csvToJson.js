const fs = require("fs")

const arrayFaction = {
  rotwk: ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"],
  bfme2: ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "misc"],
  bfme1: ["men", "rohan", "isengard", "mordor", "misc"],
}
const arrayBranch = {
  rotwk: ["basic", "power", "inn", "port"],
  bfme2: ["basic", "power", "inn", "port"],
  bfme1: ["basic", "power"],
}
const csvPath = {
  rotwk: "./assets/data/csv/rotwk.csv",
  bfme2: "./assets/data/csv/bfme2.csv",
  bfme1: "./assets/data/csv/bfme1.csv",
}

const jsonPath = "./assets/data/json/"

function createFactionTreeStructure(game, arrayFile) {
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

  const listFile = game.toUpperCase() + "-controlsList.json"
  const treeStructFile = game.toUpperCase() + "-controlsTreeStruct.json"

  fs.writeFileSync(jsonPath + listFile, JSON.stringify(controlsList))
  fs.writeFileSync(jsonPath + treeStructFile, JSON.stringify(controlsFactionTree))
}

// const ROTWK = "rotwk"
// const fileROTWK = fs.readFileSync(csvPath[ROTWK], "utf-8")
// const arrayFileROTWK = fileROTWK.split(/\r\n/)
// arrayFileROTWK.shift()
// createFactionTreeStructure(ROTWK, arrayFileROTWK)

const BFME2 = "bfme2"
const fileBFME2 = fs.readFileSync(csvPath[BFME2], "utf-8")
const arrayFileBFME2 = fileBFME2.split(/\r\n/)
arrayFileBFME2.shift()
createFactionTreeStructure(BFME2, arrayFileBFME2)

// const BFME1 = "bfme1"
// const fileBFME1 = fs.readFileSync(csvPath[BFME1], "utf-8")
// const arrayFileBFME1 = fileBFME1.split(/\r\n/).shift()
// arrayFileBFME1.shift()
// createFactionTreeStructure(BFME1, arrayFileBFME1)
