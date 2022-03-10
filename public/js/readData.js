const fs = require('fs')

exports.saveKeys = (lotr) => {
    console.log('readData !!!')

    csv = fs.readFile("./controlList.csv")
    console.log(csv)
}