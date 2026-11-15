const databaseName = "voxora-workflow";
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("selected-media");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function storeSelectedFile(file) {
  if (!file) return removeSelectedFile();
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("selected-media", "readwrite")
      .objectStore("selected-media")
      .put(file, "file");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
export async function restoreSelectedFile() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("selected-media", "readonly")
      .objectStore("selected-media")
      .get("file");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}
export async function removeSelectedFile() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("selected-media", "readwrite")
      .objectStore("selected-media")
      .delete("file");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
