import * as React from "react";
import * as Brace from "brace";
import AceEditor from "react-ace";
import {Segment, Button, Icon, Popup, Header } from 'semantic-ui-react'
import * as T from '../Types'
import {parseReq, parseArgReq} from "../Requests"
import * as Anser from 'anser';

import "brace/mode/haskell";
import "brace/theme/github";
import { instanceOf } from "prop-types";

type Props = {
      name: string
    , close: () => void
    , save: (task: T.Task) => void
    , body: T.Task
    , nodeType: T.NodeType
    , error: (e: T.Info) => void
}
type State = {
      value: string
    , codaval?: T.Task
    , line?: number
    , col?: number
}

export class CodaEditor extends React.Component<Props, State>{
    parseValue: (s: string) => Promise<T.ParseResult>
    constructor(props: Props){
        super(props)
        this.state = {
              value: props.body.taskcode
            , codaval: props.body
        }
        this.parseValue = (props.nodeType == "tool")? parseReq : parseArgReq
    }
    handleInput = (val: string) => {
        this.setState(p => ({...p, value: val, codaval: null}))
    }
    handleClose = () => {
        const {codaval} = this.state
        this.props.save(codaval)
        this.props.close()
    }
    compile = () => {
        let {value} = this.state
        this.parseValue(value)
        .then(task => this.setState(p => ({...p, codaval: {...task, taskcode: value}, line: undefined})))
        .catch(e => e.then((e: T.Exception) => {
            let header: string
            switch (e.type){
                case "parser":
                    this.setState(p => ({...p, line: e.line, col: e.column}))
                    header = "Parse Error"
                    break
                case "type":
                    this.setState(p => ({...p, line: undefined, col: undefined}))
                    header = "Type Error"
                    break
            }
            this.props.error({type: "error", header: header ,body: <EditorInfo info={e.info}/>})
            })
        )
    }

    render(){
        const {codaval, value,line, col} = this.state
        let markers: any[] = []
        if (typeof line == "number"){
            markers = 
                [{startRow: line, startCol: 0, endRow: line, endCol: col, className: 'error-marker', type: 'background'}]
        }
        const compiled = codaval? true : false
        return(
            <Segment style={{margin: "0", padding: "0"}}>
                <AceEditor
                    mode="haskell"
                    theme="github"
                    onChange={this.handleInput}
                    editorProps={{ $blockScrolling: true }}
                    showPrintMargin={true}
                    showGutter={true}
                    focus={true}
                    width="500px"
                    height="400px"
                    highlightActiveLine={true}
                    value={value}
                    markers={markers}
                    placeholder={(this.props.nodeType == "tool")? "Input Codalang": "Input argument dictionary (e.g. [arg1: bundle, arg2: string ...])"}
                    setOptions={{
                        showLineNumbers: true,
                        tabSize: 4
                        }}
                />
                <Segment>
                    <Button basic onClick={this.props.close}>Cancel</Button>
                    <Button color={compiled? 'green' : 'blue'} onClick={compiled? this.handleClose : this.compile} >
                        <Icon name={compiled? 'checkmark' : 'microchip'}/> {compiled? "Save" : "Compile"}
                    </Button>
                </Segment>
            </Segment>
        )
    }
}

const EditorInfo: React.SFC<{info: string}> = (props) => {
    const infoHtml = Anser.ansiToHtml(props.info)
    return(
        <React.Fragment>
            <div id="editorinfo" dangerouslySetInnerHTML={{__html: infoHtml.replace(/\n/g, "<br>")}}/>
        </React.Fragment>

    )
}
