import { string } from "prop-types";

export interface Tool {
    codaExpr: CodaVal;
    node: Node;
}

export interface CodaVal {};

export interface Arguments {[index: string]: CodaType}

export interface CodaType {};


export interface Node {
    taskid: string;
    name: string;
    pos: {x: number; y: number}
    inports: Arguments;
    outports: Arguments;
}
