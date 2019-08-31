import * as ReactDOM from "react-dom";
import {mainapp} from './components/App'


require("./components/demo.scss");
require("./theme/galaxy/base.scss");

const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css";
document.head.appendChild(styleLink);


ReactDOM.render(
    // <Hello compiler="TypeScript" framework="React" />,
    // <Container>
        mainapp(),
    // </Container>,
    document.getElementById("example")
); 