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
            <Grid celled divided="vertically" style={{height: "100%"}}>
                <Grid.Row columns={3}>
                    <Grid.Column width={3}>
                        <TaskElementListWidget/>
                    </Grid.Column>
                    <Grid.Column width={10}>        
                        <Canvas nodes = {[]} refreshBundle={refreshBundle} />
                    </Grid.Column>
                    <Grid.Column width={3}>
                        <WorksheetList bundles={this.state.bundlelist} refreshBundle={refreshBundle} />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
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
