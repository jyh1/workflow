import {taskTag, TaskElement, TaskListElement, TaskDragType} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {List, Segment, Header} from 'semantic-ui-react'
import {Path, CD} from './Types'

type TaskListProps = {current?: Path, cd: CD, tasks: TaskListElement[]}
type State = {}
export class ToolList extends React.Component<TaskListProps, State>{
    constructor(props: TaskListProps){
        super(props)
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

    render(){
        const {current, cd} = this.props
        return(
            <List divided relaxed>
                {...renderTaskElementList(this.toTaskElement(this.props.tasks), current, cd, [])}
            </List>
        )
    }
}

function renderTaskElementList(eles: TaskElement[], current: Path, cd: CD, parentPath: Path ):JSX.Element[]{
    return(_.map(eles, (t) => <TaskElementWidget element={t} key={t.id} current={current} cd={cd} parentPath={parentPath}></TaskElementWidget>))
}

type TaskElementProps = {element: TaskElement, current: Path, cd: CD, parentPath: Path}
class TaskElementWidget extends React.Component<TaskElementProps, {}>{
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

// tool
type TaskProps = {name: string, taskid: string, description: string}
class TaskWidget extends React.Component<TaskProps, {}>{
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

// tool folder
export function currentid(path: Path){
    if (path.length == 0){
        return null
    }
    return path[path.length - 1].id
}


type Props = {
    name: string
  , children: TaskElement[]
  , description: string
  , current: Path
  , id: string
  , cd: CD
  , parentPath: Path
  }

class TaskFolderWidget extends React.Component<Props, {expand: boolean}>{
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