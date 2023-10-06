// deno-lint-ignore-file

import { buildDataTable } from '../view/domDataTable.ts'
import {buenoCache } from '../main.ts'
import { applyOrder} from './order.ts'
import { paginateData } from './paginate.ts'


/** filter our dataSet */
export const filterData = (columnName: string, value: string) => {
    buenoCache.resetData()
    if (value.length === 0) {
        applyOrder()
        paginateData()
        buildDataTable()
        return
    } else {
        let filteredData: any[] = []
        buenoCache.querySet.forEach((row: any) => {
            let it = row[columnName]
            if (typeof it === 'number') {
                if (it.toFixed(0).startsWith(value.toString())) {
                    filteredData.push(row)
                }
            } else {
                if (it.toLowerCase().startsWith(value.toLowerCase())) {
                    filteredData.push(row)
                }
            }
        })
        buenoCache.querySet = filteredData
        paginateData()
        buildDataTable() 
    }


}
