export type Path = {name: string, id: string}[]
export type CD = (dir: Path, isfolder: boolean) => void
export type EleProps = {
      cd: CD
    , current: Path
    , editing: boolean
    , save: (id: string, name: string, desc: string) => void
    , cancelEdit: () => void
    }