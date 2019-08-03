import * as React from "react";
import {Canvas} from "./Canvas/Canvas"
import {ToolPanel} from "./Tool/ToolPanel"
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
type State = {currentWorksheet: T.WorksheetContent, loadingWorksheet: boolean}

export class HomeApp extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {currentWorksheet: {items: [], uuid: "", name: ""}, loadingWorksheet: false}
    }
    componentDidMount(){
        this.changeWorksheet()
    }
    refreshBundle(){
        return (localforage.getItem("worksheet")
        .then(uuid => ( uuid? worksheetItemsReq(uuid as string) : Promise.resolve({items: [], uuid: ""}) ))
        .then(res => this.setState(prev => Object.assign(prev, {currentWorksheet: res}))))
    }
    changeWorksheet(){
        this.setState(prev => Object.assign(prev, {loadingWorksheet: true}))
        this.refreshBundle().then(() => this.setState(prev => Object.assign(prev, {loadingWorksheet: false})))
    }

    render(){
        const refreshBundle = this.refreshBundle.bind(this)
        const changeWorksheet = this.changeWorksheet.bind(this)
        return (
            <SplitPane split="vertical" defaultSize="16%" pane1Style={{overflowY: "auto"}}>
                <ToolPanel/>
                <SplitPane split="vertical" defaultSize={385} primary="second" minSize={385} pane2Style={{overflowY: "auto"}}>
                    <Canvas nodes = {[]} refreshBundle={refreshBundle} />
                    <WorksheetPanel content={this.state.currentWorksheet} changeWorksheet={changeWorksheet} loading={this.state.loadingWorksheet} />
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
