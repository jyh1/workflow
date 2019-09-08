import * as React from 'react'

import {Button, Popup} from 'semantic-ui-react'
import {uploadFileReq} from '../Requests'
import * as _ from "lodash"

type Props = {worksheet: string, refreshBundle: () => void}
type State = {}
export class UploadButton extends React.Component<Props, State>{
    inputElement: any
    constructor(props: Props){
        super(props)
        this.inputElement = React.createRef();
    }
    uploadBundle(e: React.ChangeEvent<HTMLInputElement>){
        e.stopPropagation()
        e.preventDefault()
        const files = e.target.files
        if (files.length > 0){
            const {worksheet, refreshBundle} = this.props
            const reqs = _.map(files, f => uploadFileReq(worksheet, f))
            Promise.all(reqs).then(this.props.refreshBundle)            
        }
    }
    render(){
        return(
            <React.Fragment>
                <input type='file' style={{ display: "none" }} ref={this.inputElement} onChange={this.uploadBundle.bind(this)} multiple />
                <Popup content='Upload Files' position='bottom right' trigger = {
                    <Button 
                        basic
                        color="blue" 
                        icon="upload"
                        onClick={() => this.inputElement.current.click()}
                    />
                }/>
            </React.Fragment>
        )
    }
}

