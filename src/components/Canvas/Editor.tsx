import * as React from "react";
import * as Brace from "brace";
import AceEditor from "react-ace";
import {Modal, Button, Icon, Popup, Grid, Header } from 'semantic-ui-react'
import * as T from '../Types'
import {parseReq, parseArgReq} from "../Requests"
import * as Anser from 'anser';

import "brace/mode/haskell";
import "brace/theme/github";
import { instanceOf } from "prop-types";

type Props = {
      name: string
    , close: () => void
    , save: (task: T.Task, name: string) => void
    , body: T.Task
    , nodeType: T.NodeType
}
type State = {
      value: string
    , codaval?: T.Task
    , editName: boolean
    , name: string
    , exception?: T.Exception
}

export class CodaEditor extends React.Component<Props, State>{
    parseValue: (s: string) => Promise<T.ParseResult>
    constructor(props: Props){
        super(props)
        this.state = {
              value: props.body.taskcode
            , codaval: props.body
            , editName: false
            , name: props.name
        }
        this.parseValue = (props.nodeType == "tool")? parseReq : parseArgReq
    }
    handleInput = (val: string) => {
        this.setState(p => ({...p, value: val, codaval: null}))
    }
    handleClose = () => {
        const {codaval, name} = this.state
        this.props.save(codaval, name)
        // console.log(codaval)
        this.props.close()
    }
    compile = () => {
        let {value} = this.state
        this.parseValue(value)
        .then(task => this.setState(p => ({...p, codaval: {...task, taskcode: value}, exception: undefined})))
        .catch(e => e.then((e: T.Exception) => 
            this.setState(p => ({...p, exception: e})))
        )
    }
    startEditingName = () => {
        this.setState(p => Object.assign(p, {editName: true}))
    }
    stopEditingName = () => {
        this.setState(p => Object.assign(p, {editName: false}))
    }

    editName = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value
        this.setState(p => Object.assign(p, {name}));
    }

    clearInfo = () => {
        this.setState(p => ({...p, exception: {...p.exception, info: ""}}))
    }

    render(){
        const {codaval, value, editName, name, exception} = this.state
        const info = exception ? exception.info : ""
        let markers: any[] = []
        if (exception){
            if (exception.type == 'parser'){
                markers = 
                    [{startRow: exception.line, startCol: 0, endRow: exception.line, endCol: exception.column, className: 'error-marker', type: 'background'}]
            }
        }
        const compiled = codaval? true : false
        const header = (
            <Modal.Header>
                Edit: {editName? 
                        <input onChange={this.editName} onBlur={this.stopEditingName} defaultValue={name}/> 
                        : <Popup content='Click to edit' trigger = {<div onClick={this.startEditingName} className="editorToolname">{name}</div>}/>
                      }
            </Modal.Header>)
        return(
            <Modal open={true} id="editormodal">
                <Popup 
                    content={<EditorInfo info={info} clearInfo={this.clearInfo}/>}
                    open={info.length > 0}
                    position='top center'
                    trigger={header}
                />
                <AceEditor
                    mode="haskell"
                    theme="github"
                    onChange={this.handleInput}
                    editorProps={{ $blockScrolling: true }}
                    showPrintMargin={true}
                    showGutter={true}
                    focus={true}
                    width="900px"
                    highlightActiveLine={true}
                    value={value}
                    markers={markers}
                    placeholder={(this.props.nodeType == "tool")? "Input Codalang": "Input argument dictionary (e.g. [arg1: bundle, arg2: string ...])"}
                    setOptions={{
                        showLineNumbers: true,
                        tabSize: 4
                        }}
                />
                <Modal.Actions>
                        <Button basic onClick={this.props.close}>Cancel</Button>
                        <Button color={compiled? 'green' : 'blue'} onClick={compiled? this.handleClose : this.compile} >
                            <Icon name={compiled? 'checkmark' : 'microchip'}/> {compiled? "Save" : "Compile"}
                        </Button>
                </Modal.Actions>
            </Modal>
        )
    }
}

const EditorInfo: React.SFC<{info: string, clearInfo: () => void}> = (props) => {
    const infoHtml = Anser.ansiToHtml(props.info)
    return(
        <React.Fragment>
            <Button basic icon='close' style={{padding: "0"}} onClick={props.clearInfo} />
            <div id="editorinfo" dangerouslySetInnerHTML={{__html: infoHtml.replace(/\n/g, "<br>")}}/>
        </React.Fragment>

    )
}
