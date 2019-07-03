import * as React from "react";
import * as ReactDOM from "react-dom";
import {Header, List, Grid, Divider} from 'semantic-ui-react'
import {Node, Task, TaskElement, TaskFolder} from "./components/Types"
import {Canvas} from "./components/Canvas/Canvas"
import {renderTaskElementntList} from "./components/TaskList/TaskList"
import * as _ from "lodash"

import { SimpleDiagramWidget } from "./components/Hello";

require("./components/demo.scss");
require("./theme/galaxy/base.scss");


const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css";
document.head.appendChild(styleLink);

let defNode = (i: number): Node => (
    {
          name: "step" + i
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

ReactDOM.render(
    // <Hello compiler="TypeScript" framework="React" />,
    // <Container>
        <Grid celled divided="vertically" style={{height: "100%"}}>
            <Grid.Row columns={2}>
                <Grid.Column width={3}>
                    <Header as="h2">Tools</Header>
                    <Divider />
                    <List divided relaxed>
                        {...renderTaskElementntList(testtasks)}
                    </List>
                </Grid.Column>
                {/* <Grid.Column>
                    <Image src="https://react.semantic-ui.com/images/wireframe/paragraph.png"/>
                </Grid.Column> */}
                <Grid.Column width={10}>        
                    <Canvas nodes = {samples} />
                </Grid.Column>
            </Grid.Row>
        </Grid>,
    // </Container>,
    document.getElementById("example")
); 