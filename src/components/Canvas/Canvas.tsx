import {Node, taskTag, TaskDragType, ToolPort, ToolNode, ToolNodeInterface} from "../Types"
import * as React from "react"
import * as SRD from "storm-react-diagrams"
import {TaskNodeModel, TaskNodeFactory, TaskLinkFactory} from "./TaskNodeModel"
import {Graph} from '../algorithms'
import * as _ from "lodash"

type Props = {
      nodes: Node[]
};

export class Canvas extends React.Component<Props, {}>{
    engine: SRD.DiagramEngine;
    refresh: () => void;

    constructor(props: Props){
        super(props);
        this.state = {};
        this.engine = new SRD.DiagramEngine();
        this.engine.installDefaultFactories();
        this.engine.registerNodeFactory(new TaskNodeFactory());
        this.engine.registerLinkFactory(new TaskLinkFactory());
        let model = new SRD.DiagramModel();
        this.refresh = this.forceUpdate.bind(this)
        let nodes = _.map(
            this.props.nodes,
            (val) => {
                return (new TaskNodeModel(val, this.refresh))
            })
        model.addAll(... nodes);
        this.engine.setDiagramModel(model);
    }

    serializeTaskGraph(){
        let g = this.engine.getDiagramModel().serializeDiagram()
        let graphModel = new Graph()
        let {links, nodes} = g
        let linkDic : {[linkid: string]: {taskid: string, portid: string}} = {} //linkid to source [taskid, portid]
        for(let l of links){
            linkDic[l.id] = {taskid: l.source, portid: l.sourcePort}
            graphModel.addEdge(l.source, l.target)
        }
        let portIdToName: {[portid: string]: string} = {}
        type ArgDic = {[arg: string]: string} //argumentname to linkid
        let processedNodes: {[nodeid: string]: ToolNodeInterface<string>} = {}
        for(let n of nodes){
            let {id, ports, extras} = n
            graphModel.addNode(id)
            let name: string = (n as any).name
            let taskid = extras.taskid as string
            let argDic: ArgDic = {} // portname to linkid
            for (let p of ports){
                let portname = (p as any).label
                portIdToName[p.id] = portname
                if((p as any).in){
                    // if (p.links.length !== 1){ throw "unfilled argument"} //TODO: use a error class
                    if (p.links.length !== 1){ continue} //TODO: use a error class
                    let link = p.links[0]
                    argDic[portname] = link
                }
            }
            processedNodes[id]= {id, taskid, arguments: argDic, name}
        }
        let sortedOrder = graphModel.topoSort()
        // console.log(processedNodes)
        let tools = _.mapValues(processedNodes, (n) => {
                let toToolPort: (linkid: string) => ToolPort = (linkid) => (
                    {taskid: linkDic[linkid].taskid, label: portIdToName[linkDic[linkid].portid]}
                )
                return ({...n, arguments: _.mapValues(n.arguments, toToolPort)})
            })
        return (_.map(sortedOrder, k => tools[k]))
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
        this.engine.getDiagramModel().addNode(new TaskNodeModel(node, this.refresh))
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