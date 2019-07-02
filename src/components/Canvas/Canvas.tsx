import {Node} from "../Types"
import * as React from "react"
import * as SRD from "storm-react-diagrams"
import {TaskNodeModel, TaskNodeFactory, TaskLinkFactory} from "./TaskNodeModel"
import * as _ from "lodash"

type Props = {
      nodes: Node[]
};

export class Canvas extends React.Component<Props, {}>{
    engine: SRD.DiagramEngine;

    constructor(props: Props){
        super(props);
        this.state = {};
        this.engine = new SRD.DiagramEngine();
        this.engine.installDefaultFactories();
        this.engine.registerNodeFactory(new TaskNodeFactory());
        this.engine.registerLinkFactory(new TaskLinkFactory());
        let model = new SRD.DiagramModel();
        let nodes = _.map(
            this.props.nodes,
            (val) => {
                return (new TaskNodeModel(val, this.forceUpdate.bind(this)))
            })
        model.addAll(... nodes);
        this.engine.setDiagramModel(model);
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
                <div className = "srd-demo-workspace__content">
                    <SRD.DiagramWidget 
                        className="srd-demo-canvas" 
                        allowLooseLinks={false} 
                        diagramEngine={this.engine} 
                        // maxNumberPointsPerLink={0}
                    />
                </div>
            </div>
        )
    }
}