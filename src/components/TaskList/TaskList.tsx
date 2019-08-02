import {taskTag, TaskElement, TaskId, TaskListElement, TaskDragType} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {List, Breadcrumb, Header, Dimmer, Loader, SegmentGroup, Segment} from 'semantic-ui-react'
import {taskListReq} from "../MockRequests"
// import {taskListReq} from "../Requests"

type Path = {name: string, id: string}[]
type CD = (dir: Path) => void
type Props = {
      name: string
    , children: TaskElement[]
    , description: string
    , current: Path
    , id: string
    , cd: CD
    , parentPath: Path
    }

function currentid(path: Path){
    if (path.length == 0){
        return null
    }
    return path[path.length - 1].id
}

export class TaskFolderWidget extends React.Component<Props, {expand: boolean}>{
    path: Path
    constructor(props: Props){
        super(props)
        this.state = {expand: false}
        this.path = this.props.parentPath.concat({id: this.props.id, name: this.props.name})
    }
    
    toggle = () => {
        const {id, current} = this.props
        const selected = currentid(current) == id
        const expand = this.state.expand
        if (expand && !selected){
            this.props.cd(this.path)
            return
        }
        if (expand && selected){
            this.setState((prevState) => ({...prevState, expand: false}))
            this.props.cd([])
            return
        }
        this.setState((prevState) => ({...prevState, expand: !prevState.expand}))
        this.props.cd(this.path)
    }

    render(){
        const {expand} = this.state
        const {children, current, cd, description, id, name} = this.props
        const selected = currentid(current) == id
        return (
            <List.Item>
                <List.Icon className="folder-elem" onClick = {this.toggle} name={expand ? 'folder open outline' : 'folder outline'}/>
                <List.Content onClick = {this.toggle} className={"folder-elem" + (selected? "-selected" : "")}>
                    <List.Header >{name}</List.Header>
                    <List.Description>{description}</List.Description>
                </List.Content>
                <List.List className={"ui relaxed divided"} style = {{display: (expand? "block" : "none")}}>
                    {...renderTaskElementList(children, current, cd, this.path)}
                </List.List>

            </List.Item>
        )
    }
}

type TaskProps = {name: string, taskid: string, description: string}
export class TaskWidget extends React.Component<TaskProps, {}>{
    constructor(props: TaskProps){
        super(props)
    }

    dragStart: React.DragEventHandler = (event) => {
        // console.log(this.props.element)
        let dragData : TaskDragType = {taskinfo: {type: "taskid", content: this.props.taskid}, name: this.props.name}
        event.dataTransfer.setData(taskTag, JSON.stringify(dragData)); 
    }

    render(){
        return(
            <List.Item draggable={true} className="file-elem" onDragStart={this.dragStart}>
                <List.Icon name="code"/>
                <List.Content>
                    <List.Header>{this.props.name}</List.Header>
                    <List.Description>{this.props.description}</List.Description>
                </List.Content>
            </List.Item>
        )
    }
}

type TaskListState = {tasks: TaskElement[], loading: boolean, current?: Path}
export class TaskElementListWidget extends React.Component<{}, TaskListState>{
    constructor(props: {}){
        super(props)
        this.state = {tasks: [], loading: true, current: []}
    }
    cd = (dir: Path) => {
        this.setState(p => Object.assign(p, {current: dir}))
    }
    render(){
        const eles = this.state.tasks
        const {current} = this.state
        const length = current.length
        const breadcrumb = length == 0? 
            (<Breadcrumb.Divider>/</Breadcrumb.Divider>) :
            (_.map(current, (p, index) => 
                <React.Fragment key={p.id}>
                    <Breadcrumb.Divider>/</Breadcrumb.Divider>
                    <Breadcrumb.Section onClick={() => this.cd(current.slice(0, index + 1))} link={index != length - 1} active={index == length - 1}>
                        {p.name}
                    </Breadcrumb.Section>
                </React.Fragment>
            ))
        return(
            <Segment>
                <Header color='blue' as="h2">Tools</Header>
                <Breadcrumb className="panel">
                    {breadcrumb}
                </Breadcrumb>
                <List divided relaxed>
                    <Dimmer active={this.state.loading} inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                    {...renderTaskElementList(eles, this.state.current, this.cd, [])}
                </List>
            </Segment>
        )
    }
    componentDidMount(){
        taskListReq().then((e) => {
            // console.log(e); 
            this.setState((prev)=> Object.assign(prev, {tasks: this.toTaskElement(e), loading: false}))
        })
    }
    toTaskElement(eles: TaskListElement[]):TaskElement[]{
        type FolderRep = {name?: string, id?: string, children: TaskRep[]}
        type TaskRep = TaskElement | FolderRep
        let dic : {[key: string]: FolderRep} = {}
        let taskArray : TaskElement[] = []
        for(let e of eles){
            let rep : TaskRep
            if('taskid' in e){
                let task: TaskElement = {name: e.name, id: e.id, taskid: e.taskid, description: e.description}
                rep = task
            } else {
                // file object
                if(dic[e.id]){
                    dic[e.id] = Object.assign(dic[e.id], {name: e.name, id: e.id, description: e.description})
                } else {
                    let newEle : TaskElement = {name: e.name, id: e.id, children: [], description: e.description}  
                    dic[e.id] = newEle
                }
                rep = dic[e.id]
            }
            if(e.parent){
                // dic[e.parent]? dic[e.parent].children.push(rep) : {children: [rep]}
                if (dic[e.parent]){dic[e.parent].children.push(rep)} 
                    else {dic[e.parent] = {children: [rep]}}
            } else {
                // top level
                taskArray.push(rep as TaskElement)
            }
        }
        return taskArray
    }
}

function renderTaskElementList(eles: readonly TaskElement[], current: Path, cd: CD, parentPath: Path ):JSX.Element[]{
    return(_.map(eles, (t) => <TaskElementWidget element={t} key={t.id} current={current} cd={cd} parentPath={parentPath}></TaskElementWidget>))
}

type TaskElementProps = {element: TaskElement, current: Path, cd: CD, parentPath: Path}
export class TaskElementWidget extends React.Component<TaskElementProps, {}>{
    constructor(props: TaskElementProps){
        super(props)
    }
    render(){
        let {element, current, cd, parentPath} = this.props;
        if ("children" in element){
            return(<TaskFolderWidget {...element} current={current} cd={cd} parentPath={parentPath}></TaskFolderWidget>)
        } 
        else {
            return(<TaskWidget {...element}></TaskWidget>)
        }
    }
}