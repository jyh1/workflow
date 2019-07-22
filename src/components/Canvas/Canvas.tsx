import {Node, taskTag, TaskDragType, ToolPort, ToolNode, ToolNodeInterface, JLang} from "../Types"
import * as React from "react"
import * as SRD from "storm-react-diagrams"
import {TaskNodeModel, TaskNodeFactory, TaskLinkFactory} from "./TaskNodeModel"
import {Graph} from '../algorithms'
import * as _ from "lodash"
import * as S from 'semantic-ui-react'
import {compileReq} from "../Requests"
import {evalJLang} from "../Interpreter"
import { object } from "prop-types";

type Props = {
      nodes: Node[]
};

type State = {
    compiled?: JLang
    loading: boolean
    running: boolean
}

export class Canvas extends React.Component<Props, State>{
    engine: SRD.DiagramEngine;
    model: SRD.DiagramModel
    // refresh: () => void;
    constructor(props: Props){
        super(props);
        this.state = {loading: false, running: false};
        this.engine = new SRD.DiagramEngine();
        this.engine.installDefaultFactories();
        this.engine.registerNodeFactory(new TaskNodeFactory());
        this.engine.registerLinkFactory(new TaskLinkFactory());
        let model = new SRD.DiagramModel();
        this.model = model
        let nodes = _.map(
            this.props.nodes,
            (val) => {
                return (new TaskNodeModel(val, this.refresh.bind(this)))
            })
        model.addAll(... nodes);
        this.engine.setDiagramModel(model);
    }

    refresh(){
        this.forceUpdate()
        this.setState((prev) => Object.assign(prev, {compiled: undefined}))
    }

    serializeTaskGraph(): ToolNode[]{
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
        for(let n of nodes){
            let {id, ports, extras} = n
            graphModel.addNode(id)
            let name: string = (n as any).name
            if (uniqName.has(name)){
                const count = uniqName.get(name)
                uniqName.set(name, count + 1)
                name = name + '-' + count
            } else {
                uniqName.set(name, 0)
            }
            let taskid = extras.taskid as string
            let argDic: ArgDic = {} // portname to linkid
            for (let p of ports){
                let portname = (p as any).label
                portIdToName[p.id] = portname
                if((p as any).in){
                    if (p.links.length !== 1){ throw "unfilled argument"} //TODO: use a error class
                    if (p.links.length !== 1){ continue} //TODO: use a error class
                    let link = p.links[0]
                    argDic[portname] = link
                }
            }
            processedNodes[id]= {id, taskid, arguments: argDic, name: name}
        }
        let sortedOrder = graphModel.topoSort()
        // console.log(processedNodes)
        let tools = _.mapValues(processedNodes, (n) => {
                let toToolPort: (linkid: string) => ToolPort = (linkid) => {
                    let nodeid = linkDic[linkid].nodeid
                    return {nodeid, nodename: processedNodes[nodeid].name, label: portIdToName[linkDic[linkid].portid]}
                }
                return ({...n, arguments: _.mapValues(n.arguments, toToolPort)})
            })
        return (_.map(sortedOrder, k => tools[k]))
    }

    compile(){
        let nodes = this.serializeTaskGraph()
        this.model.setLocked(true)
        this.setState(obj => Object.assign(obj, {loading: true, compiled: undefined}))
        compileReq(nodes)
        .then((res) => {
            this.setState(obj => Object.assign(obj, {compiled: res, loading: false}))
            this.model.setLocked(false)
            console.log(res)
        } )
    }

    run(){
        let jlang =  this.state.compiled
        this.setState(prev => Object.assign(prev, {running: true}))
        if (jlang){
            evalJLang(jlang).then(console.log).then(()=>{this.setState(prev => Object.assign(prev, {running: false}))})
        }
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
        let node : Node = {pos, name: dragged.name, taskid: dragged.id}
        this.engine.getDiagramModel().addNode(new TaskNodeModel(node, this.refresh.bind(this)))
        this.refresh()
        // console.log(node)
    }

    render(){
        return(
            <div className="srd-demo-workspace">
                <div className="srd-demo-workspace__toolbar">
                    <button
                        onClick={() => {
                            // console.log(this.engine.getDiagramModel().serializeDiagram());
                            console.log(this.serializeTaskGraph());
                        }}
                    >
                        Print Graph
                    </button>
                    <S.Button primary loading={this.state.loading} onClick={this.compile.bind(this)}>
                        Compile
                    </S.Button>
                    <S.Button primary loading={this.state.running} disabled={this.state.compiled === undefined? true : false} onClick={this.run.bind(this)}>
                        Run
                    </S.Button>

                </div>
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
                            // maxNumberPointsPerLink={0}
                        />
                    </div>
                </div>
            </div>
        )
    }
}