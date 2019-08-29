import * as T from "../Types"
import * as React from "react"
import * as _ from "lodash"
import * as S from 'semantic-ui-react'
import { instanceOf } from "prop-types";

type Props = {
      errors: [number, T.MessageInfo][]
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
                {_.map(errors, (val) => (<InfoMsg info={val[1]} key={val[0]} close={() => removeException(val[0])}/>))}
            </div>
        )
    }
}

const InfoMsg: React.SFC<{info: T.MessageInfo, close: () => void}> = (props) => {
    switch(props.info.type){
        case "confirm":
            const {confirm, header} = props.info
            const info: T.Info = 
                {header: header
                    , type: "warning"
                    , body: (
                        <React.Fragment>
                            <br/>
                            <S.Button size="small" basic onClick={props.close} negative content="Cancel"/>
                            <S.Button size="small" basic onClick={() => {confirm(); props.close()}} positive content="Yes" />
                        </React.Fragment>)
                }
            return (<ErrorMsg info={info} close = {props.close} />)
        default:
            return (<ErrorMsg info={props.info} close = {props.close} />)
    }
}

const ErrorMsg: React.SFC<{info: T.Info, close: () => void}> = (props) => {
    if (props.info.timeout){
        setTimeout(props.close, props.info.timeout)
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
