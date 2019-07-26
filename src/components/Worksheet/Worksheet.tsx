import * as React from 'react'
import * as _ from 'lodash'
import * as T from '../Types'
import {BundleTable} from './BundleTable'
import {MarkupText} from './Markup'

type Props = {items: T.WorksheetItem[], uuid: string}
type State = {}

export class Worksheet extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
    }
    render(){
        let {items, uuid} = this.props
        return(
            <div>
                {... _.map(items, (item, ind) => <WorksheetItem key={uuid + ind} item={item} />)}
            </div>
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
