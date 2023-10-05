// deno-lint-ignore-file
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/data/idbWorker.ts
var DB_NAME = "workDB";
var STORE_NAME = "ObjectStore";
function post(callID, error, result) {
  if (error) {
    console.error("Worker caught an error:", error);
    self.postMessage({ msgID: callID, error: { message: error.message }, result: null });
  } else if (result === void 0) {
    console.info("Not Found!");
    self.postMessage({ msgID: callID, error: null, result: "NOT FOUND" });
  } else {
    self.postMessage({ msgID: callID, error: null, result });
  }
}
__name(post, "post");
onmessage = /* @__PURE__ */ __name(function(evt) {
  const data = evt.data;
  const { callID, payload } = data;
  const { procedure, key, value } = payload;
  switch (procedure) {
    case "SET":
      set(key, value).then(() => {
        post(callID, null, "saved - " + key);
      }).catch((e) => {
        post(callID, "error saving - " + key, null);
      });
      break;
    case "GET":
      get(key).then((val) => {
        post(callID, null, val);
      }).catch((e) => {
        post(callID, "error getting - " + key, null);
      });
      break;
    default:
      const errMsg = `Oppps: dbWorker got an unknown proceedure call - "procedure"`;
      post(callID, errMsg, null);
      console.error(errMsg);
      break;
  }
}, "onmessage");
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    request.onabort = request.onerror = () => reject(request.error);
  });
}
__name(promisifyRequest, "promisifyRequest");
var objectStore = null;
async function createStore(dbName, storeName) {
  const request = indexedDB.open(dbName);
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  const db = await promisifyRequest(request);
  return async (txMode, callback) => {
    return callback(db.transaction(storeName, txMode).objectStore(storeName));
  };
}
__name(createStore, "createStore");
async function getStore() {
  if (!objectStore)
    objectStore = await createStore(DB_NAME, STORE_NAME);
  return objectStore;
}
__name(getStore, "getStore");
async function set(key, value) {
  return (await getStore())("readwrite", (store) => promisifyRequest(store.put(value, key)));
}
__name(set, "set");
async function get(key) {
  return (await getStore())("readonly", (store) => promisifyRequest(store.get(key)));
}
__name(get, "get");
