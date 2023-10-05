/// <reference lib="dom" />
/// <reference lib="deno.unstable" />
         
import { dbOptions, schema } from './data/types.ts'
import { initDOMelements } from './view/domEventHandlers.ts'
import { BuenoCache } from './data/buenoCache.ts'  
 
export const $ = (id: string) => document.getElementById(id)
  
/** 
 * A DB options object 
 * @member {schema} schema - used to describe the dataset.
 * @member {number} size - the size of our test dataset.   
 *    If a data set of that size is not currently   
 *    found in IndexedDB, one will be created.
*/ 
const options: dbOptions  = { 
    schema: {name:'Users', sample:{ id: -1, first: ' ', last: ' ', age: 9 }} as schema,
    size: 100000, // use this to set the size of our test dataset
}  
 
/** 
 * If a dataset of this size already exists in IDB, open it.   
 * Else, create a new dataset of this size and persist it to IDB.   
 * @param {dbOptions} options - the schema and size of the test dataset.
 * @returns -
 * */
export const buenoCache = new BuenoCache(options) 

/**
 * Initialize the DataTable UI
 * This will setup for async dataload and paginate in DB-ctor
 */ 
initDOMelements()
