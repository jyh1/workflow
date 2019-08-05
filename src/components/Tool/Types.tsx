export type Path = {name: string, id: string}[]
export type CD = (dir: Path) => void
export type EleProps = {cd: CD, current: Path, editing: boolean, save: (name: string, desc: string) => void}