export type ElementId = string
export type CD = (current: ElementId) => void
export type EleProps = {
      cd: CD
    , path: ElementInfo[]
    , editing: boolean
    , save: (id: ElementId, name: string, desc: string) => void
    , cancelEdit: () => void
    , selectable: boolean
    }
export type ElementInfo = {id: ElementId, name: string, isfolder: boolean, parent: ElementId}