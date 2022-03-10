var fs = require("fs");

const filePath = "./test/KeyBinder - controls.csv";
const filePathList = "./test/controlsList.json";
const filePathListFact = "./test/controlsListFaction.json";

const file = fs.readFileSync(filePath, "utf-8");

const arrayStr = file.split(/\r\n/);
const headers = arrayStr[0].split(",");

var obj

obj = getControlList(arrayStr)
fs.writeFileSync(filePathList, JSON.stringify(obj));

obj = getControlListFaction(arrayStr)
fs.writeFileSync(filePathListFact, JSON.stringify(obj));


// console.log(obj)



function getControlListFaction(data) {
    obj = { isengard: {}, mordor: {}, goblins: {}, men: {}, elves: {}, dwarves: {}, angmar: {}, misc: {} }

    Object.keys(obj).forEach(element => {
        obj[element] = { buildings: {}, units: {}, abilities: {}, heroes: {}, misc: {} }
    });
    
    for (var i = 1; i < data.length; i++) {
        const elements = data[i].split(",");
        obj[elements[1]][elements[2]][elements[3]] = elements[0]
    }
    return obj
}

function getControlList(data) {
    obj = { controls: {} };

    for (var i = 1; i < data.length; i++) {
        const elements = data[i].split(",");

        obj.controls[elements[0]] = {}; // name
        obj.controls[elements[0]][headers[1]] = elements[1]; // faction
        obj.controls[elements[0]][headers[2]] = elements[2]; // type
        obj.controls[elements[0]][headers[4]] = elements[4]; // version
    }
    return obj
}
