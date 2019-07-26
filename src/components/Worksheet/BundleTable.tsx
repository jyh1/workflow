import * as React from 'react'
import {Table} from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
import {humanFileSize} from '../algorithms'

// bundle table
type BTProps = {bundles: T.BundleInfo[]}
type BTState = {}
export class BundleTable extends React.Component<BTProps, BTState>{
    render(){
        return (
                <Table selectable fixed singleLine compact='very'>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>uuid[0:8]</Table.HeaderCell>
                            <Table.HeaderCell>name</Table.HeaderCell>
                            <Table.HeaderCell>size</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {... _.map(this.props.bundles, 
                            b => 
                                (<BundleEntry 
                                    uuid={b.uuid} 
                                    name={b.metadata.name} 
                                    size={b.metadata.data_size} 
                                    state={b.state}
                                    key = {b.uuid}
                                />))
                        }
                    </Table.Body>
                </Table>
        )
    }
}


// bundle entry
type BundleProps = {uuid: string, name: string, size: number, state: string}
type BundleState = {state: string}
class BundleEntry extends React.Component<BundleProps, BundleState>{
    constructor(props: BundleProps){
        super(props)
        this.state = {state: this.props.state ? this.props.state : "ready"}
    }
    render(){
        let {uuid, name} = this.props
        let data_size = this.props.size? humanFileSize(this.props.size) : "null"
        return(
            <Table.Row draggable={true} onClick={() => console.log('click')}>
                <Table.Cell collapsing>{uuid.substring(0, 8)}</Table.Cell>
                <Table.Cell collapsing>{name}</Table.Cell>
                <Table.Cell collapsing>{data_size}</Table.Cell>
            </Table.Row>
        )
    }
}