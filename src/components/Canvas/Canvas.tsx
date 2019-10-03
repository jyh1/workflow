import {NodeInfo, taskTag, TaskDragType, ToolPort, Info, ToolNodeInterface, JLang} from "../Types"
import * as React from "react"
import * as SRD from "storm-react-diagrams"
import {TaskNodeModel, TaskNodeFactory, TaskLinkFactory, OldLinks, TaskLinkModel, TaskPortModel} from "./TaskNodeModel"
import {Graph, debounce, toolName} from '../algorithms'
import * as _ from "lodash"
import * as S from 'semantic-ui-react'
import {compileReq} from "../Requests"
import {evalJLang} from "../Interpreter"
// import {clReq} from '../Requests'
import {clReq} from '../MockRequests'
import * as T from '../Types'
import {buildCommand, Execution} from './ExePlan'
import { fromException } from "../Errors/FromException";
import { DefaultPortModel, DiagramModel } from "storm-react-diagrams";
import { serialize } from "cookie";

type Props = {
      nodes: NodeInfo[]
    , refreshBundle: () => void
    , doSave: (codalang: T.CodaLang, graph: T.NodeLayout) => void
    , report: (e: T.MessageInfo) => number
};

type State = {
    compiled: T.CompileResult & {command: string, graph: T.NodeLayout }
    loading: boolean
    running: boolean
    locked: boolean
    tab: Tab
}

const nullRes: State["compiled"] = 
    {command: null, codalang: null, jlang: null, codalangstr: null, interface: null, graph: null}

type ConflictPort = T.JObject<"conflictport", {portname: string}>
type CircleErr = T.JObject<"circle", {nodeids: string[]}>
type EmptyGraph = T.JObject<"empty", {}>

type Tab = "Canvas" | "Execution Plan"

export class Canvas extends React.Component<Props, State>{
    engine: SRD.DiagramEngine;
    refreshBundle: () => void
    runningInfo: {commands: JSX.Element[], infoid: number, currentInfo: T.Info}
    // refresh: () => void;
    constructor(props: Props){
        super(props);
        this.state = {loading: false, running: false, locked: false, compiled: nullRes, tab: "Canvas"};
        this.engine = new SRD.DiagramEngine();
        this.engine.installDefaultFactories();
        this.engine.registerNodeFactory(new TaskNodeFactory());
        this.engine.registerLinkFactory(new TaskLinkFactory());
        let model = new SRD.DiagramModel();
        this.engine.setDiagramModel(model);

        // refresh bundlelist after submitting request
        this.refreshBundle = debounce(this.props.refreshBundle, 2000)
    }

    refresh = () => {
        this.forceUpdate()
    }

    serializeTaskGraph(): {compileg: T.CodaGraph, layoutg: T.NodeLayout} {
        let g = this.engine.getDiagramModel().serializeDiagram()
        let graphModel = new Graph()
        let {links, nodes} = g
        let linkDic : {[linkid: string]: {nodeid: string, portid: string}} = {} //linkid to source [nodeid, portid]
        for(let l of links){
            linkDic[l.id] = {nodeid: l.source, portid: l.sourcePort}
            graphModel.addEdge(l.source, l.target)
        }
        let portIdToName: {[portid: string]: string} = {}
        type PortState = T.JObject<"linkid", string> | T.JObject<"var", string>
        type ArgDic = {[arg: string]: PortState} //argumentname to linkid
        let processedNodes: {[nodeid: string]: ToolNodeInterface<PortState>} = {}
        let uniqName: Map<string, number> = new Map()
        let argNodeDict: T.TypeDict = {}
        let resRecord: ToolPort[] = []

        // layout info
        const linkLayout: T.NodeLayout["links"] = _.map(links, l => ({from: l.sourcePort, to: l.targetPort}))
        let oldPortIdMap: T.NodeLayout["portidmap"] = {}
        let toolLayout: T.NodeLayout["tools"] = []
        const [x0, y0] = [nodes[0].x, nodes[0].y]
        for(let n of nodes){
            let {id, ports} = n
            let extras = n.extras as T.ToolNodeExtra
            let name: string
            const taskbody = extras.task.taskbody
            graphModel.addNode(id)
            name = (n as any).name
            // layout info
            toolLayout.push({toolinfo: extras, pos: {x: n.x - x0, y: n.y - y0}, oldid: id, name})
            name = toolName(name)

            
            // argument node
            if (extras.nodeType == "argument"){
                const args = extras.task.taskbody as T.Arguments
                for (const argname in args){
                    if (argname in argNodeDict){
                        const e: ConflictPort = {type: "conflictport", content: {portname: argname}}
                        throw e
                    } else {
                        argNodeDict[argname] = args[argname]
                    }
                }
                argNodeDict = {...argNodeDict, ...(extras.task.taskbody as T.Arguments)}
            }

            // uniq name
            if (uniqName.has(name)){
                const count = uniqName.get(name)
                uniqName.set(name, count + 1)
                name = name + '-' + count
            } else {
                uniqName.set(name, 0)
            }
            let argDic: ArgDic = {} // portname to linkid
            for (const p of ports){
                const portname = (p as any).label
                portIdToName[p.id] = portname
                const isInport: boolean = (p as any).in
                oldPortIdMap[[id, isInport, portname].toString()] = p.id
                if(isInport){
                    // input port
                    if (p.links.length == 0){ 
                        if (portname in argNodeDict){
                            const e: ConflictPort = {type: "conflictport", content: {portname}}
                            throw e
                        }else {
                            argNodeDict[portname] = (p as any).codatype
                            argDic[portname] = {type: "var", content: portname}    
                        }
                    } else {
                        let link = p.links[0]
                        argDic[portname] = {type: "linkid", content: link}    
                    }
                } else {
                    // output port
                    if ((p as any).selected){
                        resRecord.push({type: "tool", content: {nodeid: id, nodename: name, label: portname}})
                    }
                }
            }
            processedNodes[id]= {id, taskbody, arguments: argDic, name, nodeType: extras.nodeType}
        }

        // only keep tool node
        let sortedOrder
        try {
            sortedOrder = _.filter(graphModel.topoSort(), n => processedNodes[n].nodeType == "tool" ? true: false)
        } catch (nodes) {
            const e: CircleErr = {
                  type: "circle",
                  content: {nodeids: nodes}
            }
            throw e
        }
        // console.log(processedNodes)
        let tools = _.mapValues(processedNodes, (n) => {
                let toToolPort: (portstate: PortState) => ToolPort = (portstate) => {
                    if (portstate.type=="linkid"){
                        const linkid = portstate.content
                        const {nodeid} = linkDic[linkid]
                        const sourcenode = processedNodes[nodeid]
                        const nodeobj = {nodeid, nodename: sourcenode.name, label: portIdToName[linkDic[linkid].portid]}
                        return {type: sourcenode.nodeType, content: nodeobj}
                    }
                    if (portstate.type=="var"){
                        return {type: "argument", content: {nodeid: "lambdaNodeId", nodename: "lambdaNodeName", label: portstate.content}}
                    }
                }
                return ({...n, arguments: _.mapValues(n.arguments, toToolPort)})
            })
        const compileg = {
            args: Object.keys(argNodeDict).length == 0? null : argNodeDict
          , body: _.map(sortedOrder, k => tools[k])
          , result: resRecord
        }
        const layoutg: T.NodeLayout = {
              tools: toolLayout
            , portidmap: oldPortIdMap
            , links: linkLayout
        }
        return {compileg, layoutg}
    }

    lockModel = () => {
        this.setState(p => Object.assign(p, {locked: true}))
    }
    unlockModel = () => {
        this.setState(p => Object.assign(p, {locked: false}))
    }

    compile(){
        try {
            const {compileg: nodes, layoutg} = this.serializeTaskGraph()
            if (nodes.body.length == 0){
                const e: EmptyGraph = {type: "empty", content: {}}
                throw e
            }
            this.setState(p => ({...p, loading: true, compiled: nullRes, tab: "Canvas"}))
            compileReq(nodes)
            .then((res) => {
                buildCommand(res.jlang)
                .then( command => 
                    {this.setState(p => ({...p, compiled: {...res, command, graph: layoutg}, loading: false}))}
                )
                return res.interface
            })
            .then((inter) => this.props.report({type: "positive", header: "Build Sucess", body: <p>{inter}</p>, timeout: 3000}))
            .catch(e => {
                this.setState(p => ({...p, loading: false}))
                this.props.report(fromException(e))
            }) 
        } catch (error) {
            this.setState(p => ({...p, compiled: nullRes}))
            const einfo: ConflictPort | CircleErr | EmptyGraph = error
            let info: T.Info
            switch (einfo.type){
                case "conflictport":
                    info = {
                          type: "error"
                        , header: "Conflict Port Name"
                        , body: <p>Multiple unfilled input ports with name <b>{einfo.content.portname}</b>. Try renaming one using an argument node.</p>
                    }
                    break
                case "circle":
                    info = {
                        type: "error"
                      , header: "Circle in Graph"
                      , body: <p>Circle encountered in computation graph</p>
                    }
                    break
                case "empty":
                    info = {
                        type: "error"
                      , header: "Empty Graph"
                      , body: <p/>
                    }
                    break
                default:
                    console.log(einfo)
                    info = {type: "error",  header: "Error", body: <p>{JSON.stringify(einfo)}</p>}
            }
            this.props.report(info)
        }
    }

    reqAndRefresh(worksheet: string, command: string): Promise<string>{
        let req = clReq(worksheet, command)
        req.then(this.refreshBundle)
        .then( () => {
            this.runningInfo.commands.push(<S.MessageItem key={this.runningInfo.commands.length}><b>DEMO: </b><code>{command}</code></S.MessageItem>)
            this.reportRunning()
        })
        return req
    }

    reportRunning(){
        const {infoid, commands, currentInfo: info} = this.runningInfo
        this.props.report(
            {...info, body: <S.MessageList className="infobody">{commands}</S.MessageList>
            , update: {id: infoid}})
    }

    run(){
        const {jlang} =  this.state.compiled
        if (jlang){
            const loadingInfo: T.Info = {type: "loading", header: "Executing Graph", body: <p/>}
            const infoid = this.props.report(loadingInfo)
            this.runningInfo = {commands: [], infoid, currentInfo: loadingInfo}
            this.setState(prev => Object.assign(prev, {running: true}))
            evalJLang(jlang, this.reqAndRefresh.bind(this))
            .then(res => {
                this.runningInfo.currentInfo = {type: "positive", header: "Execution Complete", body: <p/>}
                this.reportRunning()
                })
            .catch(err => {
                const {infoid} = this.runningInfo
                this.props.report({type: "error", header: "Runtime Error", body: <p/>, update: {id: infoid}})
            })
            .finally(()=>{this.setState(prev => Object.assign(prev, {running: false}))})
        }
    }

    clearCanvas = () => {
        if (this.state.locked){
            this.lockWarning()
            return
        }
        const info: T.ConfirmInfo = 
            {  header: "Clear Canvas?"
            , confirm: () => {_.forEach(this.engine.getDiagramModel().getNodes(), n => n.remove()); this.setState(p => ({...p, compiled: nullRes}))}
            , type: "confirm"
            }
        this.props.report(info)
    }

    dragStart: React.DragEventHandler = (event) => {
        let dragData : TaskDragType = {taskinfo: {type: "empty", content: {}}, name: "New Tool"}
        event.dataTransfer.setData(taskTag, JSON.stringify(dragData)); 
    }

    dragArgumentStart: React.DragEventHandler = (event) => {
        let dragData : TaskDragType = {taskinfo: {type: "empty", content: {}}, name: "Arguments", nodetype: "argument"}
        event.dataTransfer.setData(taskTag, JSON.stringify(dragData)); 
    }

    zoom = (factor: number) => {
        const model = this.engine.getDiagramModel()
        model.setZoomLevel(model.getZoomLevel() * factor)
        this.forceUpdate()
    }

    lockWarning = () => {
        this.props.report({type: "warning", header: "Locked Canvas", body: <p>Unlock canvas to make change.</p>})
    }


    processDrop: React.DragEventHandler = (event) => {
        event.preventDefault()
        if (this.state.locked){
            this.lockWarning()
            return
        }
        let dragged: TaskDragType;

        // task tag
        let data = event.dataTransfer.getData(taskTag);
        if (data.length > 0){
            dragged = JSON.parse(data);
        } else {
            data = event.dataTransfer.getData(T.bundleTag);
            if (data.length > 0){
                const {uuid, name}: T.BundleDragType = JSON.parse(data)
                dragged = {taskinfo: {type: "task", content: T.makeLitTask(uuid.slice(2))}, name};
            }
        }
        if (!dragged){
            return
        }

        const pos = this.engine.getRelativeMousePoint(event)
        let node : NodeInfo = {pos, name: dragged.name, taskinfo: dragged.taskinfo, nodeType: dragged.nodetype}
        this.newNode(node)
        // console.log(node)
    }

    newNode = (node: NodeInfo, oldLinks?: OldLinks) => {
        const model = this.engine.getDiagramModel()
        const newnode = new TaskNodeModel(node, this.refresh, this.newNode, this.props.report, model, oldLinks)
        model.addNode(newnode)
        return newnode
    }

    setTab(tab: Tab){
        this.setState(p => ({...p, tab}))
    }

    render(){
        const model = this.engine.getDiagramModel()

        const dropDown = (
            <S.Dropdown item button className="blue icon" icon='plus' floating simple basic>
                <S.Dropdown.Menu>
                    <S.Dropdown.Item style={{cursor: "grab"}} draggable onDragStart={this.dragStart}>
                        <S.Icon name="code"/>Empty Tool
                    </S.Dropdown.Item>
                    <S.Dropdown.Item style={{cursor: "grab"}} draggable onDragStart={this.dragArgumentStart}>
                        <S.Icon name="ellipsis vertical"/>Argument Node
                    </S.Dropdown.Item>
                </S.Dropdown.Menu>
            </S.Dropdown>
        )

        const {running, compiled, locked, tab} = this.state
        model.setLocked(locked)
        const {jlang, codalang, codalangstr, command, graph} = compiled

        return(
            <div style={{height: "100%"}}>
                <S.Menu color="blue" pointing secondary >
                    <S.Menu.Item active={tab == "Canvas"} onClick={() => this.setTab("Canvas")}>
                        Canvas
                    </S.Menu.Item>
                    <S.Menu.Item style={{display: codalang? "block" : "none"}} active={tab == "Execution Plan"} onClick={() => this.setTab("Execution Plan")}>
                        Execution Plan
                    </S.Menu.Item>

                    <S.Menu.Menu position='right' style={{paddingTop: "3px", paddingBottom: "5px"}}>

                        <S.ButtonGroup style={{marginRight: "10px"}}>
                            <S.Popup content={locked? "Unlock Canvas": "Lock Canvas"} trigger = 
                                {<S.Button 
                                    basic
                                    color={locked? 'red' : 'blue'}
                                    icon={locked? "lock open" : "lock"}
                                    onClick={() => this.setState(p => ({...p, locked: !p.locked}))}
                                />}
                            />
                            <S.Popup content="Clear Canvas" trigger = 
                                {<S.Button 
                                    basic
                                    color='red'
                                    icon='trash alternate outline'
                                    onClick={() => this.clearCanvas()}
                                />}
                            />
                        </S.ButtonGroup>
                    
                        {/* <S.ButtonGroup style={{marginRight: "10px"}}>
                            <S.Button icon="zoom in" basic color="blue" onClick={() => this.zoom(1.25)}/>
                            <S.Button icon="zoom out" basic color="blue" onClick={() => this.zoom(0.8)}/>
                            <S.Popup content='Zoom to Fit' trigger = {
                                <S.Button icon="compress" basic color="blue" onClick={() => this.engine.zoomToFit()}/>
                            }/>
                        </S.ButtonGroup> */}

                        <S.ButtonGroup style={{marginRight: "10px"}}>
                            <S.Popup content='Build' trigger = 
                                {<S.Button 
                                    basic
                                    color='blue'
                                    icon='cogs' 
                                    loading={this.state.loading} 
                                    onClick={this.compile.bind(this)}/>}
                            />
                            <S.Popup content='Run' trigger = 
                                {<S.Button 
                                    basic
                                    color='blue'
                                    icon='play' 
                                    loading={running} 
                                    disabled={jlang? false : true} 
                                    onClick={this.run.bind(this)}
                                />}
                            />
                            <S.Popup content='Save' trigger = 
                                {<S.Button 
                                    basic
                                    color='blue'
                                    icon='save'
                                    loading={running} 
                                    disabled={codalang? false : true} 
                                    onClick={() => this.props.doSave(codalang, graph)}
                                />}
                            />
                            {dropDown}
                        </S.ButtonGroup>

                    </S.Menu.Menu>

                </S.Menu>

                <S.Segment attached='bottom' className="canvas-segment">
                    {tab == "Execution Plan"? 
                        (<div style={{height: "100%"}}>
                            <Execution codalang={codalangstr} command={command} />
                        </div>
                        ):
                        <React.Fragment/>
                    }

                    <div
                        style={{height: "100%", display: tab == "Canvas"? "block" : "none"}}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={this.processDrop}
                    >
                        <div className = "srd-demo-workspace__content">
                            <SRD.DiagramWidget
                                className="srd-demo-canvas" 
                                allowLooseLinks={false} 
                                diagramEngine={this.engine} 
                                allowCanvasZoom={false}
                                allowCanvasTranslation={!this.state.locked}
                                deleteKeys={[46]}
                                // maxNumberPointsPerLink={0}
                            />
                        </div>
                    </div>
                </S.Segment>
            </div>
        )
    }
}