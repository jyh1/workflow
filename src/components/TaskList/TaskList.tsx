import {taskTag, TaskElement, TaskId, TaskListElement, TaskDragType} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {List, Container, Header, Dimmer, Loader, SegmentGroup, Segment} from 'semantic-ui-react'
// import {taskListReq} from "../MockRequests"
import {taskListReq} from "../Requests"

type Props = {
      name: string
    , children: TaskElement[]
    , description: string
    , current?: string
    , id: string
    , cd: CD
    }

export class TaskFolderWidget extends React.Component<Props, {expand: boolean}>{
    constructor(props: Props){
        super(props)
        this.state = {expand: false}
    }

    toggle = () => {
        const selected = this.props.id == this.props.current
        const expand = this.state.expand
        if (expand && !selected){
            this.props.cd(this.props.id)
            return
        }
        this.setState((prevState) => ({...prevState, expand: !prevState.expand}))
        this.props.cd(this.props.id)
    }

    render(){
        const {expand} = this.state
        const {children, current, cd, description, id} = this.props
        const selected = current == id
        return (
            <List.Item>
                <List.Icon className="folder-elem" onClick = {this.toggle} name={expand ? 'folder open outline' : 'folder outline'}/>
                <List.Content className={"folder-elem" + (selected? "-selected" : "")}>
                    <List.Header onClick = {this.toggle} >{this.props.name}</List.Header>
                    <List.Description>{description}</List.Description>
                </List.Content>
                <List.List className={"ui relaxed divided"} style = {{display: (expand? "block" : "none")}}>
                    {...renderTaskElementList(children, current, cd)}
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

type TaskListState = {tasks: TaskElement[], loading: boolean, current?: string}
type CD = (dir: string) => void
export class TaskElementListWidget extends React.Component<{}, TaskListState>{
    constructor(props: {}){
        super(props)
        this.state = {tasks: [], loading: true}
    }
    cd = (dir: string) => {
        this.setState(p => Object.assign(p, {current: dir}))
    }
    render(){
        let eles = this.state.tasks
        return(
            <Segment>
                <Header color='blue' as="h2">Tools</Header>
                <List divided relaxed>
                    <Dimmer active={this.state.loading} inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                    {...renderTaskElementList(eles, this.state.current, this.cd)}
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

function renderTaskElementList(eles: readonly TaskElement[], current: string, cd: CD ):JSX.Element[]{
    return(_.map(eles, (t) => <TaskElementWidget element={t} key={t.id} current={current} cd={cd}></TaskElementWidget>))
}

type TaskElementProps = {element: TaskElement, current: string, cd: CD}
export class TaskElementWidget extends React.Component<TaskElementProps, {}>{
    constructor(props: TaskElementProps){
        super(props)
    }
    render(){
        let {element, current, cd} = this.props;
        if ("children" in element){
            return(<TaskFolderWidget {...element} current={current} cd={cd}></TaskFolderWidget>)
        } 
        else {
            return(<TaskWidget {...element}></TaskWidget>)
        }
    }
}