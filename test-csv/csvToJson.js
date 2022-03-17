const fs = require('fs')
const arrayFaction = ["men",  "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"];
const controlsList = {}
const controlsListDuplicates = {}
const arrayAllControlsList = []
const controlsFaction = {}
const csvPath = "./test-csv/controls.csv"

// return a bool
// function hasChild(jsonList, element) {
//     const boolHasChild = (control) => jsonList[control]['parent'] == element

//     jsonKeys = Object.keys(jsonList)

//     return jsonKeys.some(boolHasChild);
// }

function findDuplicates(array) {
    return array.filter((item, index) => array.indexOf(item) !== index)
}

// function createControlsList() {
    
//     // 0 : parent, 1 child, 2 child of child, ...
//     function getGeneration(element) {
//         let i = 0
//         let parent = controlsList[element]['parent']
//         while(parent != '') {
//             i++
//             parent = controlsList[parent]['parent']
//         }
//         return i
//     }

//     function getGenerationFromDuplicateList(element, id) {
//         let parent = controlsListDuplicates[element][id]['parent']
//         return controlsList[parent]['gen'] + 1
//     }



//     arrayFile.shift()

//     var arrayControls = []
//     arrayFile.forEach(row => {
//         arrayControls.push(row.split(',')[0])
//     })
//     const arrayDuplicates = findDuplicates(arrayControls)
//     arrayDuplicates.forEach(element => {
//         controlsListDuplicates[element] = {}
//     })
    
//     arrayFile.forEach(row => {
//         const col = row.split(',')
//         const name = col[0]
//         const faction = col[1]
//         const rank = parseInt(col[2])
//         const parent = col[3]

//         // if(controlsList[name] === undefined) {
//             // controlsList[name] = {}
//         // }
//         if(controlsListDuplicates[name] === undefined) {
//             controlsList[name] = {parent: parent, rank: rank, faction: faction}
//         } else {
//             // controlsList[name] = {parent: parent, rank: rank, faction: faction}
//             index = 0
//             while (controlsListDuplicates[name][index] !== undefined) {
//                 index++
//             }
//             controlsListDuplicates[name][index] = {parent: parent, rank: rank, faction: faction}
//         }
//     })

//     arrayControlsList = Object.keys(controlsList)
//     arrayControlsList.forEach(name => {     
//         const gen = getGeneration(name)
//         controlsList[name]['gen'] = gen
//         // const boolHasChild = hasChild(controlsList, name)
//         // controlsList[name]['hasChild'] = boolHasChild
//     }) 

//     arrayControlsList = Object.keys(controlsListDuplicates)
//     arrayControlsList.forEach(name => {
//         id = 0
//         while (controlsListDuplicates[name][id] !== undefined) {
//             const gen = getGenerationFromDuplicateList(name, id)
//             controlsListDuplicates[name][id]['gen'] = gen
//             let newJson = {}
//             newJson[name] = controlsListDuplicates[name][id]
//             newJson[name]['duplicated'] = true
//             arrayControlsListDuplicates.push(newJson)
//             id++
//         }
//     }) 
//     // console.log(arrayControlsListDuplicates);

//     // console.log(controlsList);
//     // fs.writeFileSync("./public/assets/data/controlsListDuplicates.json", JSON.stringify(controlsListDuplicates))
//     // fs.writeFileSync("./public/assets/data/controlsList.json", JSON.stringify(controlsList))
// }


function createControlsList() {
    
    // 0 : parent, 1 child, 2 child of child, ...
    function getGeneration(element) {
        let i = 0
        let parent = controlsList[element]['parent']
        while(parent != '') {
            i++
            parent = controlsList[parent]['parent']
        }
        return i
    }

    function getGenerationFromDuplicateList(element, id) {
        let parent = controlsListDuplicates[element][id]['parent']
        return controlsList[parent]['gen'] + 1
    }



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
        const gen = getGeneration(name)
        controlsList[name]['gen'] = gen
        let newJson = {}
        newJson[name] = controlsList[name]
        arrayAllControlsList.push(newJson)
    }) 

    arrayControlsList = Object.keys(controlsListDuplicates)
    arrayControlsList.forEach(name => {
        id = 0
        while (controlsListDuplicates[name][id] !== undefined) {
            const gen = getGenerationFromDuplicateList(name, id)
            controlsListDuplicates[name][id]['gen'] = gen
            let newJson = {}
            newJson[name] = controlsListDuplicates[name][id]
            newJson[name]['duplicated'] = true
            arrayAllControlsList.push(newJson)
            id++
        }
    }) 
    // console.log(arrayAllControlsList);

    // console.log(controlsList);
    // fs.writeFileSync("./public/assets/data/controlsListDuplicates.json", JSON.stringify(controlsListDuplicates))
    // fs.writeFileSync("./public/assets/data/controlsList.json", JSON.stringify(controlsList))
}


function createControlsFaction() {
    function getFullRank(control, gen, rank) {
        if(gen > 0) {
            let parent = controlsList[control]['parent']
            rank = getFullRank(parent, gen-1, controlsList[parent]['rank']) + '-' + rank
        }
        return rank
    }

    function getFullRankFromDuplicates(control, gen, rank, parent) {
        if(gen > 0) {
            rank = getFullRank(parent, gen-1, controlsList[parent]['rank']) + '-' + rank
        }
        return rank
    }

    // function getRank(control, parent, gen) {
    //     let rank

    //     // fonction récurrente ?????
    //     switch (gen) {
    //         case 0:
    //             rank = controlsList[control]['rank']
    //             break;
        
    //         case 1:
    //             rank = controlsList[parent]['rank'] + '-' + controlsList[control]['rank']
    //             break;
        
    //         case 2:
    //             rank = controlsList[controlsList[parent]['parent']]['rank'] +
    //             '-' + controlsList[parent]['rank'] +
    //             '-' + controlsList[control]['rank']
    //             break;
        
    //         case 3:
    //             rank = controlsList[controlsList[controlsList[parent]['parent']]['parent']]['rank'] +
    //             '-' + controlsList[controlsList[parent]['parent']]['rank'] +
    //             '-' + controlsList[parent]['rank'] +
    //             '-' + controlsList[control]['rank']
    //             break;
            
    //         default:
    //             break;
    //     }

    //     return rank
    // }


    arrayFaction.forEach(faction => {
        controlsFaction[faction] = { 'gen0': {}, 'gen1': {}, 'gen2': {}, 'gen3': {} }
    })

    arrayAllControlsList.forEach(element => {
        const name = Object.keys(element)[0]
        const parent = element[name]['parent']
        const rank = element[name]['rank']
        const gen = element[name]['gen']
        const faction = element[name]['faction']
        const duplicated = element[name]['duplicated']
        var fullRank
        if(duplicated) {
            const id = 
            fullRank = getFullRankFromDuplicates(name, gen, rank, parent)
            controlsFaction[faction]['gen' + gen][fullRank] = {name: name, parent: parent, duplicated: true}
        } else {            
            fullRank = getFullRank(name, gen, rank)
            controlsFaction[faction]['gen' + gen][fullRank] = {name: name, parent: parent}
        }
    })

    // arrayControlsList = Object.keys(controlsList)
    // arrayControlsList.forEach(control => {
    //     const faction = controlsList[control]['faction']
    //     const gen = controlsList[control]['gen']
    //     const parent = controlsList[control]['parent']
    //     // const rank = getRank(control, parent, gen)
    //     const rank = getFullRank(control, gen, controlsList[control]['rank'])

    //     controlsFaction[faction]['gen' + gen][rank] = {name: control, parent: parent}
    // })

    // addDuplicates()
    
    fs.writeFileSync("./public/assets/data/controlsFaction.json", JSON.stringify(controlsFaction))
}


const file = fs.readFileSync(csvPath, 'utf-8')
const arrayFile = file.split(/\r\n/)

createControlsList()
createControlsFaction()
