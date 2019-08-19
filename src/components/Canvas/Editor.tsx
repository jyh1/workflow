import * as React from "react";
import * as Brace from "brace";
import AceEditor from "react-ace";
import {Modal, Button, Icon, Popup, Input } from 'semantic-ui-react'
import * as T from '../Types'
import {parseReq, parseArgReq} from "../Requests"

import "brace/mode/haskell";
import "brace/theme/github";

type Props = {
      name: string
    , close: () => void
    , save: (task: T.Task, name: string) => void
    , body: T.Task
    , nodeType: T.NodeType
}
type State = {value: string, codaval?: T.Task, editName: boolean, name: string, info: string}

export class CodaEditor extends React.Component<Props, State>{
    parseValue: (s: string) => Promise<T.ParseResult>
    constructor(props: Props){
        super(props)
        this.state = {value: props.body.taskcode, codaval: props.body, editName: false, name: props.name, info: ""}
        this.parseValue = (props.nodeType == "tool")? parseReq : parseArgReq
    }
    handleInput = (val: string) => {
        this.setState(p => Object.assign(p, {value: val, codaval: null}))
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
        .then(task => this.setState(p => ({...p, codaval: {...task, taskcode: value}})))
        .catch(e => e.then((e: T.Exception) => this.setState(p => ({...p, info: e.info}))))
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

    render(){
        const {codaval, value, editName, name, info} = this.state
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
                {header}
                <Modal.Content>
                    <AceEditor
                        mode="haskell"
                        theme="github"
                        onChange={this.handleInput}
                        editorProps={{ $blockScrolling: true }}
                        showPrintMargin={true}
                        showGutter={true}
                        focus={true}
                        wrapEnabled={true}
                        highlightActiveLine={true}
                        value={value}
                        placeholder={(this.props.nodeType == "tool")? "Input Codalang": "Input argument dictionary (e.g. [arg1: bundle, arg2: string ...])"}
                        setOptions={{
                            showLineNumbers: true,
                            tabSize: 4
                            }}
                    />
                <div id="editorinfo">{info}</div>
                </Modal.Content>
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