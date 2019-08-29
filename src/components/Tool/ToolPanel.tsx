import {TaskListElement, TaskElement} from "../Types"
import * as T from "../Types"
import * as React from "react"
import * as _ from "lodash"
import {Header, Button, Segment, Icon, Sticky, Ref, Popup} from 'semantic-ui-react'
// import {taskListReq, newToolReq, updateToolReq, removeEleReq} from "../MockRequests"
import {taskListReq, newToolReq, updateToolReq, removeEleReq} from "../Requests"

import {ToolList} from './ToolList'
import {ToolPath} from './ToolHeader'
import {ElementId, ElementInfo, CD} from './Types'


type ToolPanelState = {
      tasks: TaskElement[]
    , loading: boolean
    , current?: ElementId
    , editing: boolean
    , elementInfo: {[elementid: string]: ElementInfo}
}
type ToolPanelProps = {codalang?: T.CodaLang, doneSave: () => void, report: (info: T.MessageInfo) => void}
export class ToolPanel extends React.Component<ToolPanelProps, ToolPanelState>{
    contextRef: React.Ref<any>
    constructor(props: ToolPanelProps){
        super(props)
        this.state = {tasks: [], loading: true, current: null, editing: false, elementInfo: {}}
        this.contextRef = React.createRef()
    }

    shouldComponentUpdate(nextProps: ToolPanelProps, nextState: ToolPanelState){
        if (nextProps.codalang){
            this.newTool(nextProps.codalang)
            this.props.doneSave()
            return false
        }
        return true
    }

    cd: CD = (current) => {
        if(!this.state.editing){
            this.setState(p => ({...p, current}))
        }
    }

    save = (id: string, name: string, description: string) => {
        updateToolReq({id, name, description})
        .then(this.stopEdit)
        .then( () => this.updateList(false))
    }

    updateList = (setroot: boolean) => {
        this.setState(p => ({...p, loading: true}))
        let tlis = taskListReq().then((e) => {
            this.setState((prev)=> ({...prev, ...this.toTaskElement(e), loading: false, current: setroot? null : prev.current}))
        })
        return tlis
    }

    newTool = (codalang: T.CodaLang) => {
        const parent = this.currentFolderPid()
        const name = "New Tool"
        this.newElement(newToolReq({name, description: "", parent, codalang}))
    }

    newFolder = () => {
        const parent = this.currentFolderPid()
        const name = "New Folder"
        this.newElement(newToolReq({name, description: "", parent}))
        
    }

    newElement(newEle: Promise<string>){
        newEle.then(newid => (
            this.updateList(false)
            .then(() => this.setState(p => ({...p, current: newid, editing: true})))
            )
        )
    }

    startEdit = () => {
        this.setState(p => Object.assign(p, {editing: true}))
    }

    stopEdit = () => {
        this.setState(p => Object.assign(p, {editing: false}))
    }

    componentDidMount(){
        this.updateList(false)
    }

    currentFolderPid = () => {
        let current = this.state.current
        const elementInfo = this.state.elementInfo
        if (current){
            if(elementInfo[current].isfolder){
                return current
            }
            return elementInfo[current].parent
        }
        return current
    }

    removeEle = () => {
        const {current, elementInfo} = this.state
        if (current){
            const info: T.ConfirmInfo = {
                  header: "Delete item " + elementInfo[current].name + "?"
                , type: "confirm"
                , confirm: () => {removeEleReq(current).then(() => this.updateList(true))}
            }
            this.props.report(info)
        }
    }

    // converting to a tree structure
    toTaskElement(eles: TaskListElement[]){
        type FolderRep = {name?: string, id?: ElementId, children: TaskRep[], description: string}
        type TaskRep = TaskElement | FolderRep
        let dic : {[eleid: string]: FolderRep} = {}
        let infodic : {[eleid: string]: ElementInfo} = {}
        let taskArray : TaskElement[] = []
        for(let e of eles){
            let isfolder: boolean
            let rep : TaskRep
            if('taskid' in e){
                isfolder = false
                let task: TaskElement = {name: e.name, id: e.id, taskid: e.taskid, description: e.description}
                rep = task
            } else {
                isfolder = true
                // file object
                if(dic[e.id]){
                    // dic[e.id] = Object.assign(dic[e.id], {name: e.name, id: e.id, description: e.description})
                    dic[e.id] = {...dic[e.id], name: e.name, id: e.id, description: e.description}
                } else {
                    let newEle : TaskElement = {name: e.name, id: e.id, children: [], description: e.description}  
                    dic[e.id] = newEle
                }
                rep = dic[e.id]
            }
            if(e.parent){
                if (dic[e.parent]){dic[e.parent].children.push(rep)} 
                    else {dic[e.parent] = {children: [rep], description: ""}}
            } else {
                // top level
                taskArray.push(rep as TaskElement)
            }

            infodic[e.id] = {name: e.name, id: e.id, parent: e.parent, isfolder}
        }
        return {tasks: taskArray, elementInfo: infodic}
    }

    render(){
        const {current, elementInfo} = this.state        
        // constructing path
        let path: ElementInfo[] = []
        let currentElement = current
        while(currentElement){
            const ele = elementInfo[currentElement]
            path.unshift(ele)
            currentElement = ele.parent
        }

        const eleprops = {editing: this.state.editing, path, cd: this.cd, save: this.save, cancelEdit: this.stopEdit}

        return(
            <React.Fragment>
                <Ref innerRef={this.contextRef}>
                    <div>
                        <Sticky context={this.contextRef}>
                            <div className="panelsticky">
                                <div className="toolbuttons">
                                    <Button.Group floated="right">
                                        <Popup content='New Folder' trigger = 
                                            {<Button icon='add' onClick={this.newFolder} basic color='blue'/>}
                                        />
                                        <Popup content='Edit' trigger = 
                                            {<Button disabled={current? false: true} icon='edit' onClick={this.startEdit} basic color='blue'/>}
                                        />
                                        <Popup position='bottom right' content="Refresh Panel"
                                            trigger={
                                                <Button 
                                                    icon="refresh" 
                                                    onClick={() => this.updateList(true)}
                                                    basic color='blue'
                                                />}
                                        />
                                    </Button.Group>
                                    <Popup content='Delete' trigger = {
                                            <Button 
                                                basic 
                                                disabled={current? false: true} 
                                                color='red'
                                                icon="trash alternate outline"
                                                onClick={this.removeEle}
                                            />}
                                    />
                                    <br style={{clear: "both"}} />
                                </div>
                                <div style={{paddingLeft: "14px"}}><ToolPath path={path} cd={this.cd} /></div>
                            </div>
                        </Sticky>
                        <Segment style={{border: "none", paddingTop: "0", marginTop: "0"}} loading={this.state.loading} className="toolpanel">
                            <ToolList eleprops={eleprops} tasks={this.state.tasks}/>                
                        </Segment> 
                    </div>
                </Ref>
                                
            </React.Fragment>
        )
    }

}
