import * as React from 'react'
import {Dropdown, Segment, Button, Icon, Grid } from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
import {worksheetsReq} from '../Requests'

type Props = {selectWorksheet: (uuid: string) => void, uuid?: string}
type State = {worksheets: T.Worksheet[], uuid?: string}

export class PanelHeader extends React.Component <Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {worksheets: []}
    }
    componentDidMount(){
        worksheetsReq()
        .then(res => this.setState(prev => Object.assign(prev, {worksheets: res, uuid: this.props.uuid})))
    }
    render(){
        let options = _.map(this.state.worksheets, res => ({key: res.uuid, value: res.uuid, text: res.name}))
        return(
                <Segment>
                            <span>
                                Current worksheet: {' '}
                                <Dropdown
                                    inline
                                    options={options}
                                    onChange={(event, data) => {this.props.selectWorksheet(data.value as string)}}
                                    value={this.props.uuid}
                                />  
                            </span>  
                </Segment>              
        )
    }
}