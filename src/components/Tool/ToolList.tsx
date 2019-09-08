import {taskTag, TaskElement, TaskDragType} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {List, Button, Form, TextArea} from 'semantic-ui-react'
import {ElementInfo, ElementId, EleProps} from './Types'

type TaskListProps = {tasks: TaskElement[], eleprops: EleProps}
type State = {}
export class ToolList extends React.Component<TaskListProps, State>{
    constructor(props: TaskListProps){
        super(props)
    }

    render(){
        const {eleprops, tasks} = this.props
        return(
            tasks.length > 0?
                (<List divided relaxed>
                    {...renderTaskElementList(tasks, eleprops)}
                </List>)
            :
                <div style={{textAlign: "center"}}>{"<empty>"}</div>
        )
    }
}

function renderTaskElementList(eles: TaskElement[], eleprops: EleProps ):JSX.Element[]{
    return(_.map(eles, (t) => 
        <TaskElementWidget 
            element={t} 
            key={t.id} 
            eleprops={eleprops}
        />))
}

type TaskElementProps = {element: TaskElement, eleprops: EleProps}
class TaskElementWidget extends React.Component<TaskElementProps, {}>{
    constructor(props: TaskElementProps){
        super(props)
    }
    render(){
        const {element, eleprops} = this.props;
        return(<ToolElementWidget {...element} eleprops={eleprops}/>)
    }
}

function currentid(p: ElementInfo[]): ElementId{
    if (p.length == 0){
        return null
    } else {
        return p[p.length - 1].id
    }
}

type Props = {
    name: string
  , children?: TaskElement[]
  , description: string
  , id: string
  , eleprops: EleProps
  , taskid?: string
  , open?: boolean
  }

class ToolElementWidget extends React.Component<Props, {expand: boolean, name: string, description: string}>{
    dragStart: React.DragEventHandler
    toggle: () => void
    isfolder: boolean
    handleEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    constructor(props: Props){
        super(props)
        this.state = {expand: props.open? true : false, name: this.props.name, description: this.props.description}
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
        if (!this.props.eleprops.selectable){
            this.setState((prevState) => ({...prevState, expand: !prevState.expand}))
            return
        }
        const {id, eleprops} = this.props
        const {cd, path} = eleprops
        const current = currentid(path)
        const selected = current == id
        const expand = this.state.expand
        if (expand && !selected){
            cd(id)
            return
        }
        if (expand && selected){
            this.setState((prevState) => ({...prevState, expand: false}))
            cd(null)
            return
        }
        this.setState((prevState) => ({...prevState, expand: !prevState.expand}))
        cd(id)
    }

    handleEditChangeF(event: React.ChangeEvent<HTMLInputElement>){
        const target = event.target
        const {value, name} = target
        this.setState((prev) => Object.assign(prev, {[name]: value}));
    }

    render(){
        let {expand} = this.state
        const {children, description, id, name, eleprops} = this.props
        const {path, save, editing, cancelEdit} = eleprops
        const descriptionVal = description.length==0 ? "<none>" : description
        const selected = currentid(path) == id
        for(const e of path){
            if (expand){break}
            expand = expand || (id == e.id)
        }
        const isEdit = editing && selected
        return (
            <List.Item
                draggable={!this.isfolder}
                onDragStart={this.isfolder? null : this.dragStart}
            >
                <List.Icon 
                    onClick = {this.toggle}
                    name={this.isfolder? (expand ? 'folder open outline' : 'folder outline') : 'code'}
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
                    <List.List className={"ui relaxed divided"} style = {{display: (expand? "block" : "none")}}>
                        {...renderTaskElementList(children, eleprops)}
                    </List.List>
                :
                    ""
                }
            </List.Item>
        )
    }
}