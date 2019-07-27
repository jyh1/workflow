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
export type Dep = [string, JNormalRes]
export type Deps = Dep[]
export type JMake = JObject<"make", Deps>
export type JRun = JObject<"run", {dependencies: Deps, cmd: CMDEle[]}>
export type JLit = JObject<"lit", string>
export type JCmd = JCat | JMake | JRun | JLit

export type CMDEle = JObject<"plain", string> | JObject<"bundle", string> | JObject<"quote", JNormalRes>

export type ClOption = [string, JVar | JVerbatim]
export type JBlock = {variable: string, options: ClOption[], command: JCmd}

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
export type LoginRequest = (username: string, password: string) => Promise<void>
export type TaskListRequest = () => Promise<TaskListElement[]>
export type TaskInfoRequest = (taskid: TaskId) => Promise<Task>
export type CompileRequest = (nodes: ToolNode[]) => Promise<JLang>
export type ClRequest = (worsheet: string, command: string) => Promise<string>
export type ClWaitRequest = (path: string) => Promise<string>
export type WorksheetItemsRequest = (worksheet: string) => Promise<WorksheetContent>
export type WorksheetsRequest = () => Promise<Worksheet[]>

// graph representation
export type ToolPort = {nodeid: TaskId, nodename: string, label: string}
export interface ToolNodeInterface<PortType> {
    name: string; 
    id: string; 
    taskid: TaskId; 
    arguments: {[arg: string]: PortType}
}
export type ToolNode = ToolNodeInterface<ToolPort>

// bundle list in worksheet
export type BundleInfo = {
      uuid: string
    , args?: string
    , bundle_type: "run" | "dataset"
    , command?: string
    , metadata: BundleMeta
    , state: "ready" | "preparing" | "running" | "failed"
}
export type BundleMeta = {
      run_status?: "Finished"
    , data_size?: number
    , name: string
}

export type WorksheetItem = JObject<"bundles", BundleInfo[]> | JObject<"markup", string>

export type WorksheetContent = {items: WorksheetItem[]} & Worksheet

export type Worksheet = {uuid: string, name: string, title?: string}

export const endPointPath = {
      login: "/login"
    , mainapp: "/"
    , codalab: "rest/"
}