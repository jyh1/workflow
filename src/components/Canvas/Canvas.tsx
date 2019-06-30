import {Node} from "../Types"
import * as React from "react"
import * as SRD from "storm-react-diagrams"
import * as _ from "lodash"

type Graph = {nodes: Node[]};

export class Canvas extends React.Component<Graph, {}>{
    engine: SRD.DiagramEngine;

    constructor(props: Graph){
        super(props);
        this.state = {};
        this.engine = new SRD.DiagramEngine();
        this.engine.installDefaultFactories();
        let model = new SRD.DiagramModel();
        let nodes = _.map(
            this.props.nodes,
            (val) => {
                let node = new SRD.DefaultNodeModel(val.name, "rgb(0,192,255)");
                node.setPosition(val.pos.x, val.pos.y);
                return (node)
            })
        model.addAll(... nodes);
        this.engine.setDiagramModel(model);
    }
    render(){
        return(
            <SRD.DiagramWidget className="srd-demo-canvas" diagramEngine={this.engine} />
        )
    }
}