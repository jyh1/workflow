import { string } from "prop-types";

export interface Tool {
    codaExpr: CodaVal;
    node: Node;
}

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

export type CompileResult = {codalang: CodaVal, jlang: JLang, codalangstr: string, interface: string}

export type TaskInfo = JObject<"taskid", TaskId> | JObject<"codaval", string> | JObject<"task", Task> | JObject<"empty", {}> | JObject<"uuid", string>

export interface NodeInfo {
    name: string
    pos: {x: number; y: number}
    taskinfo: TaskInfo
    nodeType?: NodeType
}

export type TaskId = string
export type TypeDict = Arguments

export type ParseResult = {
      taskbody: CodaVal | TypeDict
    , inports: Arguments
    , outports: Arguments
    , taskid?: string
}

export type Task = ParseResult & {taskcode: string, bundleuuid?: string}

export const taskTag = "task"
export const bundleTag = "bundle"
export type TaskDragType = {name: string, taskinfo: TaskInfo, nodetype?: NodeType}
export type BundleDragType = {name: string, uuid: string}

export type TaskElement = {name: string, id: string, description: string} & ({children: TaskElement[], open?: boolean} | {taskid: TaskId})

export type TaskListElementId = string
export type TaskListElement = {name: string; taskid?: string; parent?: TaskListElementId; id: TaskListElementId; description: TaskId}

// requests
export type LoginRequest = (username: string, password: string) => Promise<void>
export type TaskListRequest = () => Promise<{public: TaskListElement[], user: TaskListElement[]}>
export type TaskInfoRequest = (taskid: TaskId) => Promise<Task>
export type ToolGraphRequest = (taskid: TaskId) => Promise<NodeLayout>
export type CompileRequest = (nodes: CodaGraph) => Promise<CompileResult>
export type ClRequest = (worsheet: string, command: string) => Promise<string>
export type ClWaitRequest = (path: string) => Promise<string>
export type WorksheetItemsRequest = (worksheet: string) => Promise<WorksheetContent>
export type WorksheetsRequest = () => Promise<Worksheet[]>
export type WorksheetNameRequest = (name: string) => Promise<string>
export type BundleInfoRequest = (uuid: string) => Promise<BundleInfo>
export type ParseRquest = (program: string) => Promise<ParseResult>
export type ParseArgRequest = (arg: string) => Promise<ParseResult>
export type NewToolReq = (task: NewTool) => Promise<string>
export type UpdateToolReq = (task: UpdateTool) => Promise<string>
export type RemoveElementReq = (eid: string) => Promise<{}>
export type UploadFileReq = (worksheet: string, file: File) => Promise<{}>
export type UserInfoReq = () => Promise<UserInfo>
export type CompileCodaValReq = (cv: CodaVal) => Promise<Task>

export type UserInfo = {attributes: {user_name: string}, id: string}

// graph representation
export type ToolPort = JObject <NodeType, {nodeid: string, label: string, nodename: string}>
export interface ToolNodeInterface<PortType> {
    name: string; 
    id: string; 
    taskbody: CodaVal | Arguments; 
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
      tools: {toolinfo: ToolNodeExtra, pos: {x: number, y: number}, oldid: string, name: string}[]
    , portidmap: {[node_in_pname: string]: string}
    , links: {from: string, to: string}[]
}

export type ToolNodeExtra = {task: Task, nodeType: NodeType}

// bundle list in worksheet
export type BundleState = "created" | "ready" | "preparing" | "running" | "failed" | "uploading" | "staged" | "starting" | "finalizing"
export type BundleType = "run" | "dataset"
export type BundleInfo = {
      uuid: string
    , args?: string
    , bundle_type: BundleType
    , command?: string
    , metadata: BundleMeta
    , state: BundleState
    , dependencies: ParentBundle[]
}
export type ParentBundle = {
      child_path: string
    , parent_uuid: string
    , parent_path: string
    , parent_name: string
}

export type BundleMeta = {
      run_status?: "Finished"
    , data_size?: number
    , name: string
    , request_memory?: string
    , request_queue?: string
    , request_network?: boolean
    , request_time?: string
    , request_docker_image?: string
    , request_gpus?: number
    , request_priority?: number
    , request_cpus?: number
    , request_disk?: string
    , allow_failed_dependencies?: boolean
}

export const Resources: [keyof BundleMeta, string | boolean | number][] = [

    ["request_docker_image", ""]
  , ["request_gpus", 0]
  , ["request_cpus", 1]
  , ["request_memory", "2g"]
  , ["request_network", false], 
  , ["request_time", ""]
  , ["request_queue", ""]
  , ["request_disk", ""]
  , ["allow_failed_dependencies", false]
]

export type WorksheetItem = 
    JObject<"bundles", BundleInfo[]> 
    | JObject<"markup", string> 
    | JObject <"subworksheets", Worksheet[]>

export type WorksheetContent = {items: WorksheetItem[]} & Worksheet

export type Worksheet = {uuid: string, name: string, title?: string}

export type NewTool = {parent?: string, name: string, description: string, codalang?: CodaVal, graph?: NodeLayout, codalangstr?: string}

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
      login: "/workflow/demologin"
    , mainapp: "/workflow"
    , rest: "/rest/"
    , codalab: "/"
}

export function makeLitTask(uuid: string): Task{
    return ({
        "outports":{data: "bundle"},"inports":{},
        "taskbody": dict({data: lit(uuid)}), "taskcode": ("0x"+uuid)})
}

export function logOut(){
    document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
    document.location.replace(endPointPath.login)
}



// CodaVal


export type CodaCMDEle<T1, T2> = ICMDExpr<T1, T2> | IPlain<T1, T2>;

interface ICMDExpr<T1, T2> {
  type: "expr";
  content: T1;
}

interface IPlain<T1, T2> {
  type: "plain";
  content: T2;
}

type UUID = IUUID | IBundleName;

interface IUUID {
  tag: "UUID";
  contents: string;
}

interface IBundleName {
  tag: "BundleName";
  contents: string;
}

type Cmd<T> = IRun<T> | IClCat<T> | IClMake<T>;

interface IRun<T> {
  tag: "Run";
  contents: CodaCMDEle<T, string>[];
}

interface IClCat<T> {
  tag: "ClCat";
  contents: T;
}

interface IClMake<T> {
  tag: "ClMake";
  contents: [string, T][];
}

export type CodaVal = ILit | IVar | ICl | IStr | IDir | ILet | IConvert | IDict | ILambda | IApply;

interface ILit {
  tag: "Lit";
  contents: UUID;
}

interface IVar {
  tag: "Var";
  contents: string;
}

interface ICl {
  tag: "Cl";
  contents: [CodaCMDEle<CodaVal, string>[], Cmd<CodaVal>];
}

interface IStr {
  tag: "Str";
  contents: string;
}

interface IDir {
  tag: "Dir";
  contents: [CodaVal, string];
}

interface ILet {
  tag: "Let";
  contents: [string, CodaVal, CodaVal];
}

interface IConvert {
  tag: "Convert";
  contents: [CodaType, CodaVal, CodaType];
}

interface IDict {
  tag: "Dict";
  contents: {[k: string]: CodaVal};
}

interface ILambda {
  tag: "Lambda";
  contents: [{[k: string]: CodaType}, CodaVal];
}

interface IApply {
  tag: "Apply";
  contents: [CodaVal, {[k: string]: CodaVal}];
}


export const lit = (uuid: string): ILit => ({tag:"Lit", contents: {tag: "UUID" , contents: uuid}})
export const cvar = (name: string): IVar => ({tag: "Var", contents: name})
export const cl = (eles: CodaCMDEle<CodaVal, string>[], cmd: Cmd<CodaVal>): ICl => ({tag: "Cl", contents: [eles, cmd]})
export const cmdPlain = (txt: string): IPlain<CodaVal, string> => ({type: "plain", content: txt})
export const cmdExpr = (val: CodaVal): ICMDExpr<CodaVal, string> => ({type: "expr", content: val})
export const run = (eles: CodaCMDEle<CodaVal, string>[]): IRun<CodaVal> => ({tag: "Run", contents: eles})
export const str = (s: string): IStr => ({tag: "Str", contents: s})
export const dir = (val: CodaVal, path: string): IDir => ({tag: "Dir", contents: [val, path]})
export const clet = (v: string, val: CodaVal, body: CodaVal): ILet => ({tag: "Let", contents: [v, val, body]})
export const dict = (d: {[k: string]: CodaVal}): IDict => ({tag: "Dict", contents: d})
export const lambda = (arg: {[k: string]: CodaType}, body: CodaVal): ILambda => ({tag: "Lambda", contents: [arg, body]})
export const apply = (fun: CodaVal, ad: {[k: string]: CodaVal}): IApply => ({tag: "Apply", contents: [fun, ad]})
