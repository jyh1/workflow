import * as React from 'react'
import {Dropdown, Segment, Button, Icon, Header, Input, Modal } from 'semantic-ui-react'
import * as _ from 'lodash'
import * as T from '../Types'
import {worksheetsReq} from '../Requests'

type Props = {selectWorksheet: (uuid: string) => void, uuid?: string}
type State = {worksheets: T.Worksheet[], uuid?: string, newworksheet: boolean}

export class PanelHeader extends React.Component <Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {worksheets: [], newworksheet: false}
    }
    componentDidMount(){
        worksheetsReq()
        .then(res => this.setState(prev => Object.assign(prev, {worksheets: res, uuid: this.props.uuid})))
    }
    modalState = (s: boolean) => (() => this.setState(p => Object.assign(p, {newworksheet: s})))

    render(){
        let options = 
                _.map(
                    this.state.worksheets
                    , res => ({key: res.uuid, value: res.uuid, text: res.name})
                )
        const {newworksheet} = this.state
        return(
            <React.Fragment>
                <Segment className="worksheetheader">
                    <NewWorsheetModal close = {this.modalState(false)} isopen={newworksheet}/>
                    <Button basic color="blue" icon="plus" content="New Worksheet" onClick={this.modalState(true)} />
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

type MProps = {close: () => void, isopen: boolean}
type MState = {name: string}
class NewWorsheetModal extends React.Component<MProps, MState>{
    constructor(props: MProps){
        super(props)
        this.state = {name: ""}
    }

    handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target
        const value = target.value
        this.setState((prev) => Object.assign(prev, {name: value}));
    }

    createWorksheet = () => {
        console.log(this.state.name)
        this.props.close()
    }

    render(){
        const {close, isopen} = this.props
        return(
            <Modal open={isopen} onClose={close} id="newworksheetmodal">
                <Header as="h2" icon='plus square outline' content='Create New Worksheet' />
                <Modal.Content>
                    <Input fluid icon='file' iconPosition='left' placeholder='New worksheet name' onChange={this.handleInput}/>
                </Modal.Content>
                <Modal.Actions>
                    <Button basic onClick={close} >Cancel</Button>
                    <Button color='blue' onClick={this.createWorksheet}>
                        <Icon name='checkmark'/> Create
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

}