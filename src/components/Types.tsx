import { string } from "prop-types";

export interface Tool {
    codaExpr: CodaVal;
    node: Node;
}

export interface CodaVal {};

export interface Arguments {[index: string]: CodaType}

export interface CodaType {};


export interface Node {
    name: string
    pos: {x: number; y: number}
    taskInfo: Task
}

export interface Task {
    name: string;
    taskid: string;
    inports: Arguments;
    outports: Arguments;
}

export const taskTag = "task"

export type TaskFolder = {name: string; contents: TaskElement[]}
export type TaskElement = TaskFolder | Task

export type LoginRequest = (username: string, password: string) => Promise<{}>

export const endPointPath = {
      login: "/login"
    , mainapp: "/"
}