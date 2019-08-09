import * as React from "react"
import {Breadcrumb} from 'semantic-ui-react'
import * as _ from "lodash"
import {CD, ElementInfo} from './Types'

type Props = {cd: CD, path: ElementInfo[]}
export class ToolPath extends React.Component<Props, {}>{
    constructor(props: Props){
        super(props)
        this.state = {}
    }

    render(){
        const {path, cd} = this.props
        const length = path.length
        return (
            <Breadcrumb className="panel">
                {
                length == 0?
                    (<Breadcrumb.Divider>/</Breadcrumb.Divider>)
                    :
                    (_.map(path, (p, index) => {
                        const islast = index == length - 1
                        return(
                            <React.Fragment key={p.id}>
                                <Breadcrumb.Divider>/</Breadcrumb.Divider>
                                <Breadcrumb.Section 
                                    onClick=
                                        {islast ? null : (() => cd(p.id))}
                                        link={!islast} 
                                        active={islast}
                                >
                                    {p.name}
                                </Breadcrumb.Section>
                            </React.Fragment>
                        )
                    }))
                }
            </Breadcrumb>
        )

    }
}