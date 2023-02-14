import * as Utils from "./utils.js"

const sizePosInBigHeader = 4
let fileData = {} // contains, all files data, type, index
let bufferData

// return the content of the file as a string
export async function extractStrData(buffer, extensionName, searchFile) {
  bufferData = buffer
  fileData = {}
  const decoder = new TextDecoder("utf-8")
  const fileType = decoder.decode(new DataView(bufferData, 0, 4))
  if (extensionName != "big") {
    fileData["type"] = extensionName.toUpperCase()
  }

  let data
  switch (fileType) {
    case "BIGF":
    case "BIG4":
      fileData["type"] = fileType
      data = await extractDataFromBIG(buffer, searchFile)
      break
    default:
      data = extractDataFromLotr(buffer, extensionName)
      break
  }

  if (searchFile == "commandmap") {
    data = data
      .replaceAll(/\r/g, "")
      .split(/\n/)
  } else {
    // trim because I got some problems with tabs or space at the end of control's name.
    data = data
      .replaceAll(/\r/g, "")
      .split(/\n/)
      .map((element) => element.trim())
  }

  return data
}

// extract specified file as binary from the BIGF archive
// big structure http://wiki.xentax.com/index.php/EA_BIG_BIGF_Archive
async function extractDataFromBIG(buffer, searchFile) {
  // const filesToExtract = ["lotr.csf", "data\\lotr.str"]
  let filesToExtract
  if (searchFile == "commandmap") {
    filesToExtract = ["commandmap.ini"]
  } else {
    filesToExtract = ["lotr.csf", "lotr.str"]
  }

  bufferData = buffer

  // type of big file, so far i've seen only BIGF or BIG4 for BFME files
  // const decoder = new TextDecoder("utf-8")
  // const type = decoder.decode(new DataView(bufferData, 0, 4))

  // size of the whole big archive file
  // const archiveSize = new DataView(bufferData).getUint32(4, true)
  // number of files present in big file
  const nbFiles = new DataView(bufferData).getUint32(8)
  // size of the header, right before files data
  // const headerSize = new DataView(bufferData).getUint32(12)

  fileData["allFiles"] = []
  let validFiles = {}

  // files header start at byte n°16
  let readOffset = 16
  // for each file in archive, header data are stored
  for (let i = 0; i < nbFiles; i++) {
    const headerStartPos = readOffset
    const fDataStartPos = new DataView(bufferData).getUint32(readOffset)
    readOffset += 4
    const fDataSize = new DataView(bufferData).getUint32(readOffset)
    readOffset += 4

    let fileName = ""
    let dataView = new DataView(bufferData).getInt8(readOffset)
    while (dataView != "") {
      fileName += String.fromCharCode(dataView)
      readOffset++
      dataView = new DataView(bufferData).getInt8(readOffset)
    }

    readOffset += 1 // +1 to skip the null byte

    fileData["allFiles"].push({
      dataStartPos: fDataStartPos,
      dataSize: fDataSize,
      headerStartPos: headerStartPos,
      fileName: fileName,
    })

    const split = fileName.split("\\")
    const fileNameTrimed = split[split.length - 1]
    if (filesToExtract.includes(fileNameTrimed)) {
      // fileData["selectedFileIndex"] = i
      validFiles[fileName] = i
    }
  }

  // throw error if file is not found
  // if (fileData["selectedFileIndex"] == undefined) {
  // throw error if no file is found
  const nbValidFiles = Object.keys(validFiles).length
  if (nbValidFiles == 0) {
    if (searchFile == "commandmap") {
      throw "commandmap.ini was not found in big archive"
    } else {
      throw "lotr.csf or lotr.str was not found in big archive"
    }
  }

  let selectedFileIndex
  if (nbValidFiles == 1) {
    const fileName = Object.keys(validFiles)[0]
    selectedFileIndex = validFiles[fileName]
  } else {
    selectedFileIndex = await getFileIndexFromList(validFiles)
  }

  fileData["selectedFileIndex"] = selectedFileIndex
  const objFileToExtract = fileData["allFiles"][selectedFileIndex]
  const fileToExtract = objFileToExtract["fileName"]
  const dataStartPos = objFileToExtract["dataStartPos"]
  const dataSize = objFileToExtract["dataSize"]

  const fileBuffer = bufferData.slice(dataStartPos, dataStartPos + dataSize)
  const split = fileToExtract.split(".")
  const extensionName = split[split.length - 1]
  const decodedFileData = extractDataFromLotr(fileBuffer, extensionName)
  fileData["fileExtension"] = extensionName

  return decodedFileData
}

function getFileIndexFromList(validFiles) {
  const divSelect = document.getElementById("selectFile")
  const selectList = divSelect.querySelector("select")
  selectList.innerHTML = ""

  const option = `<option value="">
    Select a file...
  </option>`

  selectList.insertAdjacentHTML("beforeend", option)

  for (const file in validFiles) {
    const option = `<option value="${validFiles[file]}">
      ${file}
    </option>`

    selectList.insertAdjacentHTML("beforeend", option)
  }

  divSelect.hidden = false

  return new Promise(function (resolve, reject) {
    selectList.addEventListener("change", function () {
      if (selectList.value != "") {
        divSelect.hidden = true
        resolve(parseInt(selectList.value))
      }
    })
  })
}

function extractDataFromLotr(buffer, extensionName) {
  let decodedFileData
  if (extensionName == "csf") {
    decodedFileData = decodeCSF(buffer)
    fileData["encoding"] = guessLotrEncoding(decodedFileData)
  } else {
    fileData["encoding"] = guessLotrEncoding(buffer)
    const decoder = new TextDecoder(fileData["encoding"])
    decodedFileData = decoder.decode(buffer)
  }

  return decodedFileData
}

export function assembleFile(arrayStrFile) {
  let data
  switch (fileData["type"]) {
    case "BIGF":
    case "BIG4":
      data = replaceFileInBigArchive(arrayStrFile)
      break
    case "CSF":
      data = encodeCSF(arrayStrFile)
      break
    default:
      data = new TextEncoder(fileData["encoding"], { NONSTANDARD_allowLegacyEncoding: true }).encode(arrayStrFile.join("\n"))
      break
  }

  return data
}

function replaceFileInBigArchive(arrayStrFile) {
  const arrayFiles = fileData["allFiles"]
  const fileIndex = fileData["selectedFileIndex"]
  const pos = arrayFiles[fileIndex]["dataStartPos"]
  const size = arrayFiles[fileIndex]["dataSize"]
  const headerSizePos = arrayFiles[fileIndex]["headerStartPos"] + 4

  let encoded
  if (fileData["fileExtension"] == "csf") {
    encoded = encodeCSF(arrayStrFile)
  } else {
    encoded = new TextEncoder(fileData["encoding"], { NONSTANDARD_allowLegacyEncoding: true }).encode(arrayStrFile.join("\n"))
  }

  // append buffers to make the new big archive
  const newData = Utils.appendBuffer(Utils.appendBuffer(bufferData.slice(0, pos), encoded), bufferData.slice(pos + size))

  // overwrite whole archive size in header
  const dataView = new DataView(newData)
  dataView.setUint32(sizePosInBigHeader, newData.byteLength, true)

  const newFileSize = encoded.byteLength

  // overwrite file's size in global header
  dataView.setUint32(headerSizePos, newFileSize)
  arrayFiles[fileIndex]["dataSize"] = newFileSize

  // update start postion of all files after the one modified (because of the size change)
  for (let i = fileIndex + 1; i < arrayFiles.length; i++) {
    const headerPos = arrayFiles[i]["headerStartPos"]
    const newStartPos = arrayFiles[i - 1]["dataStartPos"] + arrayFiles[i - 1]["dataSize"]

    dataView.setUint32(headerPos, newStartPos)
    arrayFiles[i]["dataStartPos"] = newStartPos
  }

  return newData
}

function encodeCSF(str) {
  let tmpHeader
  if (fileData["type"].startsWith("BIG")) {
    const fileIndex = fileData["selectedFileIndex"]
    const pos = fileData["allFiles"][fileIndex]["dataStartPos"]
    tmpHeader = bufferData.slice(pos, pos + 24)
  } else {
    tmpHeader = bufferData.slice(0, 24)
  }

  // header shouldn't have changed
  const header = tmpHeader

  // str = str.filter((el) => el != "" && el != "END")
  const encoder = new TextEncoder()
  const encoder16 = new TextEncoder("utf-16", { NONSTANDARD_allowLegacyEncoding: true })
  let labelsData = new ArrayBuffer()

  for (let i = 0; i < str.length; i++) {
    // for (const row of str) {
    while (str[i] == "" && i < str.length) {
      i++
    }
    if (i < str.length) {
      const labelRow = str[i]

      // ---------- label ----------
      const LBL = " LBL"
      // add LBL and 4 empty bytes
      let buff = Utils.appendBuffer(encoder.encode(LBL).buffer, new ArrayBuffer(8))
      const dataView = new DataView(buff)
      // nbr of strings pairs, always 1 it seems
      dataView.setInt32(4, 1, true)
      // label name length
      dataView.setInt32(8, labelRow.length, true)

      // add label name
      buff = Utils.appendBuffer(buff, encoder.encode(labelRow).buffer)

      labelsData = Utils.appendBuffer(labelsData, buff)

      i++
      // ---------- value ----------
      let valueRow = ""
      // have to do this because of the \n inside the labels
      while (str[i] != "END" && i < str.length) {
        if (valueRow != "") {
          valueRow += "\n"
        }
        valueRow += str[i]
        i++
      }
      valueRow = valueRow.slice(1).slice(0, -1)

      const valueType = " RTS"
      // add RTS and 4 empty bytes
      buff = Utils.appendBuffer(encoder.encode(valueType).buffer, new ArrayBuffer(4))
      const dataView2 = new DataView(buff)

      // value length
      dataView2.setInt32(4, valueRow.length, true)

      if (valueRow.length > 0) {
        // add value
        const buff_utf16 = encoder16.encode(valueRow).buffer
        revertInt8Buffer(buff_utf16)
        buff = Utils.appendBuffer(buff, buff_utf16)
      }

      labelsData = Utils.appendBuffer(labelsData, buff)
    }
  }

  labelsData = Utils.appendBuffer(header, labelsData)

  return labelsData
}

function revertInt8Buffer(buffer) {
  const length = buffer.byteLength
  for (let i = 0; i < length; i++) {
    const dataV = new DataView(buffer)
    dataV.setInt8(i, 255 - dataV.getUint8(i))
  }
}

// csf structure https://modenc.renegadeprojects.com/CSF_File_Format
function decodeCSF(csf) {
  const decoder = new TextDecoder("utf-8")

  let decoded = ""

  // let index = 0
  // CSF header
  // const type = decoder.decode(new DataView(csf, index, 4))
  // index += 4
  // const version = new DataView(csf).getInt32(index, true)
  // index += 4
  let index = 8
  const numLabel = new DataView(csf).getInt32(index, true)
  // index += 4
  // const numStrings = new DataView(csf).getInt32(index, true)
  // index += 4
  // const unUsed = new DataView(csf).getInt32(index, true)
  // index += 4
  // const language = new DataView(csf).getInt32(index, true)
  // index += 4

  // console.log("type : " + type)
  // console.log("version : " + version)
  // console.log("numLabel : " + numLabel)
  // console.log("numStrings : " + numStrings)
  // console.log("unUsed : " + unUsed)
  // console.log("language : " + language)

  index = 24
  for (let i = 0; i < numLabel; i++) {
    // label header
    const LBL = decoder.decode(new DataView(csf, index, 4))
    index += 4
    const numStringsPairs = new DataView(csf).getInt32(index, true)
    index += 4
    const labelLength = new DataView(csf).getInt32(index, true)
    index += 4
    const labelName = decoder.decode(new DataView(csf, index, labelLength))
    index += labelLength

    // console.log("LBL : " + LBL)
    // console.log("numStringsPairs : " + numStringsPairs)
    // console.log("labelLength : " + labelLength)
    // console.log("labelName : " + labelName)

    if (numStringsPairs > 0) {
      // values
      // const RTS = decoder.decode(new DataView(csf, index, 4))
      index += 4
      const valueLength = new DataView(csf).getInt32(index, true)
      index += 4
      let arrayValue = []
      for (let i = 0; i < valueLength; i++) {
        const char_bin = new DataView(csf).getUint16(index, true)
        arrayValue.push(String.fromCharCode(256 * 256 - char_bin - 1))
        index += 2
      }
      const value = arrayValue.join("")

      decoded += labelName + "\n" + '"' + value + '"' + "\n" + "END" + "\n\n"

      //   console.log("RTS : " + RTS)
      //   console.log("valueLength : " + valueLength)
      //   console.log("value : " + value)
    } else {
      const value = ""
      decoded += labelName + "\n" + '"' + value + '"' + "\n" + "END" + "\n\n"
    }
  }

  return decoded
}

function guessLotrEncoding(str) {
  // windows1252, windows1251, utf-8
  const cyrillic = /[\u0400-\u04FF]/
  const win1251 = "windows-1251"
  const win1252 = "windows-1252"

  if (cyrillic.test(str)) {
    return win1251
  } else {
    return win1252
  }
}
