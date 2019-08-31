import {LoginRequest, TaskInfoRequest, Task, TaskListRequest, TaskElement, TaskId, TaskListElement} from "./Types"
import Cookies from 'universal-cookie';
import * as T from "./Types"
import * as _ from "lodash"
import {getDefaultBundleMetadata, createDefaultBundleName, pathIsArchive, getArchiveExt} from './codalab-worksheets/util/worksheet_utils'
import {delay} from "q"

type ContentType = 'application/json' | 'text/plain;charset=utf-8'

function jsonRequest<T, R>(url: string, ctype : ContentType = 'application/json'): ((info: T) => Promise<R>){
    return(
        info => {
            let req = fetch(url, 
                {
                  headers: {"Content-Type":ctype}
                , credentials: 'same-origin'
                , method: 'POST'
                ,  body: ((ctype == 'application/json')? JSON.stringify(info) : (info as any as string))
                }).then((res) => {
                    if (res.status==401){
                        T.logOut()
                        return Promise.reject(res.statusText)
                    }
                    if (!res.ok){
                        return res.json().then(e => Promise.reject(e));
                    }
                    return res.json()
                })
            return req        
        }
    )
}

export const loginReq: LoginRequest = (username, password) => {
    let req = fetch(T.endPointPath.login, 
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        , method: 'POST'
        ,  body: JSON.stringify({username, password})
        }).then((res) => {
            if (!res.ok){
                return Promise.reject(res);
            }
            return
        })
    return req
}

export const getLoginStatus = () => {
    // console.log('check login')
    let cookie = new Cookies()
    let codalab_session = cookie.get('codalab_session');
    return (codalab_session != undefined);
}


export const taskListReq: TaskListRequest = () => (
    fetch('./tool/list', 
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        })
    .then((e) => e.json())
)

export const taskReq: TaskInfoRequest = (taskid) => (
    fetch('./tool/' + taskid, 
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        })
    .then((e) => e.json())
)

export const toolGraphReq: T.ToolGraphRequest = (taskid) => (
    fetch('./tool/graph/' + taskid, 
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        })
    .then(res => {
        if (!res.ok){
            return res.json().then(e => Promise.reject(e));
        }
        return res.json()
    }))


export const clReq: T.ClRequest = (worksheet, command) => (
    fetch(T.endPointPath.rest + 'cli/command',
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        , method: 'POST'
        , body: JSON.stringify({worksheet_uuid: worksheet, command})
        })
        .then((res) => {
            if (!res.ok){
                return Promise.reject(res);
            }
            return (res.json())
        })
        .then(res => (res.output as string).trim())
)

// simulate waiting by polling the bundle status
export const clWait: T.ClWaitRequest = (path) => {
    let uuid = path.split('/')[0]
    return (fetch(T.endPointPath.rest + 'bundles/' + uuid,
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        })
        .then((res) => {
            if (!res.ok){
                return Promise.reject(res);
            }
            return (res.json())
        })
        .then(res => {
            let status = res.data.attributes.metadata.run_status
            if (status == "Finished"){
                // console.log('finished')
                return path
            } else {
                // wait for 5s
                return (delay(5000).then(x => clWait(path)))
            }
        }))
}


export const compileReq: T.CompileRequest = jsonRequest('./tool/compile')


function parseWorksheetItem(item: any): T.WorksheetItem{
    if (item.mode == "markup_block"){
        return {type: "markup", content: item.text}
    }
    if (item.mode == "table_block"){
        return {type: "bundles", content: item.bundles_spec.bundle_infos}
    }
    if (item.mode == "subworksheets_block"){
        return {type: "subworksheets", content: item.subworksheet_infos}
    }
    return null
}
export const worksheetItemsReq: T.WorksheetItemsRequest = (worksheet) => {
    let req = fetch(T.endPointPath.rest + 'interpret/worksheet/' + worksheet + '?include=items.bundles', 
        {credentials: 'same-origin'})
        .then((res) => {
            if (!res.ok){
                return Promise.reject(res);
            }
            return res.json()
        })
        .then(res => {
            let worksheetItems: T.WorksheetItem[] = []
            for (let item of res.items){
                let parsedItem = parseWorksheetItem(item)
                if(parsedItem){
                    worksheetItems.push(parsedItem)
                }
            }
            return {items: worksheetItems, uuid: res.uuid, name: res.name, title: res.title}
        })
    return req
}

export const worksheetsReq: T.WorksheetsRequest = () => (
    fetch(T.endPointPath.rest + 'worksheets?keywords=.mine', {credentials: 'same-origin'})
    .then(res => {
        if (!res.ok){
            return Promise.reject(res);
        }
        let list = res.json().then(data => _.map(data.data, w => ({uuid: w.id, name: w.attributes.name, title: w.attributes.title})))
        return list
    })
)

export const bundleInfoReq: T.BundleInfoRequest = (uuid: string) => (
    fetch(T.endPointPath.rest + 'bundles/' + uuid,
        {credentials: 'same-origin'})
    .then((res) => {
        if (!res.ok){
            return Promise.reject(res);
        }
        return (res.json())
    })
    .then(res => res.data.attributes)
) 

export const parseReq: T.ParseRquest = jsonRequest('tool/parse', 'text/plain;charset=utf-8')

export const parseArgReq: T.ParseArgRequest = jsonRequest('tool/parse/argument', 'text/plain;charset=utf-8')

export const newToolReq: T.NewToolReq = jsonRequest('tool/create')

export const updateToolReq: T.UpdateToolReq = jsonRequest('tool/update')

export const removeEleReq: T.RemoveElementReq = (eid) => (
    fetch('./tool/' + eid, 
    {
      headers: {"Content-Type":'application/json'}
    , credentials: 'same-origin'
    , method: "DELETE"
    })
    .then((res) => {
        if (!res.ok){
            return Promise.reject(res);
        }
        return res.json()
    })
)

export const uploadFileReq: T.UploadFileReq = (worksheet, file) => {
    const createBundleData = getDefaultBundleMetadata(file.name);
    const create = jsonRequest(T.endPointPath.rest + "bundles?worksheet=" + worksheet)(createBundleData)
    const upload = create.then(
        (data: any) => {
            const bundleUuid = data.data[0].id;
            const reader = new FileReader();
            reader.onload = function(){
                const arrayBuffer = this.result as ArrayBuffer;
                const bytesArray = new Uint8Array(arrayBuffer);
                const url = T.endPointPath.rest + "bundles/" + bundleUuid + '/contents/blob/?' + getQueryParams(file.name)
                fetch(url, {
                      headers: {"Content-Type":'application/octet-stream'}
                    , credentials: 'same-origin'
                    , method: 'PUT'
                    , body: new Blob([bytesArray])
                })
                return fetch
            }
            reader.readAsArrayBuffer(file);
            return data
        }
    )
    return upload
}

function getQueryParams(filename: string) {
    const formattedFilename = createDefaultBundleName(filename);
    const queryParams: {[name: string]: string} = {
        finalize: "1",
        filename: pathIsArchive(filename)
            ? formattedFilename + getArchiveExt(filename)
            : formattedFilename,
        unpack: pathIsArchive(filename) ? "1" : "0",
    };
    return _.map(queryParams, (v, k) => k + '=' + v).join('&')
}
