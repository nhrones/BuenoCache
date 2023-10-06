// deno-lint-ignore-file

import type { callback } from './types.ts'

const worker = new Worker('./workers/builderWorker.js', { type: "module" })
const callbacks: Map<number, callback> = new Map()
let nextMsgID = 0

// When we get a message from the worker we expect 
// an object containing {msgID, error, and result}.
// We find the callback that was registered for this msgID, 
// and call it with the error and result properities.
// This will resolve or reject the promise that was
// returned to the client when the callback was created.
worker.onmessage = (e: MessageEvent) => {
    const { msgID, error, result } = e.data     // unpack
    if (!callbacks.has(msgID)) return           // check
    const callback = callbacks.get(msgID)       // fetch
    callbacks.delete(msgID)                     // clean up
    if (callback) callback(error, result)       // execute
}

/** 
 * Post a message to our IDB webworker     
 * 
 * We give each message a unique id.    
 * We then create/save a callback with this id.    
 * Finally, we return a promise for this callback.
 *     
 * This is how we implement async transactions with    
 * our IndexedDB. Since most of the heavy lifting is    
 * on the worker, we never block the UI 
 */
const postMessage = (msg: unknown): Promise<Map<number, any>> => {
    const newID = nextMsgID++
    return new Promise((resolve, reject) => {
        callbacks.set(newID, (error: any, result: any) => {
            if (error) return reject(new Error(error.message))
            resolve(new Map(JSON.parse(result)))
        })
        worker.postMessage({ id: newID, payload: msg })
    })
}

/** Build a test dataset */
export const buildTestDataSet = ( size: number) => {
    return postMessage({ action: 'BUILD', value: size })
}
