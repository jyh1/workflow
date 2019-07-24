import * as React from "react";
import {Header, List, Grid, Divider, Container} from 'semantic-ui-react'
import {Canvas} from "./Canvas/Canvas"
import {TaskElementListWidget} from "./TaskList/TaskList"
import {Node, Task, TaskElement, endPointPath} from "./Types"
import * as _ from "lodash"
import { Router, Route, Link, Redirect, withRouter, Switch, RouteProps } from 'react-router-dom';
// import {getLoginStatus} from "./MockRequests"
import {getLoginStatus} from "./Requests"
import { createBrowserHistory } from 'history';
import {Login} from "./Login";
import {WorksheetList} from './Worksheet/BundleList'
import * as T from './Types'
import {worksheetItemsReq} from './Requests'
import SplitPane from 'react-split-pane'
import '../theme/layout.scss'

type Props = {}
type State = {bundlelist: T.BundleInfo[]}

export class HomeApp extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {bundlelist: []}
    }
    componentDidMount(){
        this.refreshBundle()
    }
    refreshBundle(){
        let uuid = localStorage.getItem("worksheet")
        if (uuid){
            worksheetItemsReq(uuid)
            .then(res => this.setState(prev => Object.assign(prev, {bundlelist: res})))
        }
    }

    render(){
        let refreshBundle = this.refreshBundle.bind(this)
        return (
            <SplitPane split="vertical" defaultSize="16%" pane1Style={{overflowY: "auto"}}>
                <TaskElementListWidget/>
                <SplitPane split="vertical" defaultSize="72%" pane2Style={{overflowY: "auto"}}>
                    <Canvas nodes = {[]} refreshBundle={refreshBundle} />
                    <WorksheetList bundles={this.state.bundlelist} refreshBundle={refreshBundle} />
                </SplitPane>
            </SplitPane>
        )
    }
}


export const mainapp = () => (
    <Router history={createBrowserHistory({})}>
        <React.Fragment>
            <Switch>
                <Route path={endPointPath.login} component={Login} />
                <PrivateRoute path={endPointPath.mainapp} component={HomeApp}/>
            </Switch>
        </React.Fragment>
    </Router>
)


class PrivateRoute<T extends RouteProps = RouteProps> extends Route<T>{
    render(){
        let {component, ...rest} = this.props
        return(
            <Route
                {... rest}
                component={(props : object) =>(
                    getLoginStatus() ? 
                        (React.createElement(component, props)) : 
                        (<Redirect
                            to={{
                                pathname: endPointPath.login,
                                state: { from: this.props.location },
                            }}
                        />)
                )}
            />
        )
    }
}
