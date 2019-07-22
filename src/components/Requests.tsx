import {LoginRequest, TaskInfoRequest, Task, TaskListRequest, TaskElement, TaskId, TaskListElement} from "./Types"
import Cookies from 'universal-cookie';
import * as T from "./Types"
import { delay } from "q";

export const loginReq: LoginRequest = (username, password) => {
    let req = fetch('/login', 
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        , method: 'POST'
        ,  body: JSON.stringify({username, password})
        }).then((res) => {
            if (res.status == 401){
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
            if (res.status !== 200){
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
            if (res.status !== 200){
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
            if (res.status == 401){
                return Promise.reject(res);
            }
            return res.json()
        })
    return req
}