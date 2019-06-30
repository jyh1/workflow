import { DefaultPortModel,  DefaultNodeModel, DiagramEngine, Toolkit} from "storm-react-diagrams";
import * as _ from "lodash";
import {Node} from "../Types"

type TaskPortModel = DefaultPortModel;

export class TaskNodeModel extends DefaultNodeModel {
    extras : {taskid: string}
    inports : TaskPortModel[]
    outports: TaskPortModel[]
    constructor(node: Node){
        super(node.name);
        [this.x, this.y] = [node.pos.x, node.pos.y];
        this.extras = {
            taskid: node.taskid
        }
        this.inports = _.map(
            Object.keys(node.inports),
            (val) => this.addInPort(val)
        );
        this.inports = _.map(
            Object.keys(node.outports),
            (val) => this.addOutPort(val)
        );
        
    }
}
