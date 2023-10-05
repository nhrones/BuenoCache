
import { buildDataTable} from './domDataTable.ts'
import { focusedRow} from './editableTR.ts'
import { $, buenoCache } from '../main.ts'

//import { paginateData } from '../data/mod.ts'
import {paginateData } from '../data/paginate.ts'
let wrapper: HTMLDivElement

export let deleteBtn: HTMLButtonElement
export let addBtn: HTMLButtonElement

/** build page buttons */
export function buildPageButtons(pages: number) {
    if (!wrapper) wrapper = $('page-wrapper') as HTMLDivElement
    const { currentPage, window } = buenoCache
    wrapper.innerHTML = `` // start fresh
    let maxLeft = (currentPage - Math.floor(window / 2))
    let maxRight = (currentPage + Math.floor(window / 2))

    if (maxLeft < 1) {
        maxLeft = 1
        maxRight = window
    }

    if (maxRight > pages) {
        maxLeft = pages - (window - 1)
        if (maxLeft < 1) maxLeft = 1;
        maxRight = pages
    }

    // build numbered page buttons
    for (let page = maxLeft; page <= maxRight; page++) {
        // highlight the current-page button    
        const classString = (currentPage === page) ? `"pagebtn currentpagebtn"` : "pagebtn"
        wrapper.innerHTML += `<button 
            value=${page} 
            class=${classString}>${page}
        </button>`
    }

    // build first page button
    if (currentPage != 1) {
        wrapper.innerHTML = `<button 
        value=${1}
        class="pagebtn endbtn">« First</button>` + wrapper.innerHTML
    }

    // build last page button
    if (currentPage != pages) {
        wrapper.innerHTML += `<button 
            value=${pages}
            class="pagebtn endbtn">Last »</button>`
    }

    wrapper.innerHTML += `<div> <button id='addbtn' class='rowbtn'>Add Row</button>
    <button id='deletebtn' class='rowbtn' hidden> X </button></div>`

    addBtn = $('addbtn') as HTMLButtonElement
    addBtn.onclick = (_e) => {
        console.log('addBtn clicked!')
        const newRow = Object.assign({}, buenoCache.schema.sample)
        if (newRow.id) {
            newRow.id = buenoCache.dbMap.size
        }
        console.info(newRow)
        console.log('before add thisDB.size ', buenoCache.dbMap.size)
        buenoCache.set(newRow.id, newRow)
        console.info('after add thisDB.size ', buenoCache.dbMap.size)
        //TODO add a new record to the map (schema.sample)
    }

    deleteBtn = $('deletebtn') as HTMLButtonElement
    deleteBtn.onclick = (_e) => {
        // delete the map row, then persist the map
        const id = focusedRow.dataset.row_id
        buenoCache.delete(parseInt(id+''))
        paginateData()
        buildDataTable()
    }


    // add a click handler to each new button
    const pageCollection = document.querySelectorAll('.pagebtn') as NodeListOf<HTMLButtonElement>
    for (let i = 0; i < pageCollection.length; i++) {
        pageCollection[i].addEventListener('click', function () {
            buenoCache.currentPage = Number(pageCollection[i].value)
            paginateData()
            buildDataTable()
        });
    }

}