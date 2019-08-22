import * as T from "../Types"
import * as React from "react"
import * as _ from "lodash"
import * as S from 'semantic-ui-react'
import { instanceOf } from "prop-types";

type Props = {
      errors: T.Info[]
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
                {_.map(errors, (val, ind) => (<ErrorMsg info={val} key={ind} close={() => removeException(ind)}/>))}
            </div>
        )
    }
}

const ErrorMsg: React.SFC<{info: T.Info, close: () => void}> = (props) => {
    return(
        <S.Message
            onDismiss={props.close}
            negative={props.info.type == "error"}
            warning={props.info.type == "warning"}
            positive={props.info.type == "positive"}
        >
            <S.Message.Header>{props.info.header}</S.Message.Header>
            {props.info.body}
        </S.Message>
    )
}
