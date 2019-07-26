import * as React from 'react'
import { Container} from 'semantic-ui-react'
import * as T from '../Types'
import * as localforage from 'localforage'
import {SelectWorksheet} from './Header'
import {Worksheet} from './Worksheet'

type Props = {refreshBundle: () => void, content: T.WorksheetContent}
type State = {}

export class WorksheetPanel extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
    }
    changeWorksheet(uuid: string){
        localforage.setItem("worksheet", uuid)
        .then(this.props.refreshBundle)
    }

    render(){
        // console.log(this.props.items)
        let {content} = this.props
        return(
            <Container fluid>
                <SelectWorksheet selectWorksheet={this.changeWorksheet.bind(this)} />
                <Worksheet items={content.items} uuid={content.uuid} />
            </Container>
        )
    }
}