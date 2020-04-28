import * as React from 'react'
import {Table, Loader, Popup} from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
import {humanFileSize} from '../algorithms'
import {bundleInfoReq, clReq} from '../Requests'
import { delay } from "q";

// bundle table
type BTProps = {bundles: T.BundleInfo[], report: (info: T.MessageInfo) => number}
type BTState = {}
export class BundleTable extends React.Component<BTProps, BTState>{
    render(){
        return (
                <Table selectable fixed singleLine compact='very'>
                    <Popup content="Double-click to remove entry"
                        trigger={
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell>uuid[0:8]</Table.HeaderCell>
                                <Table.HeaderCell>name</Table.HeaderCell>
                                <Table.HeaderCell>size</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        }
                    />
                    <Table.Body>
                        {... _.map(this.props.bundles,
                            b =>
                                (<BundleEntry
                                    report={this.props.report}
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
type BundleProps = {uuid: string, name: string, size: number, state: T.BundleState, report: (info: T.MessageInfo) => number}
type BundleState = {state: T.BundleState, size: number, removed: boolean}
class BundleEntry extends React.Component<BundleProps, BundleState>{
    _isMounted: boolean
    constructor(props: BundleProps){
        super(props)
        this._isMounted = false;
        this.state = {state: props.state, size: props.size, removed: false}
    }
    updateState(){
        const {state} = this.state
        const running = !notRunning(state)
        if (running){
            delay(5000 + 10000 * Math.random()) // alleviate the slow down when a large number of bundles in current worksheet are running at the same time
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

    removeBundle = () => {
        const {report} = this.props
        let rmAction = () => {
            const actioninfo: T.Info = {
                  type: "loading"
                , header: "Deleting " + this.props.name
                , body: <p>{this.props.uuid}</p>
            }
            const msgid = report(actioninfo)
            console.log(msgid)
            clReq("", "rm " + this.props.uuid)
            .then(() => {this._isMounted && this.setState(p => ({...p, removed: true}))})
            .then(() => {
                const succInfo: T.Info = {
                      type:"positive"
                    , header: this.props.name + " removed"
                    , body: <React.Fragment/>
                    , timeout: 1000
                    , update: {id: msgid}
                }
                this.props.report(succInfo)
            })
        }
        const info: T.ConfirmInfo = {
            header: "Delete bundle " + this.props.name + "?"
          , type: "confirm"
          , confirm: rmAction
        }
        report(info)
    }


    render(){
        const {uuid, name} = this.props
        const {state, removed} = this.state
        const running = !notRunning(state)
        const data_size = running? state : (this.state.size? humanFileSize(this.state.size) : "null")
        return(
            <Table.Row
                hidden={removed}
                warning={running}
                error={state == "failed"}
                draggable={true}
                onDoubleClick={this.removeBundle}
                onDragStart={this.dragStart}

            >
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