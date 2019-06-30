import * as React from "react";
import * as ReactDOM from "react-dom";
import {Container, Image, Grid} from 'semantic-ui-react'
// import { storiesOf, addDecorator } from "@storybook/react";
// import { setOptions } from "@storybook/addon-options";

import { SimpleDiagramWidget } from "./components/Hello";

require("./components/demo.scss");

const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css";
document.head.appendChild(styleLink);

ReactDOM.render(
    // <Hello compiler="TypeScript" framework="React" />,
    // <Container>
        <Grid celled divided="vertically">
            <Grid.Row columns={2}>
                <Grid.Column width={3}>
                    <Image src="https://react.semantic-ui.com/images/wireframe/paragraph.png"/>
                </Grid.Column>
                {/* <Grid.Column>
                    <Image src="https://react.semantic-ui.com/images/wireframe/paragraph.png"/>
                </Grid.Column> */}
                <Grid.Column width={10}>        
                    <div className="srd-demo-workspace">
                        <div className = "srd-demo-workspace__content"><SimpleDiagramWidget /></div>
                    </div>
                </Grid.Column>
            </Grid.Row>
        </Grid>,
    // </Container>,
    document.getElementById("example")
); 