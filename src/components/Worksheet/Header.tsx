import * as React from 'react'
import {Dropdown, Segment, Button, Icon, Header, Input, Form, Popup } from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
import {worksheetsReq, clReq, worksheetNameReq} from '../Requests'

type BProps = {uuid?: string, refreshPanel: (uuid: string) => void}
type BState = {home: string, dashboard: string}

export class WorksheetButtons extends React.Component<BProps, BState>{
    constructor(props: BProps){
        super(props)
        this.state={home: null, dashboard: null}
    }
    componentDidMount(){
        worksheetNameReq("home")
        .then(home => this.setState(p => ({...p, home})))
        worksheetNameReq("dashboard")
        .then(dashboard => this.setState(p => ({...p, dashboard})))
    }
    render(){
        const props = this.props
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
                    content="Home"
                    trigger={
                        <Button
                            icon="home"
                            basic
                            disabled={this.state.home? false : true}
                            onClick={() => props.refreshPanel(this.state.home)}
                            color="blue"
                        />}
                />
                <Popup
                    content="Dashboard"
                    trigger={
                        <Button
                            icon="dashboard"
                            disabled={this.state.dashboard? false : true}
                            onClick={() => props.refreshPanel(this.state.dashboard)}
                            basic
                            color="blue"
                        />}
                />
                <Popup
                    content="Refresh Panel"
                    trigger={
                        <Button 
                            icon="refresh" 
                            onClick={() => props.refreshPanel(props.uuid)}
                            basic color="blue"
                        />}
                />
            </Button.Group>)
        }
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
type IState = {uuid: string}
class InputWorksheetUUID extends React.Component<IProps, IState>{
    constructor(props: MProps){
        super(props)
        this.state = {uuid: ""}
    }

    handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target
        const value = target.value
        this.setState(p => ({...p, uuid: value}))
        if (value.length==34){
            this.props.refreshPanel(value)
        }
    }
    searchName = () => {
        worksheetNameReq(this.state.uuid)
        .then(res => this.props.refreshPanel(res))
    }
    render(){
        return(
            <React.Fragment>
                <Header as="h4" content='Select Worksheet' />
                <Form>
                    <Form.Field>
                        <Input placeholder='Worksheet name or UUID' onChange={this.handleInput}/>
                    </Form.Field>
                    <Button basic color='blue' onClick={this.searchName}>
                        <Icon name='search'/> Search
                    </Button>
                </Form>
                    
            </React.Fragment>
        )
    }

}