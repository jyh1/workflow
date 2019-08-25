import * as React from "react"
import * as _ from "lodash"
import * as S from 'semantic-ui-react'
import {evalJLang} from "../Interpreter"
import * as T from '../Types'
import "brace/mode/haskell";
import "brace/mode/sh";
import "brace/theme/github";
import AceEditor from "react-ace";

type Props = {
    codalang?: string
    command?: string
}
type State = {}

export class Execution extends React.Component<Props, State>{
    render(){
        const {codalang, command} = this.props
        return (
            <S.Grid style={{height: "100%", paddingBottom: "50px"}}>
                <S.Grid.Row>
                    <S.Grid.Column width={8}>
                        <AceEditor
                            mode="haskell"
                            theme="github"
                            value={codalang}
                            readOnly
                            name="codalangres"
                            width="100%"
                            height="100%"
                            editorProps={{ $blockScrolling: true }}
                        />
                    </S.Grid.Column>
                    <S.Grid.Column width={8}>
                        <AceEditor
                            mode="sh"
                            wrapEnabled
                            theme="github"
                            width="100%"
                            height="100%"
                            value={command}
                            readOnly
                            name="commandres"
                            editorProps={{ $blockScrolling: true }}
                        />
                    </S.Grid.Column>
                </S.Grid.Row>
            </S.Grid>
        )
    }
}

export function buildCommand(jlang?: T.JLang): Promise<string>{
    if (!jlang){
        return Promise.resolve(null)
    }
    let commands: string[] = []
    let count = 0
    const mockReq: T.ClRequest = (worksheet, command) => {
        const nvar = "bundle_" + count
        count += 1
        commands.push(nvar+"=$(" + command + ")")
        return Promise.resolve("$" + nvar)
    }
    return evalJLang(jlang, mockReq).then(e => {return commands.join('\n')})
}