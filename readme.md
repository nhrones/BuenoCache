# BuenoKv

This BuenoKv example persists a collection of `user-objects` in an indexedDB    

It prefers to run from `Hot-Serve` https://github.com/nhrones/Hot    
But, it will also run from any other dev server.    

This app is bundled with esBuild (automatically in HotServe)!

## To run LocalDB:
  * Install a local copy
  * Open it in vscode
  * With HotServe installed:    
     in the vscode menu, select: `Terminal -> Run Task -> Run HotServe`. 

## This POC Demo

All data is persisted/hydrated as a single key/val row in IndexedDB.    
The IndexedDB is managed by a worker `./dist/idbWorker.js`    
Data hydrates to an es6-Map using JSON.parse()    
The Map data is persisted using JSON.stringyfy()    
Any mutation to data triggers a flush of the full set to IDB.    
You'll notice a very resposive UI, as all data ops are on workers.    
I've tested with 5,000,000 records with no UI issues.    

This example app demonstrates full `CRUD` of 100,000 user objects:
```js
/** a `User` object ...*/
User = {
    key: number,    // index
    first: string,  // ~ 6 char 
    last: string,   // ~ 6 char 
    age: number     // 10 - 70
} 

/** one hundred thousand `stringyfied` User objects */
const hundredK = `...`// ~ 6 million chars - 7.6 MB

// Hydrate from IDB-worker
worker.onmessage(hundredK) =>
const dataMap = new Map([...JSON.parse(hundredK)])

// Persist to IDB-worker
worker postMessage(id, value = JSON.stringify([...dataMap.entries()]))
```
## Observed performance
You can appreciate the performance of this db, by deleting the IDB dataset     
while the app is running. On the next CRUD op of the in-memory-db, the app     
will reconstruct the IDB row.  This is imperceptible to the UX.
    
If you then again delete the IDB row, and then `refresh the page`, you'll see a     
`creation` message on restart. It will take < 1 second to create and persist    
a new set of (100,000 user objects, ~ 7.6 MB in IDB).    
  
`Note:` Config data-set size in `dbOptions.size` top of `/src/main.ts`.  

### With the app running:     
   Open dev-tools        
   Open the Application tab    
   Select the storage/indexedDB -> workDB -> ObjectStore    
   You'll see one or more keys `Users-xxx` (xxx = number of  user objects)    
   You may then right-click on a `key` and select delete to remove it.    
   This will not impact the running app.  Any Create, Update, or Delete op,    
   will force a flush of the in-mem db to the IDB record.    
   A flush takes < 100ms for 100k user objects, most of this time in the worker.   
   
   Note: the apps table cells are editable.     
   Any `cell-blur`, forces a DB flush. Note: the `id` cell is not editable.      
   When you select a row/cell, an `X` button will show at the botton on the table.    
   Click this to delete a row.   
   You won't see this in real-time, as you'll need to refresh the IDB view in dev-tools.    
    
   See the red arrow below.    
        
   ![escher](./db.png)
   
   The table headers allow `ordering` and `filtering` on each field.    
   Note the performance of the Map-based in-mem-db.     
   Ordering/Filtering is always against the full 100,000 rows.
       
   Have fun! I learned quite a bit building this.   
   
   ## Final Note:
   The thing that impressed me the most, is how `incredibly fast` JSON is!    
   I was also impressed with how well `js-Map` works as an in-mem database.    
   I tried many different data transfer methods between the app and worker,     
   and was surprised that transfering / persisting a single json string is very efficient.