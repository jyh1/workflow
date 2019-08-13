import * as React from 'react'
import * as _ from 'lodash'
import {Header, Segment, SegmentGroup, Dimmer, Loader} from 'semantic-ui-react'
import * as T from '../Types'
import {BundleTable} from './BundleTable'
import {MarkupText} from './Markup'

type Props = T.WorksheetContent & {loading: boolean}
type State = {}

export class Worksheet extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
    }
    render(){
        const {items, uuid, name, title} = this.props
        const headername = title? title: name
        return(
            <React.Fragment>
                <Header as='h2' dividing textAlign='center' attached='top' color="blue">
                    <a href={T.endPointPath.codalab + "worksheets/" + uuid} target="_blank">
                        {headername}
                    </a>
                </Header>
                <Segment attached>
                    {... _.map(items, (item, ind) => <WorksheetItem key={uuid + ind} item={item} />)}
                </Segment>
                <Dimmer active={this.props.loading} inverted>
					<Loader inverted content='Loading' />
				</Dimmer>
            </React.Fragment>
        )
    }
}

const WorksheetItem: React.SFC<{item: T.WorksheetItem}> = (props) => {
    // console.log(props.item)
    if (props.item.type == "bundles"){
        return( <BundleTable bundles={props.item.content} />)
    }
    if (props.item.type == "markup"){
        return( <MarkupText text={props.item.content}/> )
    }
}
