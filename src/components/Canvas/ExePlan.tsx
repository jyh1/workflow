import * as React from "react"
import * as _ from "lodash"
import * as S from 'semantic-ui-react'
import {evalJLang} from "../Interpreter"
import * as T from '../Types'

type Props = {
    codalang?: string
    command?: string
}
type State = {}

export class Execution extends React.Component<Props, State>{
    command: string
    render(){
        const {codalang, command} = this.props
        return (
            <S.Grid>
                <S.Grid.Row>
                    <S.Grid.Column width={8}>
                        <div>{codalang}</div> 
                    </S.Grid.Column>
                    <S.Grid.Column width={8}>
                        <div>{command}</div>
                    </S.Grid.Column>
                </S.Grid.Row>
            </S.Grid>
        )
    }
}

export function buildCommand(jlang: T.JLang){
    return "j lang"
}