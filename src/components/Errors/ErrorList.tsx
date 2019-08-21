import * as T from "../Types"
import * as React from "react"
import * as _ from "lodash"
import * as S from 'semantic-ui-react'

type Props = {
      errors: T.Exception[]
    , removeException: (ind: number) => void
}

type State = {
}

export class ErrorList extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
    }
    render(){
        const {errors, removeException} = this.props
        return(
            <div id="error-list">
                {_.map(errors, (val, ind) => (<ErrorMsg exception={val} key={ind} close={() => removeException(ind)}/>))}
            </div>
        )
    }
}

const ErrorMsg: React.SFC<{exception: T.Exception, close: () => void}> = (props) => {
    return(
        <S.Message
            onDismiss={props.close}
            negative
        >
            <S.Message.Header>{getHeader(props.exception)}</S.Message.Header>
            {props.exception.info}
        </S.Message>
    )
}

const getHeader = (e: T.Exception): string => {
    switch(e.type){
        case "parser":
            return "Parse Error"
        case "type":
            return "Type Error"
        default:
            return e.type
    }
}