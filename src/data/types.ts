// deno-lint-ignore-file
export type callback = (error: any, result: any) => void

/** An object-store descriptor using a sample object as a prototype */
export type schema = {
    /** The name used to persist data to IndexedDB */
    name: string,
    /** A sample object used to build the schema for our object store and UI.     
     *  Any numeric property set to -1, or string property set to 'READONLY',     
     *  will be readonly in the UI. 
     */ 
    sample: ObjectLiteral
}

export type dbOptions = {
    schema: schema,
    size: number,
}

export type column = {
    name: string,
    type: string,
    readOnly: boolean,
    order: string,
}

export interface ObjectLiteral {
    [key: string]: any;
}

export type DbRpcPackage = {
   procedure: 'GET' | 'SET', 
   key: string, 
   value?: string 
}