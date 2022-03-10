// const { init } = require("express/lib/application");
let rawDataIn
// let Shortcuts = {}
let currentShortcuts = {'controls': {}}
let newShortcuts = {'controls': {}}
let fileName
let regexp

function init() {
    createControlsInputs()
    setEventListeners()
}

function setEventListeners() {
    document.getElementById('inputFile').addEventListener('change', function selectedFileChanged() {
        if (!testFile(this.files)) return

        // document.getElementById('div-keys').innerHTML = ''

        const file = this.files[0]
        fileName = file.name

        const reader = new FileReader()

        reader.onload = function fileReadCompleted() {
            rawDataIn = reader.result
            // console.log(rawDataIn)
            // console.log(JSON.stringify(rawDataIn)) // used to see \n and \r in console

            getKeysFromData(rawDataIn)
            
            // var encoded = new TextEncoder("windows-1252",{ NONSTANDARD_allowLegacyEncoding: true }).encode(newvalue);
            // download(encoded, file.name);
        }
        reader.readAsText(file, 'windows-1252');
        document.getElementById('main-div').style.display = "block"
    })
}

function validation() {
    arrayControlsName = Object.keys(currentShortcuts.controls)
    // newShortcuts.controls = {}
    arrayControlsName.forEach(element => {
        elementKey = document.getElementById(element + '-new')
        key = elementKey.value.toUpperCase()

        if(isLetter(key)){
            newShortcuts.controls[element] = {}
            newShortcuts.controls[element]['key'] = key
        } else if(key) {       
            console.log(elementKey.parentNode);             
            elementKey.classList.add('is-invalid')
        }
    });

    const lengthControls = Object.keys(newShortcuts.controls).length
    if(lengthControls) {            
        const newFile = applyNewShortcuts()
        const encoded = new TextEncoder("windows-1252",{ NONSTANDARD_allowLegacyEncoding: true }).encode(newFile);
        download(encoded , fileName)
    }
}

async function createControlsInputs() {

    const controlsListStr = await readFileFromServer("../assets/data/controlsListFaction.json");
    const controlsList = JSON.parse(controlsListStr)

    const arrayFaction = Object.keys(controlsList)
    
    arrayFaction.forEach(faction => {
        const selectFaction = document.getElementById('select-faction').value
        
        if (selectFaction == faction)
            document.getElementById(faction).style.display = 'block'
        else
            document.getElementById(faction).style.display = 'none'
        
        const arrayBuildings = Object.values(controlsList[faction].buildings)

        arrayBuildings.forEach(building => {

            const divRow = 
            `
            <div class="row my-1 p-1 align-items-center border rounded-3" name="${faction}">
                <div class="col-md-1">
                    <img class="icon" src="./assets/images/${faction}/buildings/${building.split(':')[1]}.png">
                </div>
                <div class="col-md-3">
                    <label class="form-label" id="${building}-label">${building.split(':')[1]}</label>
                </div>
                <div class="col-md-2 text-center">
                    <div class="row">
                        <label class="form-label">Shortcut</label>
                    </div>
                    <div class="row align-items-center">
                        <div class="col">
                            <label>current : </label> 
                            <output id="${building}-current"></output>
                        </div>
                        <div class="col">
                            <label>new : </label> 
                            <input class="form-control small-input" id="${building}-new" pattern="[A-Za-z]" title="Only letters [A-Z a-z]" maxlength="1" type="text"></input>
                        </div>
                    </div>
                </div>
            </div>
            `

            document.getElementById(faction).insertAdjacentHTML('beforeend', divRow)
            document.getElementById(building + '-new').disabled = true
        })
    })

}

function testFile(files) {
    const maxFileSize = 2 * 1024 * 1024 //2MB
    const allowedExtension = ['str','big'];
    const file = files[0]
    // console.log(file)
    
    if (files.length === 0) {
        // console.log("No file selected")
        // document.getElementById('errInputFile').textContent = "No file selected"
        document.getElementById('errInputFile').style.visibility = "hidden"
        return
    }
    
    const array = file.name.split('.')
    const extensionName = array[array.length-1];
    if (!allowedExtension.includes(extensionName)) {
        // console.log("Invalid format, .str or .big is required")
        document.getElementById('errInputFile').textContent = "Invalid format, .str or .big is required"
        document.getElementById('errInputFile').style.visibility = "visible"
        return
    }

    if(file.size > maxFileSize) {
        console.log('File selected is too big : ' + file.size + 'o, max is : ' + maxFileSize + 'o')
        document.getElementById('errInputFile').textContent = "File selected is too big, 2Mo max"
        document.getElementById('errInputFile').style.visibility = "visible"
        return
    }

    document.getElementById('errInputFile').style.visibility = "hidden"
    return true
}

async function getKeysFromData(data) {

    // Get JSON with all controlbars
    let controlsList
    controlsList = await readFileFromServer("../assets/data/controlsList.json");
    const JSONcontrols = JSON.parse(controlsList)
    const arrayControlsNames = Object.keys(JSONcontrols.controls)

    // split data by line break
    if(data.search('\r\n') > -1) {
        regexp = /\r\n/
    } else {
        regexp = /\n/
    }

    // let regexp=/\r|\n/ // regexp to find all the \r and \n
    arrayRows = data.split(regexp)
    
    // currentShortcuts.controls = {}
    // currentShortcuts = {'controls': {}}
    
    arrayControlsNames.forEach(element => {
        index = arrayRows.indexOf(element) // get ControlBar index
        offset = 1
        // need to avoid to change shortcuts in commented lines
        // while (arrayRows[index + offset].startWith('//')) {
        //     offset ++
        // }
        searchPos = arrayRows[index + 1].search('&')
        potentialKey = arrayRows[index + 1].charAt(searchPos +1)

        // if we get the ControlBar
        if (index > -1) {
            // show ControlBar desc
            document.getElementById(element + '-label').textContent = arrayRows[index + 1].replace('&', '')
            document.getElementById(element + '-new').disabled = false

            // if shortcut is valid
            if((searchPos > -1) && (isLetter(potentialKey))) {
                key = potentialKey.toUpperCase()
        
                // store keys in a json object
                currentShortcuts.controls[element] = {}
                currentShortcuts.controls[element]['key'] = key
        
                // show the key in html
                document.getElementById(element + '-current').textContent = key
            } else {
                document.getElementById(element + '-current').textContent = 'None'
            }
        } else {
            document.getElementById(element + '-label').textContent = 'MISSING: ' + element
            document.getElementById(element + '-current').textContent = 'None'
            document.getElementById(element + '-new').disabled = true
        }
    });
}

function applyNewShortcuts() {
    const arrayControlsNames = Object.keys(newShortcuts.controls)
    // split data by line break
    dataIn = rawDataIn.split(regexp)

    arrayControlsNames.forEach(element => {
        index = dataIn.indexOf(element) // get ControlBar index
        
        // if we get the ControlBar
        if (index > -1) {
            key = newShortcuts.controls[element]['key']
            offset = 1
            // need to avoid to change shortcuts in commented lines
            // while (dataIn[index + offset].startWith('//')) {
                //     offset ++
                // }
            dataIn[index + 1] = dataIn[index + 1].replace('&', '')
            searchPos = dataIn[index + 1].toUpperCase().search(key)
    
            const dataIndex = dataIn[index + 1]
            if(searchPos > -1) {
                dataIn[index + 1] = dataIndex.slice(0, searchPos) + '&' + dataIndex.slice(searchPos)
            } else{
                dataIn[index + 1] = dataIndex.slice(0, -1) + ' [&' + key + ']' + dataIndex.slice(-1)
            }
        } else {
            console.log(element + ' was not found')
        }
    })

    let newFile
    if(regexp.source == '\\r\\n')
        newFile = dataIn.join('\r\n')
    else
        newFile = dataIn.join('\n')

    return newFile
}

function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
}

async function readFileFromServer(path) {
	let response = await fetch(path);
		
	if(response.status != 200) {
		throw new Error("Server File Error");
	}
	
	// read response stream as text
	let text_data = await response.text();

	return text_data;
}
// const text = "le contenu du fichier"
// const encoded = new TextEncoder("windows-1252",{ NONSTANDARD_allowLegacyEncoding: true }).encode(text);
// download(encoded, file.name);
function download(content, filename, contentType) {
    if(!contentType) contentType = 'application/octet-stream';
        var a = document.createElement('a');
        var blob = new Blob([content], {'type':contentType});
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        a.click();
}

function factionChange(faction) {
    
    const children = document.getElementById('div-faction').children
    Array.from(children).forEach(element => {
        if(element.id != faction) {
            element.style.display = "none"
        }
    })
    
    document.getElementById(faction).style.display = "inline"
}

init()