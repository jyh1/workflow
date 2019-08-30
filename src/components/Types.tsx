import { string } from "prop-types";

export interface Tool {
    codaExpr: CodaLang;
    node: Node;
}

export type CodaLang = Object;

export type Arguments = {[arg: string]: CodaType}

export type CodaType = 
      "bundle" 
    | "string" 
    | {type: "record", content: Arguments} 
    | {type: "lambda", arg: Arguments, body: CodaType} 

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

export type ClOption = CMDEle
export type JBlock = {variable: string, options: ClOption[], command: JCmd}

export type JLang = {result: JRes, blocks: JBlock[]}

export type CompileResult = {codalang: CodaLang, jlang: JLang, codalangstr: string, interface: string}

export type TaskInfo = JObject<"taskid", TaskId> | JObject<"codaval", string> | JObject<"task", Task> | JObject<"empty", {}>

export interface NodeInfo {
    name: string
    pos: {x: number; y: number}
    taskinfo: TaskInfo
    nodeType?: NodeType
}

export type TaskId = string
export type TaskBody = Object
export type TypeDict = Arguments

export type ParseResult = {
      taskbody: TaskBody | TypeDict
    , inports: Arguments
    , outports: Arguments
    , taskid?: string
}

export type Task = ParseResult & {taskcode: string}

export const taskTag = "task"
export type TaskDragType = {name: string, taskinfo: TaskInfo, nodetype?: NodeType}

export type TaskElement = {name: string, id: string, description: string} & ({children: TaskElement[]} | {taskid: TaskId})

export type TaskListElementId = string
export type TaskListElement = {name: string; taskid?: string; parent?: TaskListElementId; id: TaskListElementId; description: TaskId}

// requests
export type LoginRequest = (username: string, password: string) => Promise<void>
export type TaskListRequest = () => Promise<TaskListElement[]>
export type TaskInfoRequest = (taskid: TaskId) => Promise<Task>
export type ToolGraphRequest = (taskid: TaskId) => Promise<NodeLayout>
export type CompileRequest = (nodes: CodaGraph) => Promise<CompileResult>
export type ClRequest = (worsheet: string, command: string) => Promise<string>
export type ClWaitRequest = (path: string) => Promise<string>
export type WorksheetItemsRequest = (worksheet: string) => Promise<WorksheetContent>
export type WorksheetsRequest = () => Promise<Worksheet[]>
export type BundleInfoRequest = (uuid: string) => Promise<BundleInfo>
export type ParseRquest = (program: string) => Promise<ParseResult>
export type ParseArgRequest = (arg: string) => Promise<ParseResult>
export type NewToolReq = (task: NewTool) => Promise<string>
export type UpdateToolReq = (task: UpdateTool) => Promise<string>
export type RemoveElementReq = (eid: string) => Promise<{}>
export type UploadFileReq = (worksheet: string, file: File) => Promise<{}>

// graph representation
export type ToolPort = JObject <NodeType, {nodeid: string, label: string, nodename: string}>
export interface ToolNodeInterface<PortType> {
    name: string; 
    id: string; 
    taskbody: TaskBody; 
    arguments: {[arg: string]: PortType}
    nodeType: NodeType
}
export type ToolNode = ToolNodeInterface<ToolPort>

// optional type dict for arguments
export type CodaGraph = 
    {
          args?: TypeDict
        , body: ToolNode[]
        , result: ToolPort[]
    }

export type NodeLayout = {
      tools: {toolinfo: ToolNodeExtra, pos: {x: number, y: number}, oldid: string}[]
    , portidmap: {[node_in_pname: string]: string}
    , links: {from: string, to: string}[]
}

export type ToolNodeExtra = {task: Task, nodeType: NodeType}

// bundle list in worksheet
export type BundleState = "created" | "ready" | "preparing" | "running" | "failed" | "uploading"
export type BundleInfo = {
      uuid: string
    , args?: string
    , bundle_type: "run" | "dataset"
    , command?: string
    , metadata: BundleMeta
    , state: BundleState
}
export type BundleMeta = {
      run_status?: "Finished"
    , data_size?: number
    , name: string
}

export type WorksheetItem = 
    JObject<"bundles", BundleInfo[]> 
    | JObject<"markup", string> 
    | JObject <"subworksheets", Worksheet[]>

export type WorksheetContent = {items: WorksheetItem[]} & Worksheet

export type Worksheet = {uuid: string, name: string, title?: string}

export type NewTool = {parent?: string, name: string, description: string, codalang?: CodaLang, graph?: NodeLayout}

export type UpdateTool = {id: string, name: string, description: string}


export type NodeType = "tool" | "argument"


export type Exception = 
    (({type: "parser", line: number, column: number} 
        | {type: "type"}
    ) 
    & {info: string})

export type Info = 
    {
      type: "positive" | "warning" | "error"  | "loading"
    , header: string
    , body: JSX.Element
    , update?: {id: number}
    , timeout?: number
    }
export type ConfirmInfo =
    {
      type: "confirm"
    , header: string
    , confirm: () => void
    }
export type MessageInfo = Info | ConfirmInfo

export const endPointPath = {
      login: "/workflow/login"
    , mainapp: "/workflow"
    , rest: "/rest/"
    , codalab: "/"
}

export function makeLitTask(uuid: string): Task{
    return ({
        "outports":{data: "bundle"},"inports":{},
        "taskbody":{"tag":"Dict","contents":{"data":{"tag":"Lit","contents":{"tag":"UUID","contents":uuid}}}}, "taskcode": ("0x"+uuid)})
}