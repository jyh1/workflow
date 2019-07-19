// mock request functions for dev
import {
      LoginRequest
    , TaskInfoRequest
    , Task
    , TaskListRequest
    , TaskElement
    , TaskId
    , TaskListElement
    , CompileRequest
    , JRec
    , JVar
    , JBlock
    } from "./Types"
import * as T from "./Types"
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
      , inports: ["dataset1", "dataset2"]
      , outports: ["result"]
  }
)

let coin:()=> boolean = () => (Math.random() > 0.35)

let numEle = 0

function genEle(dep: number):TaskElement {
    let newdep = dep + 1
    numEle += 1
    let id = numEle.toString()
    if (dep > 5) {return ({name: "task" + id, taskid: id, id: id, description: "max depth"})}
    return (
        coin() ? 
              {name: "task" + id, taskid: id, id: id, description: "mock file description"} 
            : {name: "folder" + id, children: _.map([newdep, newdep, newdep], genEle), id: id, description: "mock folder description"}
    )
}

let listEleId = 0
function toListEle(e: TaskElement, parent?: string): TaskListElement[] {
    listEleId += 1
    let id = listEleId.toString()
    if ("taskid" in e){
        return [{name: e.name, taskid: e.taskid, id: id, parent: parent, description: e.description}]
    } else {
        let childrenEles = _.flatMap(e.children, (x) => toListEle(x, id))
        childrenEles.push({name: e.name, id: id, parent: parent, description: e.description})
        return childrenEles
    }
}

export const compileReq: CompileRequest = (ts) => new Promise((executor, resolve) => {
        setTimeout(
            () => {
                executor({result: testRes, blocks: testBlocks})
            }
        , reqtime())
    }
)

const makeVar: (x: string) => JVar = (x) => ({type: "variable", content: x})

const testRes: JRec = {
      type: "record"
    , content: 
        {"key1": makeVar("x"), "key2": makeVar("y")}
}

function tc<T1, T2>(a:T1, b:T2): T.JObject<T1, T2>{
    return {type: a, content: b}
}

function val(s: string): T.JVerbatim{
    return tc("value", s)
}

function jv(s: string): T.JVar{
    return tc("variable", s)
}

function blk(s: string, cmd: T.JCmd): T.JBlock{
    return {variable: s, options: [], command: cmd}
}

const testBlocks: JBlock[] = [
      blk("x", tc("lit", val("0x0cf40bf4b76246bc9d0545e13524a174")))
    , blk("y", tc("run", {dependencies: [["x", jv("x")]], cmd: [val("bash"), val("x"), val("x")]}))
]

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