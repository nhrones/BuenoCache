
import { makeEditableRow,  resetFocusedRow  } from './editableTR.ts'
import { buildPageButtons, } from './domPageButtons.ts'
import { $, buenoCache } from '../main.ts'
import { paginateData } from '../data/paginate.ts'
import { ObjectLiteral } from '../data/types.ts';
  

let tableBody: HTMLTableSectionElement

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/** 
 * Build the Table header
 */
export const buildTableHead = () => {
    const tablehead = $('table-head') as HTMLTableSectionElement
    const tr = `
<tr class="headerRow">
`;
    let th = ''
    for (let i = 0; i < buenoCache.columns.length; i++) {
   th += `    <th id="header${i + 1}" 
   data-index=${i} value=1> ${capitalizeFirstLetter(buenoCache.columns[i].name)} 
   <span class="indicator">🔃</span>
   <input id="input${i + 1}" type="text">
</th>
`;
    }
    tablehead.innerHTML += (tr + th)
    tablehead.innerHTML += `</tr>`
}

/** build HTML table */
export const buildDataTable = () => {
    if (!tableBody) tableBody = $('table-body') as HTMLTableSectionElement
    const { querySet, totalPages } = paginateData()
    tableBody.innerHTML = '';
    ($('h1') as HTMLElement).className = 'hidden'
    
    for (let i = 0; i < querySet!.length; i++) {
        const obj: ObjectLiteral = querySet![i]
        
        let row = `<tr data-row_id="${obj[buenoCache.columns[0].name]} ">
        `
        for (let i = 0; i < buenoCache.columns.length; i++) {
            const ro = (buenoCache.columns[i].readOnly) ? ' read-only' : ''
            row += `<td data-column_id="${buenoCache.columns[i].name}"${ro}>${obj[buenoCache.columns[i].name]}</td>
            `
        }
        row += '</tr>'
        tableBody.innerHTML += row
    }
    resetFocusedRow()
    buildPageButtons(totalPages)
    makeEditableRow()

}
