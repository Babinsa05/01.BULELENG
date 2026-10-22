const ROOT_FOLDER_ID = "ISI_ID_FOLDER_DRIVE_BARU_DI_SINI";
const COUNTER_FILE_NAME = "counter.json";

function doPost(event) {
  try {
    const params = event && event.parameter ? event.parameter : {};
    if (params.action === "getCounter") {
      return getAccountCounter(params);
    }
    if (params.action !== "uploadDrive") {
      return jsonResponse({ success: false, error: "Action tidak tersedia" });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      return uploadReport(params);
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error && error.message ? error.message : "Upload gagal"
    });
  }
}

function uploadReport(params) {
  const accountId = requireValue(params.accountId, "accountId");
  const counterDateKey = /^\d{4}-\d{2}-\d{2}$/.test(params.counterDateKey || "")
    ? params.counterDateKey
    : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const accountFolder = getOrCreateFolderPath(rootFolder, [sanitizeFolderName(accountId)]);
  const fileName = requireValue(params.fileName, "fileName");
  const fileData = requireValue(params.fileData, "fileData");
  const folderPath = buildFolderPath(params).slice(1);
  const targetFolder = getOrCreateFolderPath(accountFolder, folderPath);
  const counter = readOrInitializeCounter(accountFolder);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(fileData),
    params.mimeType || "application/zip",
    fileName
  );
  const file = targetFolder.createFile(blob);
  counter.total++;
  counter.dailyCounts[counterDateKey] = (counter.dailyCounts[counterDateKey] || 0) + 1;
  saveCounter(accountFolder, counter);

  return jsonResponse({
    success: true,
    fileId: file.getId(),
    fileName: file.getName(),
    folderPath: [accountId].concat(folderPath).join("/"),
    counter: counter
  });
}

function getAccountCounter(params) {
  const accountId = requireValue(params.accountId, "accountId");
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const accountFolder = getOrCreateFolderPath(rootFolder, [sanitizeFolderName(accountId)]);
    const counter = readOrInitializeCounter(accountFolder);
    return jsonResponse({ success: true, counter: counter });
  } finally {
    lock.releaseLock();
  }
}

function readOrInitializeCounter(accountFolder) {
  const counterFiles = accountFolder.getFilesByName(COUNTER_FILE_NAME);
  if (counterFiles.hasNext()) {
    const counter = JSON.parse(counterFiles.next().getBlob().getDataAsString());
    if (!counter || !Number.isInteger(counter.total) || counter.total < 0 ||
        !counter.dailyCounts || typeof counter.dailyCounts !== "object") {
      throw new Error("File counter.json di Google Drive tidak valid");
    }
    return counter;
  }

  const counter = { total: 0, dailyCounts: {} };
  countZipFiles(accountFolder, counter);
  saveCounter(accountFolder, counter);
  return counter;
}

function countZipFiles(folder, counter) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() !== "application/zip") continue;
    const dateKey = Utilities.formatDate(
      file.getDateCreated(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
    counter.total++;
    counter.dailyCounts[dateKey] = (counter.dailyCounts[dateKey] || 0) + 1;
  }

  const folders = folder.getFolders();
  while (folders.hasNext()) {
    countZipFiles(folders.next(), counter);
  }
}

function saveCounter(accountFolder, counter) {
  const content = JSON.stringify(counter);
  const counterFiles = accountFolder.getFilesByName(COUNTER_FILE_NAME);
  if (counterFiles.hasNext()) {
    counterFiles.next().setContent(content);
  } else {
    accountFolder.createFile(COUNTER_FILE_NAME, content, MimeType.PLAIN_TEXT);
  }
}

function buildFolderPath(params) {
  const accountId = requireValue(params.accountId, "accountId");
  const regionType = params.regionType === "Kelurahan" ? "Kelurahan" : "Desa";
  const wilayah = requireValue(params.folderName || params.desaName, "folderName")
    .replace(new RegExp("^" + regionType + "\\s+", "i"), "")
    .trim();
  const year = requireValue(params.year, "year");
  const month = requireValue(params.month, "month");

  return [accountId, year, month, regionType, wilayah].map(sanitizeFolderName);
}

function getOrCreateFolderPath(rootFolder, folderPath) {
  return folderPath.reduce(function(parent, folderName) {
    const folders = parent.getFoldersByName(folderName);
    return folders.hasNext() ? folders.next() : parent.createFolder(folderName);
  }, rootFolder);
}

function sanitizeFolderName(value) {
  const sanitized = String(value)
    .replace(/[\\/:*?"<>|#%{}~&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!sanitized) throw new Error("Nama folder tidak valid");
  return sanitized;
}

function requireValue(value, fieldName) {
  if (!value || !String(value).trim()) {
    throw new Error("Field wajib tidak ada: " + fieldName);
  }
  return String(value).trim();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
