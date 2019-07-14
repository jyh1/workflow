import {Node, taskTag, TaskDragType, Task} from "../Types"
import * as React from "react"
import * as SRD from "storm-react-diagrams"
import {TaskNodeModel, TaskNodeFactory, TaskLinkFactory} from "./TaskNodeModel"
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
                            console.log(this.engine.getDiagramModel().serializeDiagram());
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