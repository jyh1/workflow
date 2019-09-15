import * as ReactDOM from "react-dom";
import {mainapp} from './components/App'

require("./components/demo.scss");
require("./theme/galaxy/base.scss");
import 'semantic-ui-css/semantic.min.css'
ReactDOM.render(
    mainapp(),
    document.getElementById("example")
); 