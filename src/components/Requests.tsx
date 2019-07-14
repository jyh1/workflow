import {LoginRequest, TaskInfoRequest, Task, TaskListRequest, TaskElement, TaskId, TaskListElement} from "./Types"
import Cookies from 'universal-cookie';

export const loginReq: LoginRequest = (username, password) => {
    let req = fetch('/login', 
        {
          headers: {"Content-Type":'application/json'}
        , credentials: 'same-origin'
        , method: 'POST'
        ,  body: JSON.stringify({username, password})
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