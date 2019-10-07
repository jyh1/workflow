import * as React from 'react'
import * as _ from 'lodash'
import {Header, Segment, Table, Dimmer, Loader, Button, Popup} from 'semantic-ui-react'
import * as T from '../Types'
import {BundleTable} from './BundleTable'
import {UploadButton} from './UploadButton'
import {MarkupText} from './Markup'

const worksheetLink = (uuid: string) => T.endPointPath.codalab + "worksheets/" + uuid

type Props = T.WorksheetContent & 
    {loading: boolean, refreshBundle: () => void, selectWorksheet: (uuid: string) => void, goBack: () => void}
type State = {}

export class Worksheet extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
    }
    render(){
        const {items, uuid, name, title, refreshBundle, selectWorksheet} = this.props
        const headername = title? title: name
        const displayItems = items.length == 0 ? 
            <div className="emptyWorksheet">(Empty)</div>
            :(<React.Fragment>
                {... _.map(items, (item, ind) => <WorksheetItem selectWorksheet={selectWorksheet} key={uuid + ind} item={item} />)}
            </React.Fragment>)
        return(
            <React.Fragment>
                <Header as='h2' dividing textAlign='center' attached='top' color="blue">
                    <a href={worksheetLink(uuid)} target="_blank">
                        {headername}
                    </a>
                </Header>
                <Segment attached style={{paddingTop: "5px"}}>
                    <Button.Group floated="right">
                        <Popup content='Go Back' position='bottom right' trigger = {
                            <Button icon="arrow left" basic color="blue" onClick={this.props.goBack}/>
                        }
                        />
                        <UploadButton worksheet={uuid} refreshBundle={refreshBundle}/>
                    </Button.Group>
                    <br style={{clear: "both"}}/>
                    {displayItems}
                </Segment>
                <Dimmer active={this.props.loading} inverted>
					<Loader inverted content='Loading' />
				</Dimmer>
            </React.Fragment>
        )
    }
}

const WorksheetItem: React.SFC<{item: T.WorksheetItem, selectWorksheet: (uuid: string) => void}> = (props) => {
    // console.log(props.item)
    if (props.item.type == "bundles"){
        return( <BundleTable bundles={props.item.content} />)
    }
    if (props.item.type == "markup"){
        return( <MarkupText text={props.item.content}/> )
    }
    if (props.item.type=="subworksheets"){
        return(<Subworksheets worksheets={props.item.content} selectWorksheet={props.selectWorksheet}/>)
    }
}

const Subworksheets: React.SFC<{worksheets: T.Worksheet[], selectWorksheet: (uuid: string) => void}> = (props) => {
    return(
        <Table selectable fixed singleLine compact='very'>
            <Table.Body>
                {... _.map(props.worksheets, 
                    b => (<Table.Row key={b.uuid}>
                            <Table.Cell 
                                collapsing
                                onClick={() => props.selectWorksheet(b.uuid)}
                                style={{paddingLeft: "50px"}}
                            >
                                    <a onClick={e => e.stopPropagation()} href={worksheetLink(b.uuid)} target="_blank">
                                        {b.title? (b.title + " " + "[" + b.name + "]") : b.name}
                                    </a>
                            </Table.Cell>
                        </Table.Row>))
                }
            </Table.Body>
        </Table>
    )
}