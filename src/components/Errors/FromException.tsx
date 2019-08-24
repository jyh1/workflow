import * as T from "../Types"
import * as React from "react"
import * as Anser from 'anser';

export function fromException(e: T.Exception): T.Info {
    let header: string
    switch (e.type){
        case "parser":
            header = "Parse Error"
            break
        case "type":
            header = "Type Error"
            break
    }
    return ({type: "error", header: header ,body: <EditorInfo info={e.info}/>})
}


const EditorInfo: React.SFC<{info: string}> = (props) => {
    const infoHtml = Anser.ansiToHtml(props.info)
    return(
        <React.Fragment>
            <div className="infobody" id="editorinfo" dangerouslySetInnerHTML={{__html: infoHtml.replace(/\n/g, "<br>")}}/>
        </React.Fragment>

    )
}
