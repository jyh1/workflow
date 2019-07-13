import {taskTag, TaskElement, TaskId, TaskListElement, TaskDragType} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {List, Divider, Header} from 'semantic-ui-react'
import {taskListReq} from "../MockRequests"

type Props = {name: string, children: TaskElement[]}

export class TaskFolderWidget extends React.Component<Props, {expand: boolean}>{
    constructor(props: Props){
        super(props)
        this.state = {expand: false}
    }

    toggle = () => {
        this.setState((prevState) => ({...prevState, expand: !prevState.expand}))
    }

    render(){
        const {expand} = this.state
        return (
            <List.Item>
                <List.Icon className="folder-elem" onClick = {this.toggle} name={expand ? 'folder open outline' : 'folder outline'}/>
                <List.Content className="folder-elem">
                    <List.Header onClick = {this.toggle} >{this.props.name}</List.Header>
                    <List.Description>short description</List.Description>
                </List.Content>
                <List.List className={"ui relaxed divided"} style = {{display: (expand? "block" : "none")}}>
                    {...renderTaskElementList(this.props.children)}
                </List.List>

            </List.Item>
        )
    }
}

type TaskProps = {name: string, taskid: TaskId}
export class TaskWidget extends React.Component<TaskProps, {}>{
    constructor(props: TaskProps){
        super(props)
    }

    dragStart: React.DragEventHandler = (event) => {
        // console.log(this.props.element)
        let dragData : TaskDragType = {id: this.props.taskid, name: this.props.name}
        event.dataTransfer.setData(taskTag, JSON.stringify(dragData)); 
    }

    render(){
        return(
            <List.Item draggable={true} className="file-elem" onDragStart={this.dragStart}>
                <List.Icon name="code"/>
                <List.Content>
                    <List.Header>{this.props.name}</List.Header>
                    <List.Description>short description</List.Description>
                </List.Content>
            </List.Item>
        )
    }
}

export class TaskElementListWidget extends React.Component<{}, {tasks: TaskElement[]}>{
    constructor(props: {}){
        super(props)
        this.state = {tasks: []}
    }
    render(){
        let eles = this.state.tasks
        return(
            <React.Fragment>
                <Header as="h2">Tools</Header>
                <Divider />
                <List divided relaxed>
                    {...renderTaskElementList(eles)}
                </List>
            </React.Fragment>
        )
    }
    componentDidMount(){
        taskListReq().then((e) => {
            // console.log(e); 
            this.setState((prev)=> Object.assign(prev, {tasks: this.toTaskElement(e)}))
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
                let task: TaskElement = {name: e.name, id: e.id, taskid: e.taskid}
                rep = task
            } else {
                // file object
                if(dic[e.id]){
                    dic[e.id] = Object.assign(dic[e.id], {name: e.name, id: e.id})
                } else {
                    let newEle : TaskElement = {name: e.name, id: e.id, children: []}  
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

function renderTaskElementList(eles: readonly TaskElement[]):JSX.Element[]{
    return(_.map(eles, (t) => <TaskElementWidget element={t} key={t.id}></TaskElementWidget>))
}

type TaskElementProps = {element: TaskElement}
export class TaskElementWidget extends React.Component<TaskElementProps, {}>{
    constructor(props: TaskElementProps){
        super(props)
    }
    render(){
        let element = this.props.element;
        if ("children" in element){
            return(<TaskFolderWidget name = {element.name} children= {element.children} ></TaskFolderWidget>)
        } 
        else {
            return(<TaskWidget name={element.name} taskid={element.taskid}></TaskWidget>)
        }
    }
}