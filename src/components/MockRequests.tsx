// mock request functions for dev
import {LoginRequest, TaskInfoRequest, Task, TaskListRequest, TaskElement, TaskId, TaskListElement} from "./Types"
import * as _ from "lodash"

let latency = 3000
let reqtime = () => latency * Math.random()

export const loginReq: LoginRequest = (username, password) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => {
                if (username==="codalab" && password === "123456"){
                    isLogin = true
                    executor({})
                } else {
                    resolve()
                }
            }
        , reqtime())
    })
)

let isLogin = false

export const getLoginStatus = () => (isLogin)


export const taskReq: TaskInfoRequest = (taskid) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => {
                executor(defTask(taskid.toString()))
            }
        , reqtime())
    })
)

export const taskListReq: TaskListRequest = () => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => {
                executor(_.flatMap([1, 1, 1,1, 1, 1], (i) => toListEle(genEle(i))))
            }
            , reqtime())
    })
)

let defTask = (i:TaskId):Task => (
    {
        taskid: i
      , inports: {dataset1: {}, dataset2: {}}
      , outports: {result: {}}
  }
)

let coin:()=> boolean = () => (Math.random() > 0.35)

let numEle = 0

function genEle(dep: number):TaskElement {
    let newdep = dep + 1
    numEle += 1
    let id = numEle.toString()
    if (dep > 5) {return ({name: "task" + id, taskid: id, id: id})}
    return (
        coin() ? 
              {name: "task" + id, taskid: id, id: id} 
            : {name: "folder" + id, children: _.map([newdep, newdep, newdep], genEle), id: id}
    )
}

let listEleId = 0
function toListEle(e: TaskElement, parent?: string): TaskListElement[] {
    listEleId += 1
    let id = listEleId.toString()
    if ("taskid" in e){
        return [{name: e.name, taskid: e.taskid, id: id, parent: parent}]
    } else {
        let childrenEles = _.flatMap(e.children, (x) => toListEle(x, id))
        childrenEles.push({name: e.name, id: id, parent: parent})
        return childrenEles
    }
}



// let testtasks: TaskElement[] = [
//       ...defTaskLis(["s1", "s2", "s3"])
//     , taskfoldr
//     , ...defTaskLis(["q1", "q2", "q3"])
// ]

// export let requestTask:RequestTask = (taskid) => (
//     new Promise((executor, resolve) => {
//         setTimeout(function() {
//             executor(newTask(taskid));
//         }, 300);
//     })
// )