import * as React from "react";
import * as ReactDOM from "react-dom";
import {Container, Image, Grid} from 'semantic-ui-react'
import {Node} from "./components/Types"
import {Canvas} from "./components/Canvas/Canvas"
// import { storiesOf, addDecorator } from "@storybook/react";
// import { setOptions } from "@storybook/addon-options";

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
        , pos: {x: 100 * i, y: 100}
        , taskid: i.toString()
        , inports: {dataset1: {}, dataset2: {}}
        , outports: {result: {}}
    })

let samples: Node[] = [
      defNode(1)
    , defNode(2)
    , defNode(3)
];

ReactDOM.render(
    // <Hello compiler="TypeScript" framework="React" />,
    // <Container>
        <Grid celled divided="vertically" style={{height: "100%"}}>
            <Grid.Row columns={2}>
                <Grid.Column width={3}>
                    <Image src="https://react.semantic-ui.com/images/wireframe/paragraph.png"/>
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