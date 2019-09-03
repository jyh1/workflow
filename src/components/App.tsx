import * as React from "react";
import {Canvas} from "./Canvas/Canvas"
import {ToolPanel} from "./Tool/ToolPanel"
import {endPointPath} from "./Types"
import * as _ from "lodash"
import { Router, Route, Redirect, Switch, RouteProps } from 'react-router-dom';
// import {getLoginStatus} from "./MockRequests"
import {getLoginStatus} from "./Requests"
import { createBrowserHistory, History } from 'history';
import {Login} from "./Login";
import {WorksheetPanel} from './Worksheet/WorksheetPanel'
import * as T from './Types'
import {worksheetItemsReq} from './Requests'
import SplitPane from 'react-split-pane'
import '../theme/layout.scss'
import * as localforage from 'localforage'
import * as S from 'semantic-ui-react'
import { ErrorList } from "./Errors/ErrorList";

type Props = {history: History<any> }
type State = {
      currentWorksheet: T.WorksheetContent
    , loadingWorksheet: boolean
    , codalang?: {ast: T.CodaLang, graph: T.NodeLayout}
    , infos: Map<number, T.Info>
    }

export class HomeApp extends React.Component<Props, State>{
    constructor(props: Props){
        super(props)
        this.state = {
              currentWorksheet: {items: [], uuid: "", name: ""}
            , loadingWorksheet: false
            , infos: new Map()
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

    doSave = (codalang: T.CodaLang, graph: T.NodeLayout) => {
        this.setState(p => Object.assign(p, {codalang: {ast: codalang, graph}}))
    }

    doneSave = () => {
        this.setState(p => Object.assign(p, {codalang: null}))
    }

    addException = (e: T.Info):number => {
        let timestamp
        if (e.update){
            timestamp = e.update.id
            if (!this.state.infos.has(timestamp)) {return timestamp}
        } else {
            timestamp = new Date().getTime()
        }
        let newinfos = new Map(this.state.infos)
        newinfos.set(timestamp, e)
        this.setState(p => ({...p, infos: newinfos}))
        return timestamp
    }
    removeException = (id: number) => {
        let newinfos = new Map(this.state.infos)
        newinfos.delete(id)
        this.setState(p => ({...p, infos: newinfos}))
    }


    render(){
        const refreshBundle = this.refreshBundle.bind(this)
        const changeWorksheet = this.changeWorksheet.bind(this)
        const {infos} = this.state
        let errors = Array.from(infos.entries())
        errors.sort((a, b) => a[0] < b[0]? -1 : 1)
        return (
            <React.Fragment>
                <ErrorList errors={errors} removeException={this.removeException}/>
                <Navigation history={this.props.history}/>
                <SplitPane split="vertical" defaultSize="16%" pane1Style={{overflowY: "auto"}}>
                    <ToolPanel report={this.addException} codalang={this.state.codalang} doneSave={this.doneSave}/>
                    <SplitPane split="vertical" defaultSize={385} primary="second" minSize={385} pane2Style={{overflowY: "auto"}}>
                        <Canvas report={this.addException} nodes = {[]} refreshBundle={refreshBundle} doSave={this.doSave} />
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


const Navigation: React.SFC<{history: History<any>}> = ({history}) => {
    const logout = () => {
        T.logOut()
        // history.push(endPointPath.login)
    }
    return (
        <S.Menu style={{margin: "0"}}>
            <S.MenuItem>
                <S.Header color="blue">Codalab Workflow</S.Header>
            </S.MenuItem>
            <S.Menu.Item position='right'>
                  <S.Button onClick={logout} basic color="blue" as='a'>
                    Log out
                  </S.Button>
            </S.Menu.Item>
        </S.Menu>
    )
}

export const mainapp = () => (
    <Router history={createBrowserHistory({})}>
        <Switch>
            <Route path={endPointPath.login} component={Login} />
            <PrivateRoute path={"/"} component={HomeApp}/>
        </Switch>
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
