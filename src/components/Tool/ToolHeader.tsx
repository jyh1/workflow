import * as React from "react"
import {Breadcrumb} from 'semantic-ui-react'
import * as _ from "lodash"
import {Path, CD} from './Types'

type Props = {cd: CD, current: Path}
export class ToolPath extends React.Component<Props, {}>{
    constructor(props: Props){
        super(props)
        this.state = {}
    }

    render(){
        const {current, cd} = this.props
        const length = current.length
        return (
            <Breadcrumb className="panel">
                {
                length == 0?
                    (<Breadcrumb.Divider>/</Breadcrumb.Divider>)
                    :
                    (_.map(current, (p, index) => {
                        const islast = index == length - 1
                        return(
                            <React.Fragment key={p.id}>
                                <Breadcrumb.Divider>/</Breadcrumb.Divider>
                                <Breadcrumb.Section 
                                    onClick=
                                        {islast ? null : (() => cd(current.slice(0, index + 1), !islast))}
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