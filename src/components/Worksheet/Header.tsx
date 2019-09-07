import * as React from 'react'
import {Dropdown, Segment, Button, Icon, Header, Input, Form, Popup } from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
import {worksheetsReq, clReq} from '../Requests'


export const WorksheetButtons: React.SFC<{uuid?: string, refreshPanel: (uuid: string) => void}> = (props) => {
    return(
        <Button.Group>
            <Popup flowing hoverable
                trigger={<Button icon="plus" basic color="blue"/>}
            >
                <NewWorsheetForm refreshPanel={props.refreshPanel}/>
            </Popup>
            <Popup flowing hoverable
                trigger={<Button icon="barcode" basic color="blue"/>}
            >
                <InputWorksheetUUID refreshPanel={props.refreshPanel}/>
            </Popup>
            <Popup
                content="Refresh Panel"
                trigger={
                    <Button 
                        icon="refresh" 
                        onClick={() => props.refreshPanel(props.uuid)}
                        basic color="blue"
                    />}
            />
        </Button.Group>
    )
}

type Props = {selectWorksheet: (uuid: string) => void, uuid?: string, worksheets: T.Worksheet[]}
type State = {}
export class WorksheetDropdown extends React.Component <Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {worksheets: []}
    }

    render(){
        let options = 
                _.map(
                    this.props.worksheets
                    , res => ({key: res.uuid, value: res.uuid, text: res.name})
                )
        return(
            <Segment>
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

type IProps = {refreshPanel: (uuid: string) => void}
class InputWorksheetUUID extends React.Component<IProps, {}>{
    constructor(props: MProps){
        super(props)
        this.state = {name: ""}
    }

    handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target
        const value = target.value
        if (value.length==34){
            this.props.refreshPanel(value)
        }
    }
    render(){
        return(
            <React.Fragment>
                <Header as="h4" content='Select worksheet by UUID' />
                <Form>
                    <Form.Field>
                        <Input placeholder='Worksheet uuid' onChange={this.handleInput}/>
                    </Form.Field>
                </Form>
                    
            </React.Fragment>
        )
    }

}