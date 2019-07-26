import * as React from "react";
import {Canvas} from "./Canvas/Canvas"
import {TaskElementListWidget} from "./TaskList/TaskList"
import {endPointPath} from "./Types"
import * as _ from "lodash"
import { Router, Route, Link, Redirect, withRouter, Switch, RouteProps } from 'react-router-dom';
// import {getLoginStatus} from "./MockRequests"
import {getLoginStatus} from "./Requests"
import { createBrowserHistory } from 'history';
import {Login} from "./Login";
import {WorksheetPanel} from './Worksheet/WorksheetPanel'
import * as T from './Types'
import {worksheetItemsReq} from './Requests'
import SplitPane from 'react-split-pane'
import '../theme/layout.scss'
import * as localforage from 'localforage'

type Props = {}
type State = {currentWorksheet: T.WorksheetContent}

export class HomeApp extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {currentWorksheet: {items: [], uuid: ""}}
    }
    componentDidMount(){
        this.refreshBundle()
    }
    refreshBundle(){
        localforage.getItem("worksheet")
        .then(uuid => ( uuid? worksheetItemsReq(uuid as string) : Promise.resolve({items: [], uuid: ""}) ))
        .then(res => this.setState(prev => Object.assign(prev, {currentWorksheet: res})))
    }

    render(){
        let refreshBundle = this.refreshBundle.bind(this)
        return (
            <SplitPane split="vertical" defaultSize="16%" pane1Style={{overflowY: "auto"}}>
                <TaskElementListWidget/>
                <SplitPane split="vertical" defaultSize="72%" pane2Style={{overflowY: "auto"}}>
                    <Canvas nodes = {[]} refreshBundle={refreshBundle} />
                    <WorksheetPanel content={this.state.currentWorksheet} refreshBundle={refreshBundle} />
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
