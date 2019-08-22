import * as T from "../Types"
import * as React from "react"
import * as _ from "lodash"
import * as S from 'semantic-ui-react'
import { instanceOf } from "prop-types";

type Props = {
      errors: [number, T.Info][]
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
                {_.map(errors, (val) => (<ErrorMsg info={val[1]} key={val[0]} close={() => removeException(val[0])}/>))}
            </div>
        )
    }
}

const ErrorMsg: React.SFC<{info: T.Info, close: () => void}> = (props) => {
    switch(props.info.type){
        case "warning":
            setTimeout(props.close, 5000)
            break
        case "positive":
            setTimeout(props.close, 3000)
            break
    }
    const isloading = props.info.type == "loading"
    return(
        <S.Message
            onDismiss={props.close}
            negative={props.info.type == "error"}
            warning={props.info.type == "warning"}
            positive={props.info.type == "positive"}
            icon={isloading}
        >
            {isloading ? <S.Icon name='circle notched' loading /> : <React.Fragment/>}
            <S.MessageContent>
                <S.Message.Header>{props.info.header}</S.Message.Header>
                {props.info.body}
            </S.MessageContent>
        </S.Message>
    )
}
