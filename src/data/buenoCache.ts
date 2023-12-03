// deno-lint-ignore-file
import { buildTestDataSet } from './objBuilder.ts'
import { paginateData } from './paginate.ts'
import { buildDataTable } from '../view/domDataTable.ts'

import type {
   DbRpcPackage,
   dbOptions,
   callback,
   column,
   ObjectLiteral,
   schema
} from './types.ts'

const LOG = true


//==========================================================
//                     Bueno-Cache
//           A persisted in-memory data cache
//      Hydrated from a worker-hosted async-IndexedDB
//    All mutations are asynchronously persisted to IDB
//==========================================================

/**
 * This `In-Memory-cache` leverages ES6-Maps.    
 * It uses a promisified `worker-IDB` for persistance.    
 * 
 * The persistance service leverages IndexedDB in a worker. 
 * We wrap the workers messaging in order to support promises.    
 * 
 * Performance is achieved by persisting and hydrating    
 * the cache (es6-Map-entries) as a single JSON string     
 * in the IndexedDB.    
 *  
 * Persisting 100,000 objects(10.7 MB) takes ~ 90 ms.    
 * Note that most of this time is `off-thread` (worker). 
 * 
 * Hydration of 100,000 objects(10.7 MB) takes ~ 300 ms.    
 * Hydration happens only once on start-up and is also     
 * mostly(DB-Fetch) `off-thread` (worker).    
 * This includes: DB-Fetch, JSON.parse, and Map-loading.
 */
export class BuenoCache {

   IDB_KEY = ''
   schema: schema
   nextMsgID = 0
   querySet: ObjectLiteral[] = []
   callbacks: Map<number, callback>

   /** the web-worker that this instance communicates with */
   idbWorker
   size = 0
   columns: column[]
   dbMap: Map<number, unknown> = new Map()
   raw: ObjectLiteral[] = []
   currentPage = 1
   rows = 10
   window = 10

   //  BuenoCache ctor
   constructor(opts: dbOptions) {
      this.IDB_KEY = `${opts.schema.name}-${opts.size}`
      this.schema = opts.schema
      this.idbWorker = new Worker('./workers/idbWorker.js')
      this.callbacks = new Map()
      this.columns = this.buildColumnSchema(this.schema.sample)
      this.size = opts.size

      // When we get a message from the worker we expect 
      // an object containing {msgID, error, and result}.
      // We find the callback that was registered for this msgID, 
      // and call it with the error and result properities.
      // This will resolve or reject the promise that was
      // returned to the client when the callback was created.
      this.idbWorker.onmessage = (evt: MessageEvent) => {
         const { msgID, error, result } = evt.data    // unpack
         if (!this.callbacks.has(msgID)) return      // check
         const callback = this.callbacks.get(msgID)  // fetch
         this.callbacks.delete(msgID)                // clean up
         if (callback) callback(error, result)       // execute
      }

      // initial data fetch and hydrate
      this.hydrate().then((result) => {
         // no data found in IDB
         if (result === null) {
            const h1 = document.getElementById('h1')
            if (h1) {
               h1.textContent = `Creating test dataset with - ${opts.size} users! Please Wait!`
               h1.className = 'h1'
            }
            // build a new dataset for this size
            buildTestDataSet(opts.size).then((val: any) => {
               this.persist(val)
               this.hydrate()
            })
         }
      })
   }  // ctor end

   /**
    * extract a set of column-schema from the DB.schema object 
    */
   buildColumnSchema(obj: ObjectLiteral) {
      let columns: column[] = []
      for (const [key, value] of Object.entries(obj)) {
         let read_only = false;
         if ((typeof value === 'number' && value === -1) ||
            (typeof value === 'string' && value === 'READONLY')) {
            read_only = true
         }
         columns.push({
            name: `${key}`,
            type: `${typeof value}`,
            readOnly: read_only,
            order: 'UNORDERED'
         })
      }
      return columns
   }

   /** 
    * Persist the current dbMap to an IndexedDB using         
    * our webworker. (takes ~ 90 ms for 100k records)    
    * This is called for any mutation of the dbMap (set/delete)     
    */
   async persist(map: Map<number, any>): Promise<any> {
      console.log(`typeof map: ${typeof map}`)
      let valueString = JSON.stringify(Array.from(map.entries()))
      let persistStart = performance.now()
      // transfering a single large string to/from a worker is very performant!
      await this.postMessage({ procedure: 'SET', key: this.IDB_KEY, value: valueString })
      let persistTime = (performance.now() - persistStart).toFixed(2)
      if (LOG) console.log(`Persisting ${map.size} records took ${persistTime} ms `)
   }

   /**
    * build Missing Data -> buildTestDataSet -> persist -> RPC-GET
    */
   async buildMissingData() {
      buildTestDataSet(this.size).
         then(async (val: any) => {
            console.log(`MissingData value type: ${typeof val}`)
            //this.persist(val)
            //return await this.postMessage({ procedure: 'GET', key: this.IDB_KEY })
         })
   }

   /**
    * hydrate a dataset from a single raw record stored in IndexedDB    
    * hydrating 100,000 objects takes ~ 295ms :      
    *     DB-Fetch: 133.00ms    
    *     JSON.Parse: 145.30ms    
    *     Build-Map: 16.80ms        
    */
   async hydrate() {
      let fetchStart = performance.now()
      let result = await this.postMessage({ procedure: 'GET', key: this.IDB_KEY })
      if (result === 'NOT FOUND') {
         return null
      } else {
         let fetchTime = (performance.now() - fetchStart).toFixed(2)
         let records
         let parseStart = performance.now()
         if (typeof result === 'string') records = JSON.parse(result)
         let parseTime = (performance.now() - parseStart).toFixed(2)
         let mapStart = performance.now()
         this.dbMap = new Map(records)
         let mapTime = (performance.now() - mapStart).toFixed(2)
         let totalTime = (performance.now() - fetchStart).toFixed(2)
         if (LOG) console.log(`Hydrating ${this.dbMap.size} records
         DB-Fetch: ${fetchTime}ms 
         JSON.Parse: ${parseTime}ms 
         Build-CacheMap: ${mapTime}ms 
    Total: ${totalTime}ms`)

         this.raw = [...this.dbMap.values()] as ObjectLiteral[]
         this.querySet = [...this.raw]
         paginateData()
         buildDataTable()
         return "ok"
      }
   }

   /** resest the working querySet to original DB values */
   resetData() {
      this.querySet = [...this.raw]
   }

   /** find an object from a string key */
   findString(
      map: Map<string, number[]>,
      value: string,
      partial = false
   ): string | number[] {
      for (const key of map.keys()) {
         if (typeof key === 'string')
            if (partial) {
               //@ts-ignore ?
               if (key.startsWith(value)) return map.get(key)
            } else {
               //@ts-ignore ?
               if (key === value) return map.get(key)
            }
      };
      return `${value} not found!`
   }

   /** find an object from a number key */
   findNumber(map: Map<number, number[]>, value: number): string | number[] {
      for (const key of map.keys()) {
         //@ts-ignore ?
         if (key === value) return map.get(key)
      };
      return `${value} not found!`
   }

   /** The `set` method mutates - will call the `persist` method. */
   set(key: number, value: unknown): string {
      console.log(`set key ${key} val ${JSON.stringify(value)}`)
      try {
         this.dbMap.set(key, value)
         this.persist(this.dbMap)
         this.hydrate()
         console.log('Did set!', key)
         return key.toString()
      } catch (e) {
         console.error('error putting ')
         return 'Error ' + e
      }
   }

   /** The `get` method will not mutate records */
   get(key: number): any {
      try {
         let result = this.dbMap.get(key)
         return result
      } catch (e) {
         return 'Error ' + e
      }
   }

   /** 
    * The `delete` method mutates - will call the `persist` method. 
    */
   delete(key: number): any {
      try {
         let result = this.dbMap.delete(key)
         if (result === true) this.persist(this.dbMap)
         this.hydrate()
         return result
      } catch (e) {
         return 'Error ' + e
      }
   }

   /** 
    * Post a message to our IDB webworker     
    * 
    * We give each message a unique id.    
    * We then create/save a promise callback for the id.    
    * Finally, we return a promise for this callback.   
    * Our dbWorker will signal when the rpc has been fulfilled.   
    * At that time we lookup our callback, and fulfill the promise.    
    * This is how we implement async transactions with    
    * our IndexedDB. Since most of the heavy lifting is    
    * on the worker, we never block the UI 
    */
   postMessage(newMessage: DbRpcPackage): Promise<any> {
      const newID = this.nextMsgID++
      return new Promise((resolve, reject) => {
         // store the promise callback for this id
         this.callbacks.set(newID, (error: any, result: any) => {
            if (error) reject(new Error(error.message))
            resolve(result)
         })
         this.idbWorker.postMessage({ callID: newID, payload: newMessage })
      })
   }
}
