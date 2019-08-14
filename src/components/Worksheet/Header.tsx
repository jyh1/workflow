import * as React from 'react'
import {Dropdown, Segment, Button, Icon, Header, Input, Form, Popup } from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
import {worksheetsReq, clReq} from '../Requests'

type Props = {selectWorksheet: (uuid: string) => void, uuid?: string}
type State = {worksheets: T.Worksheet[]}

export class PanelHeader extends React.Component <Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {worksheets: []}
    }
    refreshPanel(uuid: string){
        this.refreshWorksheetList()
        .then(() => this.props.selectWorksheet(uuid))
    }
    refreshWorksheetList(){
        const req = worksheetsReq().then(res => this.setState(p => ({...p, worksheets: res})))
        return req
    }
    componentDidMount(){
        this.refreshWorksheetList()
    }
    modalState = (s: boolean) => (() => this.setState(p => Object.assign(p, {newworksheet: s})))

    render(){
        let options = 
                _.map(
                    this.state.worksheets
                    , res => ({key: res.uuid, value: res.uuid, text: res.name})
                )
        return(
            <React.Fragment>
                <Segment className="worksheetheader">
                    <Button.Group basic color="blue">
                        <Popup flowing hoverable
                            trigger={<Button icon="plus" />}
                        >
                            <NewWorsheetForm refreshPanel={this.refreshPanel.bind(this)}/>
                        </Popup>
                        <Popup
                            content="Input UUID"
                            trigger={<Button icon="barcode"/>}
                        />
                        <Popup
                            content="Refresh Panel"
                            trigger={
                                <Button 
                                    icon="refresh" 
                                    onClick={() => this.refreshPanel.bind(this)(this.props.uuid)}
                                />}
                        />
                    </Button.Group>
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

type MProps = {refreshPanel: (uuid: string) => void}
type MState = {name: string}
class NewWorsheetForm extends React.Component<MProps, MState>{
    constructor(props: MProps){
        super(props)
        this.state = {name: ""}
    }

    handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target
        const value = target.value
        this.setState((prev) => ({...prev, name: value}));
    }
    createWorksheet(){
        clReq("", 'cl new ' + this.state.name)
        .then(newuuid => this.props.refreshPanel(newuuid))
    }

    render(){
        return(
            <React.Fragment>
                <Header as="h4" content='New Worksheet' />
                <Form>
                    <Form.Field>
                        <Input placeholder='Worksheet name' onChange={this.handleInput}/>
                    </Form.Field>
                    <Button basic color='blue' onClick={this.createWorksheet.bind(this)}>
                        <Icon name='plus'/> Create
                    </Button>
                </Form>
                    
            </React.Fragment>
        )
    }

}
