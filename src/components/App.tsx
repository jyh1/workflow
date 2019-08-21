import * as React from "react";
import {Canvas} from "./Canvas/Canvas"
import {ToolPanel} from "./Tool/ToolPanel"
import {endPointPath} from "./Types"
import * as _ from "lodash"
import { Router, Route, Redirect, Switch, RouteProps } from 'react-router-dom';
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
import * as S from 'semantic-ui-react'
import { ErrorList } from "./Errors/ErrorList";

type Props = {}
type State = {
      currentWorksheet: T.WorksheetContent
    , loadingWorksheet: boolean
    , codalang?: T.CodaLang
    , errors: T.Exception[]
    }

export class HomeApp extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {
              currentWorksheet: {items: [], uuid: "", name: ""}
            , loadingWorksheet: false
            , errors: []
        }
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

    doSave = (codalang: T.CodaLang) => {
        this.setState(p => Object.assign(p, {codalang}))
    }

    doneSave = () => {
        this.setState(p => Object.assign(p, {codalang: null}))
    }

    addException = (e: T.Exception) => {
        this.setState(p => ({...p, errors: p.errors.concat(e)}))
    }
    removeException = (ind: number) => {
        this.setState(p => ({...p, errors: [].concat(p.errors.slice(0, ind), p.errors.slice(ind + 1))}))
    }


    render(){
        const refreshBundle = this.refreshBundle.bind(this)
        const changeWorksheet = this.changeWorksheet.bind(this)
        const {errors} = this.state
        return (
            <React.Fragment>
                <ErrorList errors={errors} removeException={this.removeException}/>
                <SplitPane split="vertical" defaultSize="16%" pane1Style={{overflowY: "auto"}}>
                    <ToolPanel codalang={this.state.codalang} doneSave={this.doneSave}/>
                    <SplitPane split="vertical" defaultSize={385} primary="second" minSize={385} pane2Style={{overflowY: "auto"}}>
                        <Canvas error={this.addException} nodes = {[]} refreshBundle={refreshBundle} doSave={this.doSave} />
                        <WorksheetPanel 
                            refreshBundle={refreshBundle} 
                            content={this.state.currentWorksheet} 
                            changeWorksheet={changeWorksheet} 
                            loading={this.state.loadingWorksheet} 
                        />
                    </SplitPane>
                </SplitPane>
            </React.Fragment>
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
