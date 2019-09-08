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

function mockRequest<R>(info: R): Promise<R>{
    return (new Promise((executor, resolve) => {
        setTimeout(
            () => executor(info)
        , reqtime())
    }))
}

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

export const toolGraphReq: T.ToolGraphRequest = (taskid) => mockRequest(
    {"tools":[{name: "expanded", "toolinfo":{"task":{"outports":{"data":"bundle"},"inports":{},"taskbody":{"tag":"Dict","contents":{"data":{"tag":"Lit","contents":{"tag":"UUID","contents":"fdc0940220a84b6c8b7982e9473f63ee"}}}},"taskcode":"0xfdc0940220a84b6c8b7982e9473f63ee"},"nodeType":"tool"},"pos":{"x":713.6875,"y":315},"oldid":"479db502-7c80-4f0d-ae87-2e030f5db072"}],"portidmap":{"479db502-7c80-4f0d-ae87-2e030f5db072,false,data":"94a4c712-32ae-44a8-8d03-1768fc69014d"},"links":[]}
)

export const taskListReq: TaskListRequest = () => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => {
                executor({user: _.flatMap([1, 1, 1,1, 1, 1], (i) => toListEle(genEle(i))), public: _.flatMap([1, 1], (i) => toListEle(genEle(i)))})
            }
            , reqtime())
    })
)

let defTask = (i:TaskId):Task => (
    {
        taskbody: i
      , inports: {dataset1: "bundle", dataset2: "bundle"}
      , outports: {result: "bundle"}
      , taskcode: "test  code"
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
                executor({codalang: tc("lit", "0x0cf40bf4b76246bc9d0545e13524a174"), codalangstr: "0x0cf24434ffs", jlang: {result: testRes, blocks: testBlocks}, interface: "bundle"})
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

function plainE(s: string): T.CMDEle{
    return {type: "plain", content: s}
}
function cmdBundle(uuid: string): T.CMDEle{
    return {type: "bundle", content: uuid}
}

const testBlocks: JBlock[] = [
      blk("x", tc("lit", "0x0cf40bf4b76246bc9d0545e13524a174"))
    , blk("y", tc("run", {dependencies: [["x", jv("x")]], cmd: [plainE("bash"), cmdBundle("x"), cmdBundle("x")]}))
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
            () => executor({name: "test", uuid: worksheet, items: [{type: "bundles", content: Data.worksheetitems.items[0].bundles_spec.bundle_infos}]})
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

export const worksheetNameReq: T.WorksheetNameRequest = (name: string) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => {
                executor("0xfb85fa298e8d48fba93febc8c1860e94")
            }

        , reqtime()
        )
    })
)

export const bundleInfoReq: T.BundleInfoRequest = (uuid: string) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => executor({uuid: uuid, args: "python test.py test.in", bundle_type: "run"
                            , command: "run python "
                            , metadata: {name: "testbundle"}
                            , state: coin()? "ready" : "failed"})
        , reqtime())
    })
) 

export const parseReq: T.ParseRquest = (program: string) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => executor({"outports":{data: "bundle"},"inports":{},"taskbody":{"tag":"Dict","contents":{"data":{"tag":"Lit","contents":{"tag":"UUID","contents":"234"}}}}})
        , reqtime())
    })
) 

export const parseArgReq: T.ParseArgRequest = (str: string) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => executor({"outports":{arg1: "bundle",arg2: "bundle"},"inports":{},"taskbody":{"arg1":{"tag":"TypeBundle"},"arg2":{"tag":"TypeBundle"}}})
        , reqtime())
    })
) 

export const updateToolReq: T.UpdateToolReq = (d) => mockRequest(d.id)
export const newToolReq: T.NewToolReq = (t) => mockRequest("1")
export const removeEleReq: T.RemoveElementReq = (t) => mockRequest({})