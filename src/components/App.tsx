import * as React from "react";
import {Header, List, Grid, Divider, Container} from 'semantic-ui-react'
import {Canvas} from "./Canvas/Canvas"
import {renderTaskElementntList} from "./TaskList/TaskList"
import {Node, Task, TaskElement, endPointPath} from "./Types"
import * as _ from "lodash"
import { Router, Route, Link, Redirect, withRouter, Switch, RouteProps } from 'react-router-dom';
import {getLoginStatus} from "./MockRequests"
import { createBrowserHistory } from 'history';
import {Login} from "./Login";


let defNode = (i: number): Node => (
    {
          name: "stepx" + i
        , pos: {x: 300 * i, y: 100}
        , taskInfo: defTask(i.toString())
    })

let defTask = (i:string):Task => (
    {
        taskid: i
      , inports: {dataset1: {}
      , dataset2: {}}
      , outports: {result: {}}
      , name: "task" + i
  }
)
let defTaskLis = (is: string[]):Task[] => (_.map(is, defTask))

let samples: Node[] = [
      defNode(1)
    , defNode(2)
    , defNode(3)
];

let taskfoldr = {name: "folder1", 
    contents: [
              ...defTaskLis(["run1", "run2"])
            , {name: "folder2", contents: defTaskLis(["a1", "a2"])}
            ]
    }

let testtasks: TaskElement[] = [
      ...defTaskLis(["s1", "s2", "s3"])
    , taskfoldr
    , ...defTaskLis(["q1", "q2", "q3"])
]

export const HomeApp = () => (
    <Grid celled divided="vertically" style={{height: "100%"}}>
        <Grid.Row columns={2}>
            <Grid.Column width={3}>
                <Header as="h2">Tools</Header>
                <Divider />
                <List divided relaxed>
                    {...renderTaskElementntList(testtasks)}
                </List>
            </Grid.Column>
            <Grid.Column width={10}>        
                <Canvas nodes = {samples} />
            </Grid.Column>
        </Grid.Row>
    </Grid>
    )

export const mainapp = () => (
    <Router history={createBrowserHistory({})}>
        <React.Fragment>
            <Route path={endPointPath.login} component={Login} />
            <PrivateRoute path={endPointPath.mainapp} component={HomeApp}/>
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
