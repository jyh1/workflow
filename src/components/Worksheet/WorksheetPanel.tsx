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
    , report: (err: T.Info) => number
}
type State = {worksheets: T.Worksheet[], stack: string[]}

export class WorksheetPanel extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {worksheets: [], stack: []}
    }
    selectWorksheet(uuid: string){
        localforage.setItem("worksheet", uuid)
        .then(this.props.changeWorksheet)
    }

    changeWorksheet(uuid: string){
        this.setState(p => {
            const len = p.stack.length
            let stack = p.stack
            if (len > 10){ stack = stack.slice(-10)}
            const newstack = stack[len - 1] == uuid ? stack : stack.concat([uuid])
            return({...p, stack: newstack})
        })
        this.selectWorksheet(uuid)
    }

    goBack = () => {
        const {stack} = this.state
        const len = stack.length
        if (len <= 1){return}
        this.selectWorksheet(stack[len - 2])
        this.setState(p => ({...p, stack: stack.slice(0, len - 1)}))
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
        const {content, loading, refreshBundle, report} = this.props
        return(
            <React.Fragment>
                <div className="worksheetbuttons">
                    <WorksheetButtons report={report} refreshPanel={this.refreshPanel.bind(this)} uuid={content.uuid}/>
                </div>
                <SegmentGroup className="newsegment">
                    <WorksheetDropdown selectWorksheet={this.changeWorksheet.bind(this)} uuid={content.uuid} worksheets={this.state.worksheets} />
                    <SegmentGroup>
                        <Worksheet report={report} goBack={this.goBack} {...content} loading={loading} refreshBundle={refreshBundle} selectWorksheet={this.changeWorksheet.bind(this)}/>
                    </SegmentGroup>
                </SegmentGroup>
            </React.Fragment>
        )
    }
}