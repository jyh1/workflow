import * as React from "react";
import * as Brace from "brace";
import AceEditor from "react-ace";
import {Segment, Button, Icon, Popup, Header } from 'semantic-ui-react'
import * as T from '../Types'
import {parseReq, parseArgReq} from "../Requests"
import {fromException} from "../Errors/FromException"
// import "brace/mode/haskell";
import "brace/theme/github";

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
    , pos: {column: number, row: number}
}

export class CodaEditor extends React.Component<Props, State>{
    parseValue: (s: string) => Promise<T.ParseResult>
    constructor(props: Props){
        super(props)
        this.state = {
              value: props.body.taskcode
            , codaval: props.body
            , pos: {column: 0, row: 0}
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
        .catch(e => {
            switch (e.type){
                case "parser":
                    this.setState(p => ({...p, line: e.line, col: e.column}))
                    break
                default:
                    this.setState(p => ({...p, line: undefined, col: undefined}))
                    break
            }
            this.props.error(fromException(e))
            }
        )
    }

    processDrop: React.DragEventHandler = (event) => {
        event.preventDefault()
        event.stopPropagation()
        let dragged: T.BundleDragType;
        const data = event.dataTransfer.getData(T.bundleTag);
        if (data.length > 0){
            dragged = JSON.parse(data);
            this.setState(p => {
                const oldval = p.value
                const {row, column} = p.pos
                const lines = oldval.split("\n")
                lines[row] = lines[row].slice(0, column) + dragged.uuid + lines[row].slice(column)
                return ({...p, value: lines.join('\n')})
            })
        }
    }

    onCursorChange = (selection: any) => {
        const pos = selection.getCursor();
        this.setState(p => ({...p, pos}))
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
            <Segment style={{margin: "0", padding: "0"}}
                onDrop={this.processDrop}
            >
                <AceEditor
                    // mode="haskell"
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
                    onCursorChange={this.onCursorChange}
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