import {NodeInfo, taskTag, TaskDragType, ToolPort, Info, ToolNodeInterface, JLang} from "../Types"
import * as React from "react"
import * as SRD from "storm-react-diagrams"
import {TaskNodeModel, TaskNodeFactory, TaskLinkFactory} from "./TaskNodeModel"
import {Graph, debounce} from '../algorithms'
import * as _ from "lodash"
import * as S from 'semantic-ui-react'
import {compileReq} from "../Requests"
import {evalJLang} from "../Interpreter"
import {clReq} from '../Requests'
import * as T from '../Types'

type Props = {
      nodes: NodeInfo[]
    , refreshBundle: () => void
    , doSave: (codalang: T.CodaLang) => void
    , report: (e: T.Info) => void
};

type State = {
    compiled: T.CompileResult
    loading: boolean
    running: boolean
    locked: boolean
}

type UnfilledPort = T.JObject<"unfilled", {portname: string, nodename: string}>
type CircleErr = T.JObject<"circle", {nodeids: string[]}>
type EmptyGraph = T.JObject<"empty", {}>

export class Canvas extends React.Component<Props, State>{
    engine: SRD.DiagramEngine;
    model: SRD.DiagramModel
    refreshBundle: () => void
    // refresh: () => void;
    constructor(props: Props){
        super(props);
        this.state = {loading: false, running: false, locked: false, compiled: {codalang: null, jlang: null}};
        this.engine = new SRD.DiagramEngine();
        this.engine.installDefaultFactories();
        this.engine.registerNodeFactory(new TaskNodeFactory());
        this.engine.registerLinkFactory(new TaskLinkFactory());
        let model = new SRD.DiagramModel();
        this.model = model
        this.engine.setDiagramModel(model);

        // refresh bundlelist after submitting request
        this.refreshBundle = debounce(this.props.refreshBundle, 2000)
    }

    refresh = () => {
        this.forceUpdate()
        this.setState((prev) => Object.assign(prev, {compiled: {codalang: null, jlang: null}}))
    }

    serializeTaskGraph(): T.CodaGraph{
        let g = this.model.serializeDiagram()
        let graphModel = new Graph()
        let {links, nodes} = g
        let linkDic : {[linkid: string]: {nodeid: string, portid: string}} = {} //linkid to source [nodeid, portid]
        for(let l of links){
            linkDic[l.id] = {nodeid: l.source, portid: l.sourcePort}
            graphModel.addEdge(l.source, l.target)
        }
        let portIdToName: {[portid: string]: string} = {}
        type ArgDic = {[arg: string]: string} //argumentname to linkid
        let processedNodes: {[nodeid: string]: ToolNodeInterface<string>} = {}
        let uniqName: Map<string, number> = new Map()
        let argNodeDict: T.TypeDict = null
        for(let n of nodes){
            let {id, ports} = n
            let extras = n.extras as T.ToolModelExtra
            let name: string
            const taskbody = extras.task.taskbody
            graphModel.addNode(id)

            name = (n as any).name.replace(/\W/g, '')
            
            // argument node
            if (extras.nodeType == "argument"){
                argNodeDict = extras.task.taskbody
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
            for (let p of ports){
                let portname = (p as any).label
                portIdToName[p.id] = portname
                if((p as any).in){
                    if (p.links.length !== 1){ 
                        const error: UnfilledPort = {
                            type: "unfilled",
                            content: {nodename: (n as any).name, portname: portname}
                        }
                        throw (error)
                    } 
                    let link = p.links[0]
                    argDic[portname] = link
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
                let toToolPort: (linkid: string) => ToolPort = (linkid) => {
                    const {nodeid} = linkDic[linkid]
                    const sourcenode = processedNodes[nodeid]
                    const nodeobj = {nodeid, nodename: sourcenode.name, label: portIdToName[linkDic[linkid].portid]}
                    return {type: sourcenode.nodeType, content: nodeobj}
                }
                return ({...n, arguments: _.mapValues(n.arguments, toToolPort)})
            })
        return ({args: argNodeDict, body: _.map(sortedOrder, k => tools[k])})
    }

    lockModel = () => {
        this.setState(p => Object.assign(p, {locked: true}))
    }
    unlockModel = () => {
        this.setState(p => Object.assign(p, {locked: false}))
    }

    compile(){
        try {
            const nodes = this.serializeTaskGraph()
            if (nodes.body.length == 0){
                const e: EmptyGraph = {type: "empty", content: {}}
                throw e
            }
            this.setState(p => ({...p, loading: true, compiled: {codalang: null, jlang: null}, locked: true}))
            compileReq(nodes)
            .then((res) => {
                this.setState(p => ({...p, compiled: res, loading: false}))
            })
            .then(() => this.props.report({type: "positive", header: "Build Sucess", body: <p/>}))
            .catch(e => this.props.report(e))    
        } catch (error) {
            const einfo: UnfilledPort | CircleErr | EmptyGraph = error
            let info: T.Info
            switch (einfo.type){
                case "unfilled":
                    info = {
                          type: "error"
                        , header: "Unfilled Input Port"
                        , body: <p>Port <b>{einfo.content.portname}</b> is empty in node <b>{einfo.content.nodename}</b></p>
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
                    info = {type: "error",  header: "Error", body: <p>{JSON.stringify(einfo)}</p>}
            }
            this.props.report(info)
        }
    }

    reqAndRefresh(worksheet: string, command: string): Promise<string>{
        let req = clReq(worksheet, command)
        req.then(this.refreshBundle)
        return req
    }

    run(){
        const {jlang} =  this.state.compiled
        this.setState(prev => Object.assign(prev, {running: true}))
        if (jlang){
            evalJLang(jlang, this.reqAndRefresh.bind(this))
            .then(console.log).then(()=>{this.setState(prev => Object.assign(prev, {running: false}))})
        }
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
        model.setZoomLevel(this.model.getZoomLevel() * factor)
        this.forceUpdate()
    }


    processDrop: React.DragEventHandler = (event) => {
        event.preventDefault()
        let data = event.dataTransfer.getData(taskTag);
        // console.log(data)
        let dragged: TaskDragType;
        try {
                dragged = JSON.parse(data);
            } catch (e) {return}
        const pos = this.engine.getRelativeMousePoint(event)
        let node : NodeInfo = {pos, name: dragged.name, taskinfo: dragged.taskinfo, nodeType: dragged.nodetype}
        this.newNode(node)
        // console.log(node)
    }

    newNode = (node: NodeInfo) => {
        this.engine.getDiagramModel().addNode(new TaskNodeModel(node, this.refresh, this.lockModel, this.unlockModel, this.newNode, this.props.report))
        this.refresh()
    }

    render(){
        const model = this.engine.getDiagramModel()
        const nodes = model.nodes as {[s: string]: TaskNodeModel}
        let hasarg: boolean = false
        for(const n in nodes){
            if (nodes[n].nodeType == "argument"){
                hasarg = true
                break
            }
        }

        const dropDown = (
            <S.Dropdown item icon='plus' simple>
                <S.Dropdown.Menu>
                    <S.Dropdown.Item style={{cursor: "grab"}} draggable onDragStart={this.dragStart}>
                        <S.Icon name="code"/>Empty Tool
                    </S.Dropdown.Item>
                    <S.Dropdown.Item style={{cursor: "grab"}} disabled={hasarg} draggable onDragStart={this.dragArgumentStart}>
                        <S.Icon name="ellipsis vertical"/>Argument Node
                    </S.Dropdown.Item>
                </S.Dropdown.Menu>
            </S.Dropdown>
        )

        const {running, compiled, locked} = this.state
        model.setLocked(locked)
        const {jlang, codalang} = compiled

        return(
            <div style={{height: "100%"}}>
                <S.Menu style={{marginBottom: "0px", paddingBottom: "4px", borderRadius: "0px", paddingTop: "5px"}}>
                    <S.Menu.Menu position='right'>
                    
                        <S.ButtonGroup style={{marginRight: "10px"}}>
                            <S.Button icon="zoom in" basic color="blue" onClick={() => this.zoom(1.25)}/>
                            <S.Button icon="zoom out" basic color="blue" onClick={() => this.zoom(0.8)}/>
                            <S.Popup content='Zoom to Fit' trigger = {
                                <S.Button icon="compress" basic color="blue" onClick={() => this.engine.zoomToFit()}/>
                            }/>
                        </S.ButtonGroup>

                        <S.ButtonGroup>
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
                                    onClick={() => this.props.doSave(codalang)}
                                />}
                            />
                            <S.Popup content={locked? "Unlock Canvas": "Lock Canvas"} trigger = 
                                {<S.Button 
                                    basic
                                    color={locked? 'red' : 'blue'}
                                    icon={locked? "lock open" : "lock"}
                                    onClick={() => this.setState(p => ({...p, locked: !p.locked}))}
                                />}
                            />
                        </S.ButtonGroup>

                        {dropDown}
                    </S.Menu.Menu>

                </S.Menu>
                <S.Segment attached='bottom' className="canvas-segment">
                    <div
                        style={{height: "100%"}}
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
                                // maxNumberPointsPerLink={0}
                            />
                        </div>
                    </div>
                </S.Segment>
            </div>
        )
    }
}