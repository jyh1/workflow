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
	, DefaultLinkWidget,
	LinkModel,
	PortModel,
	DiagramModel
    } from "storm-react-diagrams";
import * as React from "react";
import * as _ from "lodash";
import {NodeInfo, TaskBody, Task} from "../Types"
import * as T from "../Types"
import {Button, Input, Divider, Dimmer, Loader, Popup, Icon} from 'semantic-ui-react'
// import {taskReq} from "../MockRequests"
import {taskReq, parseReq, toolGraphReq} from "../Requests"
import {CodaEditor} from './Editor'

type AddLink = (old: TaskPortModel) => TaskLinkModel
export type OldLinks = {[port: string]: AddLink[]}

export class TaskNodeModel extends DefaultNodeModel {
    extras : T.ToolNodeExtra
	loading: boolean
	toggleEditor: boolean
	refresh: () => void
	error: (e: T.Info) => void
	newNode: (node: NodeInfo, oldlinks?: OldLinks) => TaskNodeModel
	nodeType: T.NodeType
	oldlinks: OldLinks
	intialize: Promise<void>
    constructor(
		  node: NodeInfo
		, refresh: () => void
		, newNode: (node: NodeInfo, oldlinks?: OldLinks) => TaskNodeModel
		, error: (e: T.Info) => void
		, parent: DiagramModel
		, oldlinks: OldLinks
	){
		super(node.name);
		[this.x, this.y] = [node.pos.x, node.pos.y];
		this.loading = true
		let taskreq: Promise<Task>
		this.oldlinks = oldlinks? oldlinks : {}
		this.setParent(parent)

		this.refresh = refresh;
		this.error = error;
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
			this.lockNode()
			this.toggleEditor = true
			taskreq = Promise.resolve({taskbody: {}, inports: {}, outports: {}, taskcode: ""})
		}

		this.intialize = this.loadTask(taskreq)
		this.intialize.then(this.refresh)
	}
	removeAndRefresh(){
		this.remove()
		this.refresh()
	}

	loadTask(taskreq: Promise<Task>){
		return taskreq.then((task) => {
			_.map(task.inports, (ty, pname) => this.addPort(new TaskPortModel(true, Toolkit.UID(), pname, ty)));
			_.map(task.outports, (ty, pname) => this.addPort(new TaskPortModel(false, Toolkit.UID(), pname, ty)));
			this.loading = false;
			this.extras = {task: task, nodeType: this.nodeType}
			this.refresh()
			// setTimeout(() => {this.addOldLinks();this.refresh()}, 1000)
			this.addOldLinks()
		})
	}

	addOldLinks(){
		const model = this.getParent()
		_.map(this.getPorts(), 
			(port: TaskPortModel) => {
				const key = [port.in, port.label, port.codatype].toString()
				if (key in this.oldlinks){
					_.forEach(this.oldlinks[key], f => model.addLink(f(port)))
				}
			}
		)
	}

	collectLinks(isin: boolean){
		const ports: TaskPortModel[] = 
			_.filter(this.getPorts(), (p: TaskPortModel) => (p.in == isin)) as TaskPortModel[]
		_.forEach(ports, 
			port => {
				const targets = _.map(port.getLinks(), 
										(l) => {
											const ts = (isin? p => (l.sourcePort as TaskPortModel).link(p) : p => p.link(l.targetPort)) as AddLink
											return ts
										})
				this.oldlinks[[port.in, port.label, port.codatype].toString()] = targets
			}
		)
	}

	updateTask(task: Task){
		const node: NodeInfo = {name: this.name, pos: {x: this.x, y: this.y}, taskinfo: {type: "task", content: task}, nodeType: this.nodeType}
		this.oldlinks = {}
		this.collectLinks(true)
		this.collectLinks(false)
		this.newNode(node, this.oldlinks)
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
        this.refresh()
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
	closeEditor = () => {
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

	expandable(){
		try{
			const taskid = this.props.node.extras.task.taskid
			return !(taskid === undefined || taskid === null)
		}
		catch{
			return false
		}
	}
	
	async expandNode(){
		const {node} = this.props
		const taskid = node.extras.task.taskid
		if (!this.expandable()){
			return
		}
		const {tools, portidmap, links} = await toolGraphReq(taskid)
		const [x0, y0] = [node.x, node.y]
		let oldIdToPort: {[oldid: string]: DefaultPortModel} = {}
		for(const tool of tools){
			const {name, pos, oldid, toolinfo} = tool
			const newnode = node.newNode(
				{
					  taskinfo: {type: "task", content: toolinfo.task}
					, name
					, pos: {x: x0 + pos.x, y: y0 + pos.y}
					, nodeType: toolinfo.nodeType
				})
			await newnode.intialize
			_.forEach(newnode.getPorts(), (p: DefaultPortModel) => {
				const key = [oldid, p.in, p.label].toString()
				oldIdToPort[portidmap[key]] = p
			})
		}
		const model = node.getParent()
		for (const {from, to} of links){
			model.addLink( oldIdToPort[from].link(oldIdToPort[to]) )
		}
		node.removeAndRefresh()
	}

	render() {
		const inports = this.props.node.getInPorts()
		const outports = this.props.node.getOutPorts()
		const node = this.props.node
		const isargument = node.nodeType == "argument"
		const nodename = node.name
		const expandable = this.expandable()
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
							{expandable ? <Button icon='window restore outline' style={{padding: "3px"}} onClick={this.expandNode.bind(this)} /> : <React.Fragment/>}
							<Button icon='times' style={{padding: "3px"}}  onClick={()=>node.removeAndRefresh()}/>
						</Button.Group>
						<i className={isargument? "ellipsis vertical icon" : "code icon"}/>
						{header}
					</div>
									{/* modal */}
					{node.toggleEditor && node.extras.task? 
						<CodaEditor 
							name={node.name}
							close={this.closeEditor}
							save={(task) => {node.updateTask(task)}}
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
		const model = this.props.model
        const label = model.label;
		return (
			<div {...this.getProps()}>
				{terminal}
				<div className={this.props.model.in? "" : "outport-label"}>
					{label}
					{this.props.model.in? 
						<React.Fragment/> : 
						<Icon 
							onClick={() => {model.selected = !model.selected; this.forceUpdate()} } 
							color={model.selected ? "blue": null} 
							name="asterisk"
							size="small"
						/>
					}
				</div>
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
	codatype: T.CodaType
	selected: boolean
	constructor(isin: boolean, id: string, name: string, codatype: T.CodaType){
		super(isin, id, name)
		this.codatype = codatype
		this.selected = false
	}
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
	serialize(){
		const portnode = super.serialize()
		type TaskPort = typeof portnode & {codatype: T.CodaType, selected: boolean}
		const tport: TaskPort = {...portnode, codatype: this.codatype, selected: this.selected}
		return tport
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
