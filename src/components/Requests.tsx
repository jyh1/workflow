import {LoginRequest, TaskInfoRequest, Task, TaskListRequest, TaskElement, TaskId, TaskListElement} from "./Types"
import Cookies from 'universal-cookie';
import * as T from "./Types"
import * as _ from "lodash"
import { delay } from "q";

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
                    if (!res.ok){
                        return Promise.reject(res);
                    }
                    return res.json()
                })
            return req        
        }
    )
}

export const loginReq: LoginRequest = (username, password) => {
    let req = fetch('/login', 
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
    fetch('/tool/list', 
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        })
    .then((e) => e.json())
)

export const taskReq: TaskInfoRequest = (taskid) => (
    fetch('/tool/' + taskid, 
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        })
    .then((e) => e.json())
)


export const clReq: T.ClRequest = (worksheet, command) => (
    fetch(T.endPointPath.codalab + 'cli/command',
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
    return (fetch(T.endPointPath.codalab + 'bundles/' + uuid,
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


export const compileReq: T.CompileRequest = (ts) => {
    let req = fetch('tool/compile', 
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        , method: 'POST'
        ,  body: JSON.stringify(ts)
        }).then((res) => {
            if (!res.ok){
                return Promise.reject(res);
            }
            return res.json()
        })
    return req
}


function parseWorksheetItem(item: any): T.WorksheetItem{
    if (item.mode == "markup_block"){
        return {type: "markup", content: item.text}
    }
    if (item.mode == "table_block"){
        return {type: "bundles", content: item.bundles_spec.bundle_infos}
    }
    return null
}
export const worksheetItemsReq: T.WorksheetItemsRequest = (worksheet) => {
    let req = fetch(T.endPointPath.codalab + 'interpret/worksheet/' + worksheet + '?include=items.bundles', 
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
    fetch(T.endPointPath.codalab + 'worksheets?keywords=.mine', {credentials: 'same-origin'})
    .then(res => {
        if (!res.ok){
            return Promise.reject(res);
        }
        let list = res.json().then(data => _.map(data.data, w => ({uuid: w.id, name: w.attributes.name, title: w.attributes.title})))
        return list
    })
)

export const bundleInfoReq: T.BundleInfoRequest = (uuid: string) => (
    fetch(T.endPointPath.codalab + 'bundles/' + uuid,
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