import {taskTag, TaskElement, TaskId, TaskListElement, TaskDragType} from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {Header, Button, Segment, Icon, Sticky, Ref} from 'semantic-ui-react'
import {taskListReq} from "../MockRequests"
// import {taskListReq} from "../Requests"

import {ToolList} from './ToolList'
import {ToolPath} from './ToolHeader'
import {Path} from './Types'


type ToolPanelState = {tasks: TaskListElement[], loading: boolean, current?: Path}
export class ToolPanel extends React.Component<{}, ToolPanelState>{
    contextRef: React.Ref<any>
    constructor(props: {}){
        super(props)
        this.state = {tasks: [], loading: true, current: []}
        this.contextRef = React.createRef()
    }

    cd = (dir: Path) => {
        this.setState(p => Object.assign(p, {current: dir}))
    }

    componentDidMount(){
        taskListReq().then((e) => {
            this.setState((prev)=> Object.assign(prev, {tasks: e, loading: false}))
        })
    }

    render(){
        const {current} = this.state
        return(
            <React.Fragment>
                <Header color='blue' as="h2" attached='top'>Tools</Header> 
                <Ref innerRef={this.contextRef}>
                    <Segment attached loading={this.state.loading} className="toolpanel">
                        <Sticky context={this.contextRef}>
                            <div className="panelsticky">
                            <Button.Group floated="right" size="small" basic color='blue'>
                                <Button icon>
                                    <Icon name='add' />
                                    New Folder
                                </Button>
                                <Button icon>
                                    <Icon name='add square' />
                                    New File
                                </Button>
                                <Button icon>
                                    <Icon name='trash alternate outline' />
                                    Delete
                                </Button>
                            </Button.Group>
                            <br style={{clear: "both"}} />
                            <ToolPath 
                            current={current}
                            cd={this.cd}
                            />
                            </div>
                        </Sticky>                                       
                        <ToolList
                            current={current}
                            cd={this.cd}
                            tasks={this.state.tasks}
                        />
                
                    </Segment> 
                </Ref>                   
            </React.Fragment>
        )
    }

}
