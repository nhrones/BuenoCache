import { $, buenoCache } from '../main.ts'

export let focusedRow: HTMLElement
export let focusedCell: HTMLElement
export let selectedRowID = 0

export const resetFocusedRow = () => {
    const dbtn = $('deletebtn')
    dbtn?.setAttribute('hidden', '')
    //@ts-ignore ?
    focusedRow = null
}

/** build table row event handlers for editing */
export function makeEditableRow() {
    const rows = document.querySelectorAll('tr')
    for (const row of Array.from(rows)) {
        if (row.className.startsWith('headerRow')) {
            // skip the table-header row
            continue
        }

        row.onclick = (e) => {

            const target = e.target as HTMLTableCellElement
            if (focusedRow && focusedCell && (e.target != focusedCell)) {
                focusedCell.removeAttribute('contenteditable')
                focusedCell.className = ""
                focusedCell.oninput = null
            }

            focusedRow?.classList.remove("selected_row")
            focusedRow = row
            selectedRowID = parseInt(focusedRow.dataset.row_id+'')
            focusedRow.classList.add("selected_row")
            const dbtn = $('deletebtn') as HTMLElement
            dbtn.removeAttribute('hidden')

            // we don't allow editing readonly cells
            if (target.attributes.getNamedItem('read-only')) {
                return // skip all read-only columns
            }

            focusedCell = e.target as HTMLElement
            focusedCell.setAttribute('contenteditable', '')
            focusedCell.className = "editable "
 
            focusedCell.onblur = () => {
                const id = parseInt(focusedRow.dataset.row_id+'')
                const col = focusedCell.dataset.column_id || 0
                const rowObj = buenoCache.get(id)
                const currentValue = rowObj[col]
                const newValue = focusedCell.textContent
                if (currentValue != newValue) {
                    rowObj[col] = newValue
                    buenoCache.set(id, rowObj)
                }
            }
            focusedCell.focus()
        }
    }
}

