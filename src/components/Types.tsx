import { string } from "prop-types";

export interface Tool {
    codaExpr: CodaVal;
    node: Node;
}

export interface CodaVal {};

export interface Dic {[index: string]: CodaType}

export interface CodaType {};


export interface Node {
    // uuid: string;
    name: string;
    pos: {x: number; y: number}
    // inports: [Dic];
    // outports: [Dic];
}
