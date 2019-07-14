import { string } from "prop-types";

export interface Tool {
    codaExpr: CodaVal;
    node: Node;
}

export interface CodaVal {};

export type Arguments = string[]

export interface CodaType {};


export interface Node {
    name: string
    pos: {x: number; y: number}
    taskid: TaskId
}

export type TaskId = string

export interface Task {
    taskid: TaskId;
    inports: Arguments;
    outports: Arguments;
}

export const taskTag = "task"
export type TaskDragType = {name: string, id: string}

export type TaskElement = {name: string, id: string, description: string} & ({children: TaskElement[]} | {taskid: TaskId})

export type TaskListElementId = string
export type TaskListElement = {name: string; taskid?: TaskId; parent?: TaskListElementId; id: TaskListElementId; description: string}

// requests
export type LoginRequest = (username: string, password: string) => Promise<{}>
export type TaskListRequest = () => Promise<TaskListElement[]>
export type TaskInfoRequest = (taskid: TaskId) => Promise<Task>

export const endPointPath = {
      login: "/login"
    , mainapp: "/"
}