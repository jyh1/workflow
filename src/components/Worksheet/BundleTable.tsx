import * as React from 'react'
import {Table, Loader} from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
import {humanFileSize} from '../algorithms'
import {bundleInfoReq} from '../Requests'
import { delay } from "q";

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

const finishState: Set<T.BundleState> = new Set(["failed", "ready"])
const notRunning: ((s: T.BundleState) => boolean) = s => finishState.has(s)

// bundle entry
type BundleProps = {uuid: string, name: string, size: number, state: T.BundleState}
type BundleState = {state: T.BundleState, size: number}
class BundleEntry extends React.Component<BundleProps, BundleState>{
    _isMounted: boolean
    constructor(props: BundleProps){
        super(props)
        this._isMounted = false;
        this.state = {state: props.state, size: props.size}
    }
    updateState(){
        const {state} = this.state
        const running = !notRunning(state)
        if (running){
            delay(5000)
            .then(() => bundleInfoReq(this.props.uuid))
            .then(res => this._isMounted && this.setState(prev => Object.assign(prev, {state: res.state, size: res.metadata.data_size})))
            .then(() => this._isMounted && this.updateState())
        }
    }
    componentWillUnmount() {
        this._isMounted = false;
    }

    componentDidMount(){
        this._isMounted = true;
        this.updateState()
    }
    
    dragStart: React.DragEventHandler = (event) => {
        const dragdata: T.BundleDragType = {uuid: this.props.uuid, name: this.props.name}
        event.dataTransfer.setData(T.bundleTag
            , JSON.stringify(dragdata)); 
    }


    render(){
        const {uuid, name} = this.props
        const {state} = this.state
        const running = !notRunning(state)
        const data_size = running? state : (this.state.size? humanFileSize(this.state.size) : "null")
        return(
            <Table.Row warning={running} error={state == "failed"} draggable={true} onClick={() => console.log('click')} onDragStart={this.dragStart}>
                <Table.Cell collapsing>
                    <a target="_blank" href={T.endPointPath.codalab + "bundles/" + uuid} onClick={e => e.stopPropagation()}>
                        {uuid.substring(0, 8)}
                    </a>
                </Table.Cell>
                <Table.Cell collapsing>{name}</Table.Cell>
                <Table.Cell collapsing><Loader size="mini" active={running} inline />{data_size}</Table.Cell>
            </Table.Row>
        )
    }
}