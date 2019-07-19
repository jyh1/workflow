import { string } from "prop-types";

export interface Tool {
    codaExpr: CodaVal;
    node: Node;
}

export interface CodaVal {};

export type Arguments = string[]

export interface CodaType {};

export interface JObject<T, C> {
    "type": T
    "content": C
}
export type JVar = JObject<"variable", string> 
export type JVerbatim = JObject <"value", string> 
export type JDir = JObject<"dir", {root: JVar | JVerbatim, path: string[]}>
export type JNormalRes = JVar | JVerbatim | JDir
export type JRec = JObject<"record", {[key: string]: JRes}>
export type JRes = JVar | JVerbatim | JDir | JRec

export type JCat = JObject <"cat", JNormalRes>
export type Deps = [string, JNormalRes][]
export type JMake = JObject<"make", Deps>
export type JRun = JObject<"run", {dependencies: Deps, cmd: CMDEle[]}>
export type JLit = JObject<"lit", JNormalRes>
export type JCmd = JCat | JMake | JRun | JLit

export type CMDEle = JNormalRes | {root: string, path: string[]}

export type JBlock = {variable: string, options: [string, JNormalRes][], command: JCmd}

export type JLang = {result: JRes, blocks: JBlock[]}

export interface Node {
    name: string
    pos: {x: number; y: number}
    taskid: TaskId
}

export type TaskId = string

export interface Task {
    taskid: TaskId;
    inports: Arguments;
    outports: Arguments;
}

export const taskTag = "task"
export type TaskDragType = {name: string, id: string}

export type TaskElement = {name: string, id: string, description: string} & ({children: TaskElement[]} | {taskid: TaskId})

export type TaskListElementId = string
export type TaskListElement = {name: string; taskid?: TaskId; parent?: TaskListElementId; id: TaskListElementId; description: string}

// requests
export type LoginRequest = (username: string, password: string) => Promise<{}>
export type TaskListRequest = () => Promise<TaskListElement[]>
export type TaskInfoRequest = (taskid: TaskId) => Promise<Task>
export type CompileRequest = (nodes: ToolNode[]) => Promise<JLang>

// graph representation
export type ToolPort = {taskid: TaskId, label: string}
export interface ToolNodeInterface<PortType> {
    name: string; 
    id: string; 
    taskid: TaskId; 
    arguments: {[arg: string]: PortType}
}
export type ToolNode = ToolNodeInterface<ToolPort>

export const endPointPath = {
      login: "/login"
    , mainapp: "/"
}