import * as React from 'react'
import {Dropdown, Segment, Button, Icon, Grid, Input } from 'semantic-ui-react'
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
        let options = 
                _.map(
                    this.state.worksheets
                    , res => ({key: res.uuid, value: res.uuid, text: res.name})
                )
        return(
            <React.Fragment>
                <Segment>
                    <Button basic color="blue" icon="plus" content="New Worksheet"/>
                    <Button basic color="blue" icon="barcode" content="Input UUID"/>                    
                    <br/>
                    <span>
                        Your worksheet: {' '}
                        <Dropdown
                            inline
                            options={options}
                            onChange={(event, data) => {this.props.selectWorksheet(data.value as string)}}
                            value={this.props.uuid}
                        />  
                    </span>
                </Segment>
            </React.Fragment>            
        )
    }
}