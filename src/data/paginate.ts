
import { buenoCache } from '../main.ts'

/** paginate the querySet data */
export function paginateData() {
    if (buenoCache.querySet) {
        const { currentPage, rows } = buenoCache
        
        // get the starting record number
        const startAt = (currentPage - 1) * rows // default = 10
        
        // get the end record number
        const endAt = startAt + rows

        // grab the data
        const slicedDataSet = buenoCache.querySet.slice(startAt, endAt)
        
        // calculate number of pages required (round up)
        const pages = Math.ceil(buenoCache.querySet.length / rows);
       
        // returns the trimmed queySet and number of pages this set requires 
        return { 'querySet': slicedDataSet, 'totalPages': pages }
        
    } else {
        return { 'querySet': null, 'totalPages': 0 }
    }
}
