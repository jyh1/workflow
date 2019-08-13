import * as React from 'react'

import {Button} from 'semantic-ui-react'
import {uploadFileReq} from '../Requests'
import * as _ from "lodash"

type Props = {worksheet: string, refreshBundle: () => void}
type State = {}
export class UploadButton extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
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
                <div className="upload-btn-wrapper">
                    <input type='file' onChange={this.uploadBundle.bind(this)} multiple />
                    <Button 
                        primary 
                        color="blue" 
                        content="Upload"
                        id='upload-bundle-button'
                    />
                </div>
                <br style={{clear: "both"}}/>
            </React.Fragment>
        )
    }
}

