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
import * as Data from './TestData'

let latency = 3000
let reqtime = () => latency * Math.random()

export const loginReq: LoginRequest = (username, password) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => {
                if (username==="codalab" && password === "123456"){
                    isLogin = true
                    executor()
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

const testRes: JVar = {
    //   type: "record"
    // , content: 
    //     {"key1": makeVar("x"), "key2": makeVar("y")}
      type: "variable"
    , content: "dir"
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
      blk("x", tc("lit", "0x0cf40bf4b76246bc9d0545e13524a174"))
    , blk("y", tc("run", {dependencies: [["x", jv("x")]], cmd: [val("bash"), val("x"), val("x")]}))
    , blk("z", tc("cat", tc("dir", {root: jv("y"), path: ["stdout"]})))
    , blk('dir', tc('make', [["res", tc("dir", {root:jv("y"), path: ["stdout"]})], ["code", jv("x")]]))
]

export const clReq: T.ClRequest = (worksheet, command) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => {
                if (worksheet == "0x4329e2c6d58c4312aad5a0df042eea95"){
                    executor("0xfb85fa298e8d48fba93febc8c1860e94")
                } else {
                    resolve()
                }
            }
        , reqtime())
    })
)

export const clWait: T.ClWaitRequest = (bundle) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => executor()
        , reqtime())
    })
)

export const worksheetItemsReq: T.WorksheetItemsRequest = (worksheet) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => executor(Data.bundlelist.items[0].bundles_spec.bundle_infos)
        , reqtime())
    })
)

export const worksheetsReq: T.WorksheetsRequest = () => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => {
                let data = _.map(Data.myworksheets.data, w => ({uuid: w.id, name: w.attributes.name, title: w.attributes.title}))
                console.log(data)
                executor(data)
            }

        , reqtime()
        )
    })
)