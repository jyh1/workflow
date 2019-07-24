import * as React from 'react'
import { Container, Table } from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
// import {worksheetItemsReq} from '../MockRequests'
import {SelectWorksheet} from './Worksheet'

type Props = {refreshBundle: () => void, bundles: T.BundleInfo[]}
type State = {}

export class WorksheetList extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
    }
    changeWorksheet(uuid: string){
        localStorage.setItem("worksheet", uuid)
        this.props.refreshBundle()
    }

    render(){
        return(
            <Container fluid>
                <SelectWorksheet selectWorksheet={this.changeWorksheet.bind(this)} />
                <Table selectable celled striped>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>uuid[0:8]</Table.HeaderCell>
                            <Table.HeaderCell>name</Table.HeaderCell>
                            <Table.HeaderCell>summary</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {... _.map(this.props.bundles, 
                            b => 
                                (<BundleEntry 
                                    uuid={b.uuid} 
                                    name={b.metadata.name} 
                                    command={b.command} 
                                    state={b.state}
                                    key = {b.uuid}
                                />))
                        }
                    </Table.Body>
                </Table>
            </Container>
        )
    }
}

type BundleProps = {uuid: string, name: string, command?: string, state: string}
type BundleState = {state: string}
export class BundleEntry extends React.Component<BundleProps, BundleState>{
    summary: string
    constructor(props: BundleProps){
        super(props)
        this.state = {state: this.props.state ? this.props.state : "ready"}
        this.summary = this.props.command? "! " + this.props.command : "[uploaded]"
    }
    render(){
        let {uuid, name} = this.props
        return(
            <Table.Row draggable={true} onClick={() => console.log('click')}>
                <Table.Cell collapsing>{uuid.substring(0, 8)}</Table.Cell>
                <Table.Cell collapsing>{name}</Table.Cell>
                <Table.Cell collapsing>{this.summary}</Table.Cell>
            </Table.Row>
        )
    }
}