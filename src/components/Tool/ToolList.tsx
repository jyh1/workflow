import {taskTag, TaskElement, TaskListElement, TaskDragType} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {List, Button, Form, TextArea} from 'semantic-ui-react'
import {Path, CD, EleProps} from './Types'

type TaskListProps = {tasks: TaskListElement[], eleprops: EleProps}
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
        const {eleprops} = this.props
        return(
            <List divided relaxed>
                {...renderTaskElementList(this.toTaskElement(this.props.tasks), [], eleprops)}
            </List>
        )
    }
}

function renderTaskElementList(eles: TaskElement[], parentPath: Path, eleprops: EleProps ):JSX.Element[]{
    return(_.map(eles, (t) => 
        <TaskElementWidget 
            element={t} 
            key={t.id} 
            parentPath={parentPath}
            eleprops={eleprops}
        />))
}

type TaskElementProps = {element: TaskElement, parentPath: Path, eleprops: EleProps}
class TaskElementWidget extends React.Component<TaskElementProps, {}>{
    constructor(props: TaskElementProps){
        super(props)
    }
    render(){
        const {element, parentPath, eleprops} = this.props;
        return(<ToolElementWidget {...element} parentPath={parentPath} eleprops={eleprops}/>)
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
  , children?: TaskElement[]
  , description: string
  , id: string
  , parentPath: Path
  , eleprops: EleProps
  , taskid?: string
  }

class ToolElementWidget extends React.Component<Props, {expand: boolean, name: string, description: string}>{
    path: Path
    dragStart: React.DragEventHandler
    toggle: () => void
    isfolder: boolean
    handleEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    constructor(props: Props){
        super(props)
        this.state = {expand: false, name: this.props.name, description: this.props.description}
        this.path = this.props.parentPath.concat({id: this.props.id, name: this.props.name})
        this.dragStart = this.dragStartF.bind(this)
        this.toggle = this.toggleF.bind(this)
        this.isfolder = this.props.taskid? false : true
        this.handleEditChange = this.handleEditChangeF.bind(this)
    }

    dragStartF(event: React.DragEvent<Element>){
        // console.log(this.props.element)
        event.stopPropagation()
        let dragData : TaskDragType = {taskinfo: {type: "taskid", content: this.props.taskid}, name: this.props.name}
        event.dataTransfer.setData(taskTag, JSON.stringify(dragData)); 
    }
    
    toggleF() {
        if (this.props.eleprops.editing) {return}
        const {id, eleprops} = this.props
        const {cd, current} = eleprops
        const selected = currentid(current) == id
        const expand = this.state.expand
        if (expand && !selected){
            cd(this.path, this.isfolder)
            return
        }
        if (expand && selected){
            this.setState((prevState) => ({...prevState, expand: false}))
            cd([], true)
            return
        }
        this.setState((prevState) => ({...prevState, expand: !prevState.expand}))
        cd(this.path, this.isfolder)
    }

    handleEditChangeF(event: React.ChangeEvent<HTMLInputElement>){
        const target = event.target
        const {value, name} = target
        this.setState((prev) => Object.assign(prev, {[name]: value}));
    }

    render(){
        const {expand} = this.state
        const {children, description, id, name, eleprops} = this.props
        const {current, save, editing, cancelEdit} = eleprops
        const descriptionVal = description.length==0 ? "<none>" : description
        const selected = currentid(current) == id
        const open = expand || selected
        const isEdit = editing && selected
        return (
            <List.Item
                draggable={!this.isfolder}
                onDragStart={this.isfolder? null : this.dragStart}
            >
                <List.Icon 
                    onClick = {this.toggle}
                    name={this.isfolder? (open ? 'folder open outline' : 'folder outline') : 'code'}
                />
                <List.Content 
                    onClick = {this.toggle} 
                    className={(this.isfolder? "folder-elem" : "file-elem") + ((selected && !editing)? "-selected" : "")}
                >
                    {isEdit? 
                        <List.Header>
                            <Form>
                                <Form.Input type="text" name="name" onChange={this.handleEditChange} defaultValue={name}/>
                                <Form.Field><TextArea name="description" onChange={e => this.handleEditChange(e as any)} defaultValue={description} /></Form.Field>
                                <Button basic color="blue" onClick={() => save(id, this.state.name, this.state.description)}>Save</Button>
                                <Button basic color="red" onClick={cancelEdit}>Cancel</Button>
                            </Form>
                        </List.Header>
                    :
                        <React.Fragment>
                            <List.Header>{name}</List.Header>
                            <List.Description>{descriptionVal}</List.Description>
                        </React.Fragment>
                    }
                </List.Content>
                {children?
                    <List.List className={"ui relaxed divided"} style = {{display: (open? "block" : "none")}}>
                        {...renderTaskElementList(children, this.path, eleprops)}
                    </List.List>
                :
                    ""
                }
            </List.Item>
        )
    }
}