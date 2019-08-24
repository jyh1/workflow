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
import {Button, Input, Divider, Dimmer, Loader, Popup} from 'semantic-ui-react'
// import {taskReq} from "../MockRequests"
import {taskReq, parseReq} from "../Requests"
import {CodaEditor} from './Editor'

export class TaskNodeModel extends DefaultNodeModel {
    extras : T.ToolModelExtra
    inports : TaskPortModel[]
	outports: TaskPortModel[]
	loading: boolean
	toggleEditor: boolean
	refresh: () => void
	error: (e: T.Info) => void
	lockModel: () => void
	unlockModel: () => void
	newNode: (node: NodeInfo) => void
	nodeType: T.NodeType
    constructor(node: NodeInfo, refresh: () => void, lock: () => void, unlock: () => void, newNode: (node: NodeInfo) => void, error: (e: T.Info) => void){
        super(node.name);
		[this.x, this.y] = [node.pos.x, node.pos.y];
		this.inports = []
		this.outports = []
		this.loading = true
		let taskreq: Promise<Task>

		this.refresh = refresh;
		this.error = error;
		this.lockModel = lock;
		this.unlockModel = unlock;
		this.newNode = newNode;
		this.toggleEditor = false
		this.nodeType = node.nodeType ? node.nodeType : "tool"
		if(node.taskinfo.type == "taskid"){
			taskreq = taskReq(node.taskinfo.content)
		}
		if(node.taskinfo.type == "codaval"){
			let code = node.taskinfo.content
			taskreq = parseReq(code).then(t => Object.assign(t, {"taskcode": code}))
		}
		if(node.taskinfo.type == "task"){
			taskreq = Promise.resolve(node.taskinfo.content)
		}
		if(node.taskinfo.type == "empty"){
			this.toggleEditor = true
			taskreq = Promise.resolve({taskbody: {}, inports: [], outports: [], taskcode: ""})
		}

		this.loadTask(taskreq)
	}
	removeAndRefresh(){
		this.remove()
		this.refresh()
	}

	loadTask(taskreq: Promise<Task>){
		taskreq.then((task) => {
			this.inports = _.map(task.inports, (val) => this.addPort(new TaskPortModel(true, Toolkit.UID(), val)));
			this.outports = _.map(task.outports, (val) => this.addPort(new TaskPortModel(false, Toolkit.UID(), val)));
			this.loading = false;
			this.extras = {task: task, nodeType: this.nodeType}
			this.refresh()
		})
	}
	updateTask(task: Task){
		const node: NodeInfo = {name: this.name, pos: {x: this.x, y: this.y}, taskinfo: {type: "task", content: task}, nodeType: this.nodeType}
		this.newNode(node)	
		this.removeAndRefresh()
	}
	copyTask(){
		const node: NodeInfo = {
			  name: this.name
			, pos: {x: this.x - 100, y: this.y - 100}
			, taskinfo: {type: "task", content: this.extras.task}
			, nodeType: this.nodeType
		}
		this.newNode(node)
	}
	lockNode(lock: boolean = true){
		this.setLocked(lock)
		_.mapValues(this.getPorts(), 
			p => {
				_.mapValues(p.getLinks(), v => {v.setLocked(lock)})
				p.setLocked(lock)
			}
		)
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

type TaskNodeState = {
	  editName: boolean
}
export class TaskNodeWidget extends BaseWidget<TaskNodeProps, TaskNodeState> {
	constructor(props: TaskNodeProps) {
		super("srd-default-node", props);
		this.state = {editName: false}
	}

	generatePort(port: TaskPortModel) {
		return ( <TaskPortWidget model={port} key={port.id} />)
	}

	toggleEditor(){
		if (this.props.node.toggleEditor){
			return this.closeEditor()
		}
		return this.openEditor()
	}

	openEditor(){
		this.props.node.toggleEditor = true
		this.props.node.lockNode()
		this.forceUpdate()
	}
	closeEditor(){
		this.props.node.toggleEditor = false		
		this.props.node.lockNode(false)
		this.forceUpdate()
	}

	startEditingName = () => {
        this.setState(p => Object.assign(p, {editName: true}))
    }
    stopEditingName = () => {
        this.setState(p => Object.assign(p, {editName: false}))
	}
	editName = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value
        this.props.node.name = name
    }

	render() {
		const inports = this.props.node.getInPorts()
		const outports = this.props.node.getOutPorts()
		const node = this.props.node
		const isargument = node.nodeType == "argument"
		const nodename = node.name
		const header = (this.state.editName? 
			<input onChange={this.editName} onBlur={this.stopEditingName} defaultValue={nodename}/> 
			: <div title="Double click to edit name" className="editorToolname" onDoubleClick={this.startEditingName}>{nodename}</div>)
		return (
			<React.Fragment>
				{/* task node */}
				<div className={"toolForm toolFormInCanvas " + (node.selected ? "toolForm-active" : "")}>
					{/* title */}
					<Dimmer active={node.loading} inverted>
						<Loader inverted content='Loading' />
					</Dimmer>
					<div className={"toolFormTitle" + (isargument? "_argument" : "")}>
						<Button.Group size="medium" floated="right">
							<Button icon='edit outline'  style={{padding: "3px"}} onClick={this.toggleEditor.bind(this)}/>
							<Button icon='copy outline' style={{padding: "3px"}}  onClick={() => node.copyTask()}/>
							<Button icon='times' style={{padding: "3px"}}  onClick={()=>node.removeAndRefresh()}/>
						</Button.Group>
						<i className={isargument? "ellipsis vertical icon" : "code icon"}/>
						{header}
					</div>
									{/* modal */}
					{node.toggleEditor && node.extras.task? 
						<CodaEditor 
							name={node.name}
							close={this.closeEditor.bind(this)}
							save={(task) => node.updateTask(task)}
							body={node.extras.task}
							nodeType={node.extras.nodeType}
							error={node.error}
						/> : <React.Fragment/>}
					{/* inputs */}
					<div style={{display: node.toggleEditor? "none" : "inline"}}>
						<div>
							<div className={"toolFormBody"}>
								{_.map(inports, this.generatePort.bind(this))}
							</div>
						</div>
						{/* divider */}
						{inports.length > 0 ? <Divider /> : <React.Fragment/>}
						{/* outputs */}
						<div>
							<div className={"toolFormBody"}>
								{_.map(outports, this.generatePort.bind(this))}
							</div>
						</div>
					</div>
				</div>
			</React.Fragment>
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
