import * as React from "react";
import * as Brace from "brace";
import AceEditor from "react-ace";
import {Modal, Button, Icon } from 'semantic-ui-react'
import * as T from '../Types'
import {parseReq, compileReq} from "../Requests"

import "brace/mode/haskell";
import "brace/theme/github";

type Props = {name: string, close: () => void, save: (task: T.Task) => void, code: string}
type State = {value: string, codaval?: T.Task}

export class CodaEditor extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {value: props.code}
    }
    handleInput = (val: string) => {
        this.setState(p => Object.assign(p, {value: val, codaval: null}))
    }
    handleClose = () => {
        const {codaval} = this.state
        this.props.save(codaval)
        // console.log(codaval)
        this.props.close()
    }
    compile = () => {
        let {value} = this.state
        parseReq(value)
        .then(task => this.setState(p => Object.assign(p, {codaval: Object.assign(task, {taskcode: value}) })))
    }
    render(){
        const {codaval, value} = this.state
        const compiled = codaval? true : false
        return(
            <Modal open={true} id="editormodal" onDrag={(e:any) => {console.log(232); e.stopPropagation}}>
                <Modal.Header>Edit: {this.props.name}</Modal.Header>
                <Modal.Content>
                    <AceEditor
                        mode="haskell"
                        theme="github"
                        onChange={this.handleInput}
                        editorProps={{ $blockScrolling: true }}
                        showPrintMargin={true}
                        showGutter={true}
                        highlightActiveLine={true}
                        value={value}
                        setOptions={{
                            showLineNumbers: true,
                            tabSize: 2
                            }}
                    />
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