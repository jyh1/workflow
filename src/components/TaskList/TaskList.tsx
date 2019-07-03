import {taskTag, Task, TaskFolder, TaskElement} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {List, Transition} from 'semantic-ui-react'
import { element } from "prop-types";

type Props = {taskFolder: TaskFolder}

export class TaskFolderWidget extends React.Component<Props, {expand: boolean}>{
    constructor(props: Props){
        super(props)
        this.state = {expand: false}
    }

    toggle = () => {
        this.setState((prevState) => ({...prevState, expand: !prevState.expand}))
    }

    render(){
        const folder = this.props.taskFolder
        const {expand} = this.state
        return (
            <List.Item>
                <List.Icon className="folder-elem" onClick = {this.toggle} name={expand ? 'folder open outline' : 'folder outline'}/>
                <List.Content className="folder-elem">
                    <List.Header onClick = {this.toggle} >{folder.name}</List.Header>
                    <List.Description>short description</List.Description>
                </List.Content>
                <List.List className={"ui relaxed divided"} style = {{display: (expand? "block" : "none")}}>
                    {...renderTaskElementntList(folder.contents)}
                </List.List>

            </List.Item>
        )
    }
}

type TaskProps = {element: Task}
export class TaskWidget extends React.Component<TaskProps, {}>{
    constructor(props: TaskProps){
        super(props)
    }

    dragStart: React.DragEventHandler = (event) => {
        // console.log(this.props.element)
        event.dataTransfer.setData(taskTag, JSON.stringify(this.props.element)); 
    }

    render(){
        const task = this.props.element
        return(
            <List.Item draggable={true} className="file-elem" onDragStart={this.dragStart}>
                <List.Icon name="code"/>
                <List.Content>
                    <List.Header>{task.name}</List.Header>
                    <List.Description>short description</List.Description>
                </List.Content>
            </List.Item>
        )
    }
}

export function renderTaskElementntList(eles: TaskElement[]):JSX.Element[]{
    return(_.map(eles, (t) => <TaskElementWidget element={t} key={t.name}></TaskElementWidget>))
}

type TaskElementProps = {element: TaskElement}
export class TaskElementWidget extends React.Component<TaskElementProps, {}>{
    constructor(props: TaskElementProps){
        super(props)
    }
    render(){
        let element = this.props.element;
        if ("contents" in element){
            element = element as TaskFolder
            return(<TaskFolderWidget taskFolder = {element}></TaskFolderWidget>)
        } 
        else {
            return(<TaskWidget element={element as Task}></TaskWidget>)
        }
    }
}