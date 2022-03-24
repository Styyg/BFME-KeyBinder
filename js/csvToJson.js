const fs = require("fs")
const arrayFaction = ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"]
const arrayBranch = ["basic", "power", "inn", "port"]
const controlsList = {}
const controlsFactionTree = {}
const csvPath = "./assets/data/csv/controls.csv"
const jsonPath = "./assets/data/json/"

function createFactionTreeStructure() {
  // set up the object
  for (const faction of arrayFaction) {
    controlsFactionTree[faction] = {}
    for (const branch of arrayBranch) {
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
    // const rank = parseInt(columns[2])
    const parent = columns[3]
    const branch = columns[4]
    const gen = parseInt(columns[5])

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

  fs.writeFileSync(jsonPath + "controlsList.json", JSON.stringify(controlsList))
  fs.writeFileSync(jsonPath + "controlsFactionTree.json", JSON.stringify(controlsFactionTree))
}

const file = fs.readFileSync(csvPath, "utf-8")
const arrayFile = file.split(/\r\n/)
// delete first row (headers) and store it
const headers = arrayFile.shift()

// elements in file needs to be in the right order
createFactionTreeStructure()
