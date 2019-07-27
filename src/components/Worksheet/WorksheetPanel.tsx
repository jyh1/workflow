import * as React from 'react'
import { Container, SegmentGroup} from 'semantic-ui-react'
import * as T from '../Types'
import * as localforage from 'localforage'
import {PanelHeader} from './Header'
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
            <SegmentGroup >
                <PanelHeader selectWorksheet={this.changeWorksheet.bind(this)} uuid={content.uuid} />
                <SegmentGroup>
                    <Worksheet {...content} />
                </SegmentGroup>
            </SegmentGroup>
        )
    }
}