import * as React from 'react'
import { Container, SegmentGroup, Placeholder, Segment} from 'semantic-ui-react'
import * as T from '../Types'
import * as localforage from 'localforage'
import {PanelHeader} from './Header'
import * as _ from "lodash"
import {Worksheet} from './Worksheet'

type Props = {changeWorksheet: () => void, content: T.WorksheetContent, loading: boolean}
type State = {}

export class WorksheetPanel extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
    }
    changeWorksheet(uuid: string){
        localforage.setItem("worksheet", uuid)
        .then(this.props.changeWorksheet)
    }

    render(){
        // console.log(this.props.items)
        const {content, loading} = this.props
        return(
            <div>
                <SegmentGroup>
                    <PanelHeader selectWorksheet={this.changeWorksheet.bind(this)} uuid={content.uuid} />
                    <SegmentGroup>
                        <Worksheet {...content} loading={loading} />
                    </SegmentGroup>
                </SegmentGroup>
            </div>
        )
    }
}