import * as _ from 'lodash'

export class Graph {
    indegree: Map<string, number>
    edge: Map<string, string[]>
    constructor(){
        this.indegree = new Map()
        this.edge = new Map()
    }
    addNode(node: string){
        if(this.indegree.has(node)){ return } else {this.indegree.set(node, 0)}
    }
    addEdge(s: string, t: string){
        this.addNode(s)
        this.addNode(t)
        this.indegree.set(t, this.indegree.get(t) + 1)
        if (this.edge.has(s))
            { this.edge.get(s).push(t)} else {this.edge.set(s, [t])}
    }

    topoSort():string[]{
        let sorted: string[] = []
        let counts = new Map(this.indegree)
        for(let [node, ind] of counts){
            if(ind == 0){
                sorted.push(node)
            }
        }
        // removing node from graph
        for(let s of sorted){
            if (this.edge.has(s)){
                let targets = this.edge.get(s)
                for (let t of targets){
                    let tn = counts.get(t) - 1
                    counts.set(t, tn)
                    if(tn == 0){
                        sorted.push(t)
                    }
                }
            }
        }

        if(sorted.length != counts.size){
            // contain circle
            let sortedSet = new Set(sorted)
            throw [...counts.keys()].filter(x => !sortedSet.has(x))
        }

        return sorted

    }
}

// https://github.com/substack/node-shell-quote
export let quote = function (xs: string[]) {
    let strs = _.map(xs, function (s) {
        if (/["\s]/.test(s) && !/'/.test(s)) {
            return "'" + s.replace(/(['\\])/g, '\\$1') + "'";
        }
        else if (/["'\s]/.test(s)) {
            return '"' + s.replace(/(["\\$`!])/g, '\\$1') + '"';
        }
        else {
            return String(s).replace(/([#!"$&'()*,:;<=>?@\[\\\]^`{|}])/g, '\\$1'); 
        }
    })
    return strs.join(" ")
};


export const debounce = (func: () => void, delay: number) => {
    let inDebounce: NodeJS.Timeout
    return function() {
      clearTimeout(inDebounce)
      inDebounce = setTimeout(func, delay)
    }
}