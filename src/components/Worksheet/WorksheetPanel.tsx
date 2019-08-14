import * as React from 'react'
import { SegmentGroup, Menu, Segment} from 'semantic-ui-react'
import * as T from '../Types'
import * as localforage from 'localforage'
import {WorksheetDropdown, WorksheetButtons} from './Header'
import * as _ from "lodash"
import {Worksheet} from './Worksheet'
import {worksheetsReq} from '../Requests'


type Props = {
      changeWorksheet: () => void
    , content: T.WorksheetContent
    , loading: boolean
    , refreshBundle: () => void
}
type State = {worksheets: T.Worksheet[]}

export class WorksheetPanel extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {worksheets: []}
    }
    changeWorksheet(uuid: string){
        localforage.setItem("worksheet", uuid)
        .then(this.props.changeWorksheet)
    }

    refreshWorksheetList(){
        const req = worksheetsReq().then(res => this.setState(p => ({...p, worksheets: res})))
        return req
    }

    refreshPanel(uuid: string){
        this.refreshWorksheetList()
        .then(() => this.changeWorksheet(uuid))
    }

    componentDidMount(){
        this.refreshWorksheetList()
    }

    render(){
        // console.log(this.props.items)
        const {content, loading, refreshBundle} = this.props
        return(
            <React.Fragment>
                <div className="worksheetbuttons">
                    <WorksheetButtons refreshPanel={this.refreshPanel.bind(this)} uuid={content.uuid}/>
                </div>
                <SegmentGroup className="newsegment">
                    <WorksheetDropdown selectWorksheet={this.changeWorksheet.bind(this)} uuid={content.uuid} worksheets={this.state.worksheets} />
                    <SegmentGroup>
                        <Worksheet {...content} loading={loading} refreshBundle={refreshBundle} selectWorksheet={this.changeWorksheet.bind(this)}/>
                    </SegmentGroup>
                </SegmentGroup>
            </React.Fragment>
        )
    }
}