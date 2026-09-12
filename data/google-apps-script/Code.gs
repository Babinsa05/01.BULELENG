const ROOT_FOLDER_ID = "ISI_ID_FOLDER_DRIVE_BARU_DI_SINI";

function doPost(event) {
  try {
    const params = event && event.parameter ? event.parameter : {};
    if (params.action !== "uploadDrive") {
      return jsonResponse({ success: false, error: "Action tidak tersedia" });
    }

    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const fileName = requireValue(params.fileName, "fileName");
    const fileData = requireValue(params.fileData, "fileData");
    const folderPath = buildFolderPath(params);
    const targetFolder = getOrCreateFolderPath(rootFolder, folderPath);
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      params.mimeType || "application/zip",
      fileName
    );
    const file = targetFolder.createFile(blob);

    return jsonResponse({
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      folderPath: folderPath.join("/")
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error && error.message ? error.message : "Upload gagal"
    });
  }
}

function buildFolderPath(params) {
  const regionType = params.regionType === "Kelurahan" ? "Kelurahan" : "Desa";
  const wilayah = requireValue(params.folderName || params.desaName, "folderName")
    .replace(new RegExp("^" + regionType + "\\s+", "i"), "")
    .trim();
  const year = requireValue(params.year, "year");
  const month = requireValue(params.month, "month");

  return [year, month, regionType, wilayah].map(sanitizeFolderName);
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
