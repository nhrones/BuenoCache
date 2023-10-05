// deno-lint-ignore-file

import { buenoCache } from '../main.ts'

export const OrderDirection = {
    ASC: 'ASC',
    DESC: 'DESC',
    UNORDERED: 'UNORDERED',
}

/** Reorder(sort) our dataset  */
export const sortData = ( column: string, direction: string) => {
    //console.log(`colName ${column}  dir ${direction}`)
    switch (direction) {
        case OrderDirection.ASC:
            buenoCache.querySet.sort((a: any, b: any) => a[column] > b[column] ? 1 : -1)
            break;
        case OrderDirection.DESC:
            buenoCache.querySet.sort((a: any, b: any) => a[column] < b[column] ? 1 : -1)
            break;
        case OrderDirection.UNORDERED: // remove any sorting
        buenoCache.resetData() 
            break;
        default:
            break;
    }
}

// apply any existing sort order 
export const applyOrder = () => {
    const indicators = document.querySelectorAll('.indicator')
    for(const ind of Array.from(indicators)) {
        const index = parseInt(ind?.parentElement?.dataset.index+'')
        const dir = buenoCache.columns[index].order
        if (dir != 'UNORDERED'){
            sortData(buenoCache.columns[index].name, dir)
        }
    }
}