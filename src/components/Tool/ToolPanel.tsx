import {TaskListElement, TaskElement} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {Header, Button, Segment, Icon, Sticky, Ref, Popup} from 'semantic-ui-react'
// import {taskListReq, newToolReq} from "../MockRequests"
import {taskListReq, newToolReq} from "../Requests"

import {ToolList, currentid} from './ToolList'
import {ToolPath} from './ToolHeader'
import {Path} from './Types'


type ToolPanelState = {tasks: TaskListElement[], loading: boolean, current?: Path, editing: boolean}
export class ToolPanel extends React.Component<{}, ToolPanelState>{
    contextRef: React.Ref<any>
    constructor(props: {}){
        super(props)
        this.state = {tasks: [], loading: true, current: [], editing: false}
        this.contextRef = React.createRef()
    }

    cd = (dir: Path) => {
        this.setState(p => Object.assign(p, {current: dir}))
    }

    save = (name: string, desc: string) => {
        this.setState(p => Object.assign(p, {editing: false}))
    }

    updateList = (tlis: Promise<TaskListElement[]>) => {
        this.setState(p => Object.assign(p, {loading: true}))
        tlis.then((e) => {
            this.setState((prev)=> Object.assign(prev, {tasks: e, loading: false}))
        })
    }

    componentDidMount(){
        this.updateList(taskListReq())
    }

    render(){
        const {current} = this.state
        const pid = currentid(current)
        const eleprops = {editing: this.state.editing, current, cd: this.cd, save: this.save}
        return(
            <React.Fragment>
                <Header color='blue' as="h2" attached='top'>Tools</Header> 
                <Ref innerRef={this.contextRef}>
                    <Segment attached loading={this.state.loading} className="toolpanel">
                        <Sticky context={this.contextRef}>
                            <div className="panelsticky">
                                <Button.Group floated="right" size="small" basic color='blue'>
                                    <Popup content='New Folder' trigger = 
                                        {<Button icon onClick={() => this.updateList(newToolReq({name: "test", parent: pid}))}><Icon name='add' /></Button>}
                                    />
                                    <Popup content='Edit' trigger = 
                                        {<Button icon onClick={() => this.setState(p => Object.assign(p, {editing: true}))}><Icon name='edit' /></Button>}
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
