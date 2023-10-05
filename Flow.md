# IDB Flow 
## main.ts
  - export const thisDB = new DB(options) 

## buenoCache.ts
ctor -> {
  - instantiate idbWorker 
  - build ColumnsSchema
  - setup dbWorker message handler
  - async call->hydrate
    - .then -> if (result === null) -> buildTestDataSet -> persist-it -> hydrate
}

async hydrate() {
  - // RPC-GET records
  - result = await this.postMessage({ action: 'GET', key: this.IDB_KEY }) 
  - IF (result === "NOT FOUND") return null (see line-11) 
  - else {   
  -    let records = JSON.parse(result)
  -    this.dbMap = new Map(records)
  -    this.raw = [...this.dbMap.values()] as ObjectLiteral[]
  -    this.querySet = [...this.raw]
  -    paginateData()
  -    buildDataTable()
  -    return'ok'
  - }
}