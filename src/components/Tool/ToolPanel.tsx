import {TaskListElement, TaskElement} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {Header, Button, Segment, Icon, Sticky, Ref, Popup} from 'semantic-ui-react'
// import {taskListReq, newToolReq} from "../MockRequests"
import {taskListReq, newToolReq, updateToolReq} from "../Requests"

import {ToolList, currentid} from './ToolList'
import {ToolPath} from './ToolHeader'
import {Path} from './Types'


type ToolPanelState = {tasks: TaskListElement[], loading: boolean, current?: Path, editing: boolean, isfolder: boolean}
type ToolPanelProps = {saveTask: boolean, doneSave: () => void}
export class ToolPanel extends React.Component<ToolPanelProps, ToolPanelState>{
    contextRef: React.Ref<any>
    constructor(props: ToolPanelProps){
        super(props)
        this.state = {tasks: [], loading: true, current: [], editing: false, isfolder: true}
        this.contextRef = React.createRef()
    }

    shouldComponentUpdate(nextProps: ToolPanelProps, nextState: ToolPanelState){
        if (nextProps.saveTask){
            console.log('save')
            this.props.doneSave()
            return false
        }
        return true
    }

    cd = (dir: Path, isfolder: boolean) => {
        this.setState(p => Object.assign(p, {current: dir, isfolder}))
    }

    save = (id: string, name: string, description: string) => {
        updateToolReq({id, name, description})
        .then(this.stopEdit)
        .then( () => this.updateList(taskListReq()))
    }

    updateList = (tlis: Promise<TaskListElement[]>) => {
        this.setState(p => Object.assign(p, {loading: true}))
        tlis.then((e) => {
            this.setState((prev)=> Object.assign(prev, {tasks: e, loading: false}))
        })
    }

    newFolder = (parent?: string) => {
        const name = "New Folder"
        newToolReq({name, description: "", parent})
        .then((newid) => this.setState(p => Object.assign(p, {current: p.current.concat([{name, id: newid}])})))
        .then( () => this.updateList(taskListReq()))
        .then(this.startEdit)
    }

    startEdit = () => {
        this.setState(p => Object.assign(p, {editing: true}))
    }

    stopEdit = () => {
        this.setState(p => Object.assign(p, {editing: false}))
    }

    componentDidMount(){
        this.updateList(taskListReq())
    }

    render(){
        const {current, isfolder} = this.state
        const pid = currentid(current)
        const eleprops = {editing: this.state.editing, current, cd: this.cd, save: this.save, cancelEdit: this.stopEdit}
        return(
            <React.Fragment>
                <Header color='blue' as="h2" attached='top'>Tools</Header> 
                <Ref innerRef={this.contextRef}>
                    <Segment attached loading={this.state.loading} className="toolpanel">
                        <Sticky context={this.contextRef}>
                            <div className="panelsticky">
                                <Button.Group floated="right" size="small" basic color='blue'>
                                    <Popup content='New Folder' trigger = 
                                        {<Button disabled={!isfolder} icon onClick={() => this.newFolder(pid)}><Icon name='add' /></Button>}
                                    />
                                    <Popup content='Edit' trigger = 
                                        {<Button icon onClick={this.startEdit}><Icon name='edit' /></Button>}
                                    />
                                    <Popup position='bottom right' content='Delete' trigger = {<Button icon><Icon name='trash alternate outline' /></Button>}
                                    />
                                </Button.Group>
                                <br style={{clear: "both"}} />
                                <ToolPath 
                                current={current}
                                cd={this.cd}
                                />
                            </div>
                        </Sticky>                                       
                        <ToolList
                            eleprops={eleprops}
                            tasks={this.state.tasks}
                        />
                
                    </Segment> 
                </Ref>                   
            </React.Fragment>
        )
    }

}
