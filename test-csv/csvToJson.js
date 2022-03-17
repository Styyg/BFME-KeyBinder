const fs = require('fs')
const arrayFaction = ["men",  "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"];
const controlsList = {}
const controlsListDuplicates = {}
const controlsFaction = {}
const csvPath = "./test/controls test.csv"


// 0 : parent, 1 child, 2 child of child, ...
function getGenerationFromList(jsonList, element) {
    let i = 0
    let parent = jsonList[element]['parent']
    while(parent != '') {
        i++
        parent = jsonList[parent]['parent']
    }
    return i
}

function getGenerationFromDuplicateList(jsonList, element) {
    let i = 0
    let parent = jsonList[element]['parent']
    while(parent != '') {
        i++
        parent = jsonList[parent]['parent']
    }
    return i
}

// return a bool
function hasChild(jsonList, element) {
    const boolHasChild = (control) => jsonList[control]['parent'] == element

    jsonKeys = Object.keys(jsonList)

    return jsonKeys.some(boolHasChild);
}

function findDuplicates(array) {
    return array.filter((item, index) => array.indexOf(item) !== index)
}

function createControlsList() {
    arrayFile.shift()

    var arrayControls = []
    arrayFile.forEach(row => {
        arrayControls.push(row.split(',')[0])
    })
    const arrayDuplicates = findDuplicates(arrayControls)
    arrayDuplicates.forEach(element => {
        controlsListDuplicates[element] = {}
    })
    
    arrayFile.forEach(row => {
        const col = row.split(',')
        const name = col[0]
        const faction = col[1]
        const rank = parseInt(col[2])
        const parent = col[3]

        // if(controlsList[name] === undefined) {
            // controlsList[name] = {}
        // }
        if(controlsListDuplicates[name] === undefined) {
            controlsList[name] = {parent: parent, rank: rank, faction: faction}
        } else {
            // controlsList[name] = {parent: parent, rank: rank, faction: faction}
            index = 0
            while (controlsListDuplicates[name][index] !== undefined) {
                index++
            }
            controlsListDuplicates[name][index] = {parent: parent, rank: rank, faction: faction}
        }
    })

    arrayControlsList = Object.keys(controlsList)
    arrayControlsList.forEach(name => {     
        const gen = getGenerationFromList(controlsList, name)
        controlsList[name]['gen'] = gen
        // const boolHasChild = hasChild(controlsList, name)
        // controlsList[name]['hasChild'] = boolHasChild
    }) 

    // arrayControlsList = Object.keys(controlsListDuplicates)
    // arrayControlsList.forEach(name => {     
    //     const gen = getGenerationFromDuplicateList(controlsList, name)
    //     controlsListDuplicates[name]['gen'] = gen
    // }) 

    // console.log(controlsList);
    fs.writeFileSync("./public/assets/data/controlsListDuplicates.json", JSON.stringify(controlsListDuplicates))
    fs.writeFileSync("./public/assets/data/controlsList.json", JSON.stringify(controlsList))
}


function createControlsFaction() {
    function getRank(control, parent, gen) {
        let rank

        switch (gen) {
            case 0:
                rank = controlsList[control]['rank']
                break;
        
            case 1:
                rank = controlsList[parent]['rank'] + '-' + controlsList[control]['rank']
                break;
        
            case 2:
                rank = controlsList[controlsList[parent]['parent']]['rank'] +
                '-' + controlsList[parent]['rank'] +
                '-' + controlsList[control]['rank']
                break;
        
            case 3:
                rank = controlsList[controlsList[controlsList[parent]['parent']]['parent']]['rank'] +
                '-' + controlsList[controlsList[parent]['parent']]['rank'] +
                '-' + controlsList[parent]['rank'] +
                '-' + controlsList[control]['rank']
                break;
            
            default:
                break;
        }

        return rank
    }

    arrayFaction.forEach(faction => {
        controlsFaction[faction] = { 'gen0': {}, 'gen1': {}, 'gen2': {}, 'gen3': {} }
    })

    arrayControlsList = Object.keys(controlsList)
    arrayControlsList.forEach(control => {
        const faction = controlsList[control]['faction']
        const gen = controlsList[control]['gen']
        const parent = controlsList[control]['parent']
        const rank = getRank(control, parent, gen)

        controlsFaction[faction]['gen' + gen][rank] = {name: control, parent: parent}
    })
    
    // console.log(controlsFaction['men']);
    fs.writeFileSync("./public/assets/data/controlsFaction.json", JSON.stringify(controlsFaction))
}


const file = fs.readFileSync(csvPath, 'utf-8')
const arrayFile = file.split(/\r\n/)

createControlsList()
createControlsFaction()
