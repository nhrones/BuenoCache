# BuenoCache

This BuenoCache example persists a collection of _user-objects_ in an IndexedDB    

It prefers to run from **_Hot-Serve_** https://github.com/nhrones/Hot    
But, it will also run from any other dev server.    

This app is bundled with esBuild (automatically in HotServe)!

## To run this demo:
  * Install a local copy
  * Open it in vscode
  * With HotServe installed:    
     in the vscode menu, select: _Terminal -> Run Task -> Run HotServe_. 

## About this Proof Of Concept demo

 - All data is persisted/hydrated as a single key/val row in IndexedDB.    
 - The IndexedDB is managed by a worker thread. See: _./dist/idbWorker.js_    
 - Data hydrates to an es6-Map using JSON.parse()    
 - The Map data is persisted using JSON.stringyfy()    
 - Any mutation to data triggers a flush of the full set to IDB.    
 - You'll notice a very resposive UI, as all data ops are on workers.    
 - I've tested with 5,000,000 records with no UI issues.    

This example app demonstrates full **CRUD** of 100,000 user objects:
```js
/** a `User` object ...*/
User = {
    key: number,    // index
    first: string,  // ~ 6 char 
    last: string,   // ~ 6 char 
    age: number     // 10 - 70
} 

/**
 * Hydrate from IDB-worker 
 * one hundred thousand `stringyfied` User objects
 * @ param hundredK =~ 6 million chars - 7.6 MB
 */
worker.onmessage(hundredK) =>
   buenoCache = new Map([...JSON.parse(hundredK)])

// Persist to IDB-worker
worker postMessage(id, value = JSON.stringify([...buenoCache.entries()]))
```
## Observed performance
You can appreciate the performance of this persisted cache, by deleting the IndexedDB     
dataset while the app is running.    
On the next mutation operation of the cache, the app will reconstruct it's IndexedDB row.   
This is imperceptible to the UX, as this is mostly of-thread.   
    
If you then again delete the IndexedDB row, and then _refresh the page_, you'll see a     
_creation_ message on restart. It will take < 250ms to create and persist    
a _new_ set of (100,000 user objects, ~ 7.6 MB in IDB).    
  
### With the app running:     
   Open dev-tools        
   Open the Application tab    
   Select the storage/indexedDB -> workDB -> ObjectStore    
   You'll see one or more keys _Users-xxxx_ (xxxx = number of  user objects)    
   You may then right-click on a _key_ and select delete to remove it.    
   This will not impact the running app.  Any Create, Update, or Delete op,    
   will force a flush of the in-mem db to the IDB record.    
   A flush takes < 100ms for 100k user objects, most of this time in the worker.   
   
   Note: the apps table cells are editable.     
   Any _cell-blur_, forces a DB flush. Note: the _id_ cell is not editable.      
   When you select a row/cell, an **X** button will show at the botton on the table.    
   Click this to delete a row.   
 
   See the red arrow below.    
        
   ![BuenoCache](./buenoCache.png)
   
   ## About the UI
   The table headers allow _ordering_ and _filtering_ on each column.    
   Please note the performance of the es6-Map-based cache.     
   Ordering and filtering are always applied to the full 100,000 user records.
   Because all cache _mutations_ are immediately flushed to IDB, buenoCache remains consistant.     
   Have fun! I learned quite a bit building this.   
   
   ## Final Note:
   The thing that impressed me the most, is how _incredibly fast_ V8-JSON is!    
   I was also impressed with how well _es6-Maps_ work as a database cache.    
   I've tried many different data transfer methods between the ui-thread and the worker.     
   I was surprised that transfering / persisting a single json string is extremely efficient.