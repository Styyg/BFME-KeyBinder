let rawDataIn;
let currentShortcuts = { controls: {} };
let newShortcuts = { controls: {} };
const arrayFaction = ["men", "elves", "dwarves", "isengard", "mordor", "goblins", "angmar", "misc"];
// const arrayType = ["buildings", "units", "abilities", "heroes", "misc"];
let fileName;

function init() {
  setEventListeners();
}

async function setEventListeners() {
  const inputFile = document.getElementById("inputFile");
  const btnDownload = document.getElementById("btn-download");
  const btnTest = document.getElementById("test");
  const inputTest = document.getElementById("inputTest");
  const selectFaction = document.getElementById("select-faction");
  // const selectType = document.getElementById("select-type")

  inputFile.addEventListener("change", function selectedFileChanged() {
    if (!testFile(this.files)) return;

    const file = this.files[0];
    fileName = file.name;

    const reader = new FileReader();
    reader.onload = function fileReadCompleted() {
      rawDataIn = reader.result;
      // console.log(rawDataIn)
      // console.log(JSON.stringify(rawDataIn)) // used to see \n and \r in console

      const regexp = getLineBreakFormat(rawDataIn);
      const arrayData = rawDataIn.split(regexp);

      // reset factions div to avoid duplication
      arrayFaction.forEach((faction) => {
        document.getElementById(faction).innerHTML = "";
      });
      document.getElementById("uncategorized").innerHTML = "";

      // read data and create html components
      extractDataAndCreateHTMLComponents(arrayData);
    };
    reader.readAsText(file, "windows-1252");
    document.getElementById("main-div").style.display = "block";
  });

  btnDownload.addEventListener("click", () => {
    // need to run some test before accepting keys
    downloadFile();
  });

  // btnTest.addEventListener('click', () => {
  //   inputTest.value = 'esygh'
  // })

  // inputTest.addEventListener('change', () => {
  //   console.log('youpi 2');
  // })

  selectFaction.addEventListener("change", function factionChange() {
    const currentFaction = this.value;
    arrayFaction.forEach((faction) => {
      if (currentFaction == faction) {
        document.getElementById(faction).hidden = false;
      } else {
        document.getElementById(faction).hidden = true;
      }
    });
  });
}

function toggleHiddenChildsAfterMe(me) {
  parent = me.parentNode;
  arrayChildren = Array.from(parent.children);
  let i;
  for (i = 0; i < arrayChildren.length; i++) {
    if (arrayChildren[i].id == me.id) {
      break;
    }
  }
  i++;
  hidden = arrayChildren[i].hidden;
  for (k = i; k < arrayChildren.length; k++) {
    arrayChildren[k].hidden = !hidden;
  }
}

// function testToggle(me, toShow) {
//   if(toShow.hidden) {
//     toShow.hidden = false
//     me.innerText = '<-'
//   } else {
//     toShow.hidden = true
//     me.innerText = '->'
//   }
// }

// extract data from file content, store current shortcuts and create html
async function extractDataAndCreateHTMLComponents(arrayData) {
  // all controls from input file
  const jsonAllControls = getAllControlsWithShortcuts(arrayData);
  // controls from csv controls file (list of all controls)
  // const fileControls = await readFileFromServer("./assets/data/controlsList.json");
  // const jsonControls = JSON.parse(fileControls);
  // controls from csv faction file (splited by faction, faction splited by type: buildings, units etc)
  const fileControlsFact = await readFileFromServer("./assets/data/json/controlsFaction.json");
  const jsonControlsFact = JSON.parse(fileControlsFact);
  // arrays of controls
  // const arrayCsvControlsNames = Object.keys(jsonControls);
  const arrayControlsFaction = Object.keys(jsonControlsFact);
  // const arrayAllControlsNames = Object.keys(jsonAllControls)
  // div that contains all uncategorized controls (not from csv but presents in input file)
  const divUncategorized = (document.getElementById("uncategorized").innerHTML = "");

  var duplicatedNames = [];
  arrayControlsFaction.forEach((faction) => {
    const arrayGen = Object.keys(jsonControlsFact[faction]);

    arrayGen.forEach((generation) => {
      const arrayRank = Object.keys(jsonControlsFact[faction][generation]);

      arrayRank.forEach((rank) => {
        const control = jsonControlsFact[faction][generation][rank]["name"];
        const parent = jsonControlsFact[faction][generation][rank]["parent"];
        const duplicated = jsonControlsFact[faction][generation][rank]["duplicated"];
        const key = getShortcut(jsonAllControls[control]);
        var desc;
        if (jsonAllControls[control] === undefined) {
          desc = "";
        } else {
          desc = jsonAllControls[control].replace("&", "");
        }
        const titre = control.split(":")[1];

        var src, name, id, idNew, divId, hidden;

        // store keys in a json object
        currentShortcuts.controls[control] = { key: key };

        // type = jsonControls[control]['type']
        // name = faction + "-" + type
        src = "./assets/images/" + faction + "/" + generation + "/" + titre + ".png";
        if (duplicated == true) {
          id = "";
          idNew = "";
          name = control;
          if (!duplicatedNames.includes(control)) {
            duplicatedNames.push(control);
          }
          if (document.getElementById(control + "-new") === null) {
            const inputControl = `<input class="form-control small-input" 
                id="${control}-new" 
                maxlength="1" 
                type="text">
            </input>`;
            document.getElementById("duplicated").insertAdjacentHTML("beforeend", inputControl);
          }
        } else {
          id = control;
          // id = 'id="' + control + '"'
          idNew = control + "-new";
          name = "";
        }

        if (parent == "") {
          divId = faction;
          // hidden = ''
        } else {
          divId = parent;
          // hidden = 'hidden'
        }

        // div format for each controls
        const divControlRow = `<div id="${id}" class="mt-2 border border-secondary border-3 rounded-3" ${hidden}>
          <div class="row align-items-center" >
            <div class="col-md-1">
                <img class="icon" src="${src}">
            </div>
            <div class="col-md-3">
                <label class="form-label">${titre}</label>
            </div>
            <div class="col-md-3 text-center">
                <div class="row">
                    <label class="form-label">Shortcut</label>
                </div>
                <div class="row align-items-center">
                    <div class="col">
                        <label>current : </label> 
                        <output>${key}</output>
                    </div>
                    <div class="col">
                        <label>new : </label> 
                        <input class="form-control small-input" id="${idNew}" name="${name}" pattern="[A-Za-z]" title="Only letters [A-Z a-z]" maxlength="1" type="text"></input>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="row text-center">
                    <label class="form-label" id="${control}-desc">${desc}</label>
                </div>
            </div>
          </div>
        </div>`;

        // if(arrayCsvControlsNames.includes(control)) {
        // if(jsonControls[control]['hasChild']) {
        if (document.getElementById(parent + "-toggle") === null && generation != "gen0") {
          const divFleche = `<div id="${parent}-toggle" class="text-center border border-warning border-3" onclick="toggleHiddenChildsAfterMe(this)">
              ->
            </div>`;
          //onclick="testToggle(this, document.getElementById('child1'))"
          document.getElementById(parent).insertAdjacentHTML("beforeend", divFleche);
        }
        // }

        // add html element
        document.getElementById(divId).insertAdjacentHTML("beforeend", divControlRow);

        const selectedFaction = document.getElementById("select-faction").value;
        if (selectedFaction == faction) {
          document.getElementById(faction).hidden = false;
        } else {
          document.getElementById(faction).hidden = true;
        }
      });
    });
  });

  duplicatedNames.forEach((name) => {
    const arrayElements = document.getElementsByName(name);
    const input = document.getElementById(name + "-new");

    arrayElements.forEach((element) => {
      element.addEventListener("input", () => {
        input.value = element.value;

        sameNameElements = document.getElementsByName(name);
        sameNameElements.forEach((elem) => {
          if (elem != element) {
            elem.value = element.value;
          }
        });
      });
    });
  });
}

function downloadFile() {
  arrayControlsName = Object.keys(currentShortcuts.controls);
  // newShortcuts.controls = {}
  arrayControlsName.forEach((element) => {
    inputNewKey = document.getElementById(element + "-new");
    if (inputNewKey !== null) {
      key = inputNewKey.value.toUpperCase();

      if (isLetter(key)) {
        newShortcuts.controls[element] = {};
        newShortcuts.controls[element]["key"] = key;
      } else if (key) {
        // console.log(inputNewKey.parentNode);
        // inputNewKey.classList.add("is-invalid");
      }
    } else {
      console.log("getElementById(" + element + "-new)" + " not found");
    }
  });

  const lengthControls = Object.keys(newShortcuts.controls).length;
  if (lengthControls) {
    const newFile = getFileWithNewShortcuts();
    const encoded = new TextEncoder("windows-1252", { NONSTANDARD_allowLegacyEncoding: true }).encode(newFile);
    download(encoded, fileName);
  }
}

function getAllControlsWithShortcuts(array) {
  var results = {};

  for (let i = 1; i < array.length; i++) {
    const element = array[i];
    if (element.trim().startsWith('"') && element.includes("&") && isLetter(element.charAt(element.search("&") + 1))) {
      var offset = 1;
      while (array[i - offset].trim().startsWith('"') || array[i - offset].trim().startsWith("//")) {
        offset++;
      }
      results[array[i - offset].trim()] = array[i].trim();
    }
  }
  return results;
}

function testFile(files) {
  const maxFileSize = 2 * 1024 * 1024; //2MB
  const allowedExtension = ["str", "big"];
  const file = files[0];

  // no file
  if (files.length === 0) {
    document.getElementById("errInputFile").style.visibility = "hidden";
    return;
  }

  // not right file extension
  const array = file.name.split(".");
  const extensionName = array[array.length - 1];
  if (!allowedExtension.includes(extensionName)) {
    document.getElementById("errInputFile").textContent = "Invalid format, .str or .big is required";
    document.getElementById("errInputFile").style.visibility = "visible";
    return;
  }

  // wrong file size
  if (file.size > maxFileSize) {
    console.log("File selected is too big : " + file.size + "o, max is : " + maxFileSize + "o");
    document.getElementById("errInputFile").textContent = "File selected is too big, 2Mo max";
    document.getElementById("errInputFile").style.visibility = "visible";
    return;
  }

  document.getElementById("errInputFile").style.visibility = "hidden";
  return true;
}

// some files had different line break format varying between \n and \r\n
function getLineBreakFormat(str) {
  var reg;
  if (str.search("\r\n") > -1) {
    reg = /\r\n/;
  } else {
    reg = /\n/;
  }

  return reg;
}

function getShortcut(str) {
  if (str === undefined) return "";
  const searchPos = str.search("&");
  if (searchPos > -1 && isLetter(str.charAt(searchPos + 1))) return str.charAt(searchPos + 1).toUpperCase();
  else return "";
}

function getFileWithNewShortcuts() {
  const arrayControlsNames = Object.keys(newShortcuts.controls);
  // split data by line break
  const regexp = getLineBreakFormat(rawDataIn);
  dataIn = rawDataIn.split(regexp);

  arrayControlsNames.forEach((name) => {
    index = dataIn.indexOf(name); // get ControlBar index

    // if we get the ControlBar
    if (index > -1) {
      key = newShortcuts.controls[name]["key"];
      offset = 1;
      // need to avoid to change shortcuts in commented lines
      while (dataIn[index + offset].startsWith("//")) {
        offset++;
      }
      dataIn[index + offset] = dataIn[index + offset].replaceAll("&", "");
      searchPos = dataIn[index + offset].toUpperCase().search(key);

      if (searchPos > -1) {
        if (searchPos < dataIn[index + offset].length - 2) {
          dataIn[index + offset] = dataIn[index + offset].replace(" [" + key + "]", "");
        }
        dataIn[index + offset] =
          dataIn[index + offset].slice(0, searchPos) + "&" + dataIn[index + offset].slice(searchPos);
      } else {
        // console.log(dataIn[index + offset]);
        if (dataIn[index + offset].endsWith(']"')) {
          dataIn[index + offset] = dataIn[index + offset].slice(0, -3) + "&" + key + dataIn[index + offset].slice(-2);
        } else {
          dataIn[index + offset] =
            dataIn[index + offset].slice(0, -1) + " [&" + key + "]" + dataIn[index + offset].slice(-1);
        }
      }
    } else {
      console.log(name + " was not found");
    }
  });

  let newFile;
  if (regexp.source == "\\r\\n") newFile = dataIn.join("\r\n");
  else newFile = dataIn.join("\n");

  return newFile;
}

function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i);
}

async function readFileFromServer(path) {
  let response = await fetch(path);

  // read response stream as text
  let text_data = await response.text();

  return text_data;
}

// const text = "le contenu du fichier"
// const encoded = new TextEncoder("windows-1252",{ NONSTANDARD_allowLegacyEncoding: true }).encode(text);
// download(encoded, file.name);
function download(content, filename, contentType) {
  if (!contentType) contentType = "application/octet-stream";
  var a = document.createElement("a");
  var blob = new Blob([content], { type: contentType });
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

init();
