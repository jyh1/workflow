import { 
      DefaultPortModel
    , DefaultNodeModel
    , DiagramEngine
    , Toolkit
    , AbstractNodeFactory
    , BaseWidget
    , BaseWidgetProps
    , NodeModel
    , DefaultLinkFactory
    , DefaultLinkModel
	, DefaultLinkWidget
    } from "storm-react-diagrams";
import * as React from "react";
import * as _ from "lodash";
import {NodeInfo, TaskBody, Task} from "../Types"
import * as T from "../Types"
import {Button, Icon, Divider, Dimmer, Loader} from 'semantic-ui-react'
// import {taskReq} from "../MockRequests"
import {taskReq, parseReq} from "../Requests"

export class TaskNodeModel extends DefaultNodeModel {
    extras : T.ToolModelExtra
    inports : TaskPortModel[]
	outports: TaskPortModel[]
	loading: boolean
	refresh: () => void
    constructor(node: NodeInfo, refresh: () => void){
        super(node.name);
		[this.x, this.y] = [node.pos.x, node.pos.y];
		this.inports = []
		this.outports = []
		this.loading = true
		let taskreq: Promise<Task>

		if(node.taskinfo.type == "taskid"){
			taskreq = taskReq(node.taskinfo.content)
		}
		if(node.taskinfo.type == "codaval"){
			taskreq = parseReq(node.taskinfo.content)
		}

		taskreq.then((task) => {
			this.inports = _.map(task.inports, (val) => this.addPort(new TaskPortModel(true, Toolkit.UID(), val)));
			this.outports = _.map(task.outports, (val) => this.addPort(new TaskPortModel(false, Toolkit.UID(), val)));
			this.loading = false;
			this.extras = {taskbody: task.taskbody, taskid: task.taskid}
			refresh()
		})

		this.refresh = refresh;
	}
	removeAndRefresh(){
		this.remove()
		this.refresh()
	}
}


export class TaskNodeFactory extends AbstractNodeFactory<DefaultNodeModel> {
	constructor() {
		super("default");
	}

	generateReactWidget(diagramEngine: DiagramEngine, node: TaskNodeModel): JSX.Element {
		return React.createElement(TaskNodeWidget, {
			node: node,
			diagramEngine: diagramEngine
		});
	}

	getNewInstance(initialConfig?: any): DefaultNodeModel {
		return new DefaultNodeModel();
	}
}

// widget
export interface TaskNodeProps extends BaseWidgetProps {
	node: TaskNodeModel;
	diagramEngine: DiagramEngine;
}

export class TaskNodeWidget extends BaseWidget<TaskNodeProps, {}> {
	constructor(props: TaskNodeProps) {
		super("srd-default-node", props);
		this.state = {};
	}

	generatePort(port: TaskPortModel) {
		return ( <TaskPortWidget model={port} key={port.id} />)
	}

	render() {
		return (
            <div className={"toolForm toolFormInCanvas " + (this.props.node.selected ? "toolForm-active" : "")}>
				{/* title */}
				<Dimmer active={this.props.node.loading} inverted>
					<Loader inverted content='Loading' />
				</Dimmer>
                <div className={"toolFormTitle"}>
					<Button.Group basic size="small" style={{float: "right"}}>
						<Button icon='close' style={{padding: "0"}}  onClick={()=>this.props.node.removeAndRefresh()}/>
					</Button.Group>
                    <i className={"code icon"}/>
                    <span>{this.props.node.name}</span>
                </div>
                {/* inputs */}
                <div>
                    <div className={"toolFormBody"}>
                        {_.map(this.props.node.getInPorts(), this.generatePort.bind(this))}
                    </div>
                </div>
                {/* divider */}
                <Divider />
                {/* outputs */}
                <div>
                    <div className={"toolFormBody"}>
                        {_.map(this.props.node.getOutPorts(), this.generatePort.bind(this))}
                    </div>
                </div>
            </div>
		);
	}
}

// port widget 
export interface TaskPortWidgetProps extends BaseWidgetProps {
	model: TaskPortModel;
}
export class TaskPortWidget extends BaseWidget<TaskPortWidgetProps, {}> {
	constructor(props: TaskPortWidgetProps) {
		super("task-port", props);
	}

	getClassName() {
		return "form-row";
	}

	render() {
		let terminal = 
			<TaskTerminalWidget 
				input={this.props.model.in} 
				node={this.props.model.getParent() as TaskNodeModel} 
				name={this.props.model.name} 
				port={this.props.model}
			/>;
        let label = this.props.model.label;
		return (
			<div {...this.getProps()}>
				{terminal}
				<div className={this.props.model.in? "" : "outport-label"}>{label}</div>
			</div>
		);
	}
}

// terminal
export interface TaskTerminalProps extends BaseWidgetProps {
	name: string;
    node: TaskNodeModel;
	input: boolean;
	port: TaskPortModel;
}

export class TaskTerminalWidget extends BaseWidget<TaskTerminalProps, {selected: boolean}> {
	constructor(props: TaskTerminalProps) {
		super("srd-port", props);
		this.state = {
			selected: false
		};
	}

	getClassName() {
		let hasLink = Object.keys(this.props.port.links).length > 0
		let terminal;
		if (this.props.input){
			terminal = "input"
			if (hasLink && this.state.selected) {terminal = "delete"}
		} else { terminal = "output" }
		return "port " + terminal + "-terminal";        
	}
	removeLinks(){
		if (this.props.input) {
			let port = this.props.port
			let hasLink = Object.keys(port.links).length > 0
			if (hasLink){
				_.mapValues(port.links, (l) => l.remove())
				this.props.node.refresh()	
			}
		}
	}

	render() {
        let icon = React.createElement("icon");
		return (
			<div
				{...this.getProps()}
				onMouseEnter={() => {
					this.setState({ selected: true });
				}}
				onMouseLeave={() => {
					this.setState({ selected: false });
				}}
				data-name={this.props.name}
				data-nodeid={this.props.node.getID()}
				onClick={this.removeLinks.bind(this)}
			>
                {icon}
            </div>
		);
	}
}


// task link factory
export class TaskLinkModel extends DefaultLinkModel {
	constructor() {
        super("default");
        this.color = "rgba(1, 89, 140, 0.5)"
		// this.width = 10;
	}
}

export class TaskPortModel extends DefaultPortModel {
	createLinkModel(): TaskLinkModel | null {
		return new TaskLinkModel();
	}
	canLinkToPort(port: DefaultPortModel): boolean{
		if (this.in || !port.in) {return false}
		if (Object.keys(port.links).length > 1) {return false}
		if (port.getParent() == this.getParent()) {return false}
		(this.getParent() as TaskNodeModel).refresh()
		return true;
	}
}

export class TaskLinkFactory extends DefaultLinkFactory {
	constructor() {
		super();
	}

	getNewInstance(initialConfig?: object): TaskLinkModel {
		return new TaskLinkModel();
	}

	// generateLinkSegment(model: TaskLinkModel, widget: DefaultLinkWidget, selected: boolean, path: string) {
	// 	return (
	// 		<g>
	// 			<TaskLinkSegment model={model} path={path} />
	// 		</g>
	// 	);
	// }
}

// interface TaskLinkSegmentProps { model: TaskLinkModel; path: string }

// export class TaskLinkSegment extends React.Component<TaskLinkSegmentProps> {
// 	path: SVGPathElement;
// 	circle: SVGCircleElement;
// 	callback: () => any;
// 	percent: number;
// 	handle: any;
// 	mounted: boolean;

// 	constructor(props: TaskLinkSegmentProps) {
// 		super(props);
// 		this.percent = 0;
// 	}

// 	render() {
// 		return (
// 			<>
// 				<path
// 					ref={ref => {
// 						this.path = ref;
// 					}}
// 					strokeWidth={this.props.model.width}
// 					stroke="rgba(255,0,0,0.5)"
// 					d={this.props.path}
// 				/>
// 			</>
// 		);
// 	}
// }
