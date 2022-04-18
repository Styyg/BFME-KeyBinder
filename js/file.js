import * as Utils from "./utils.js"

const newFileData = {}
const sizePosInBigHeader = 4
let BIGbufferData
let startIndex

// extract specified file as binary from the BIGF archive
export function extractFileFromBIG(BIG_File, fileToExtract) {
  BIGbufferData = BIG_File
  // type of big file, so far i've seen only BIGF or BIG4 for BFME files
  // const decoder = new TextDecoder("utf-8")
  // const type = decoder.decode(new DataView(BIGbufferData, 0, 4))

  // size of the whole big archive file
  // const archiveSize = new DataView(BIGbufferData).getUint32(4, true)
  // number of files present in big file
  const nbFiles = new DataView(BIGbufferData).getUint32(8)
  // size of the header, right before files data
  // const headerSize = new DataView(BIGbufferData).getUint32(12)

  newFileData["allFiles"] = []

  // files header start at byte n°16
  let readOffset = 16
  startIndex = -1
  // for each file in archive, header data are stored
  for (let i = 0; i < nbFiles; i++) {
    const headerStartPos = readOffset
    const fDataStartPos = new DataView(BIGbufferData).getUint32(readOffset)
    readOffset += 4
    const fDataSize = new DataView(BIGbufferData).getUint32(readOffset)
    readOffset += 4

    let fileName = ""
    let dataView = new DataView(BIGbufferData).getInt8(readOffset)
    while (dataView != "") {
      fileName += String.fromCharCode(dataView)
      readOffset++
      dataView = new DataView(BIGbufferData).getInt8(readOffset)
    }

    readOffset += 1 // +1 to skip the null byte

    newFileData["allFiles"].push({
      dataStartPos: fDataStartPos,
      dataSize: fDataSize,
      headerStartPos: headerStartPos,
      fileName: fileName,
    })

    if (fileName == fileToExtract) {
      startIndex = i
    }
  }

  // return null if file is not found
  if (startIndex == -1) {
    console.log("Err: file " + fileToExtract + " not found")
    return null
  }

  const dataStartPos = newFileData["allFiles"][startIndex]["dataStartPos"]
  const dataSize = newFileData["allFiles"][startIndex]["dataSize"]

  // encoding: lotr.str is windows-1252 (latin1 also works), commandmap.ini is utf-8
  const decoderWindows1252 = new TextDecoder("windows-1252")
  const fileData = new DataView(BIGbufferData, dataStartPos, dataSize)
  const fileDataStr = decoderWindows1252.decode(fileData)
  newFileData["dataStr"] = fileDataStr

  return fileDataStr
}

export function replaceFileInBigArchive(newFile, fileToExtract) {
  const arrayFiles = newFileData["allFiles"]

  // get index of file to modify
  while (startIndex < arrayFiles.length && arrayFiles[startIndex]["fileName"] != fileToExtract) {
    startIndex++
  }

  const pos = arrayFiles[startIndex]["dataStartPos"]
  const size = arrayFiles[startIndex]["dataSize"]
  const headerSizePos = arrayFiles[startIndex]["headerStartPos"] + 4
  const encoded = new TextEncoder("windows-1252", { NONSTANDARD_allowLegacyEncoding: true }).encode(newFile)

  // append buffers to make the new big archive
  const newData = Utils.appendBuffer(Utils.appendBuffer(BIGbufferData.slice(0, pos), encoded), BIGbufferData.slice(pos + size))

  // overwrite whole archive size in header
  const dataView = new DataView(newData)
  dataView.setUint32(sizePosInBigHeader, newData.byteLength, true)

  const newFileSize = newFile.length

  // overwrite file's size in global header
  dataView.setUint32(headerSizePos, newFileSize)
  arrayFiles[startIndex]["dataSize"] = newFileSize

  // update start postion of all files after the one modified (because of the size change)
  for (let i = startIndex + 1; i < arrayFiles.length; i++) {
    const headerPos = arrayFiles[i]["headerStartPos"]
    const newStartPos = arrayFiles[i - 1]["dataStartPos"] + arrayFiles[i - 1]["dataSize"]

    dataView.setUint32(headerPos, newStartPos)
    arrayFiles[i]["dataStartPos"] = newStartPos
  }

  return newData
}

export async function readFile(path) {
  let response = await fetch(path)
  // read response stream as text
  let text_data = await response.text()
  return text_data
}
