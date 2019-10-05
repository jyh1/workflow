import * as marked from 'marked';
import * as React from 'react'

export const MarkupText: React.SFC<{text: string}> = (props) => {
    let content = marked(props.text, {sanitize: true})
    return (
        <div className={"ws-item"}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    )
}