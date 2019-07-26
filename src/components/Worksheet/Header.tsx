import * as React from 'react'
import {Dropdown } from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
import {worksheetsReq} from '../Requests'

type Props = {selectWorksheet: (uuid: string) => void}
type State = {worksheets: T.Worksheet[]}

export class SelectWorksheet extends React.Component <Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {worksheets: []}
    }
    componentDidMount(){
        worksheetsReq()
        .then(res => this.setState(prev => Object.assign(prev, {worksheets: res})))
    }
    render(){
        let options = _.map(this.state.worksheets, res => ({key: res.uuid, value: res.uuid, text: res.name}))
        return(
            <Dropdown
                placeholder='Select Worksheet'
                search
                selection
                options={options}
                onChange={(event, data) => this.props.selectWorksheet(data.value as string)}
            />
        )
    }
}