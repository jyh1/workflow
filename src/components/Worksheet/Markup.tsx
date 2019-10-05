import * as marked from 'marked';
import * as React from 'react'

import * as DOMPurify from 'dompurify'

export const MarkupText: React.SFC<{text: string}> = (props) => {
    let content = DOMPurify.sanitize(marked(props.text))
    return (
        <div className={"ws-item"}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    )
}