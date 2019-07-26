import * as T from './Types'
import * as _ from 'lodash'
import {quote} from './algorithms'
import {clReq, clWait} from './Requests'
import { string } from 'prop-types';
import * as localforage from 'localforage'


type Env = {env: Map<string, Promise<string>>, worksheet: string, clReq: T.ClRequest}

function buildPath(r: string, ps: string[]):string{
    let psc = ps.slice()
    psc.unshift(r)
    return (psc.join('/'))
}

function buildDep(n: string, b: string): string{
    return (n + ":" + b)
}

function resolveJNormalRes(env: Env, res: T.JNormalRes): Promise<string>{
    // console.log(res)
    if (res.type === "variable"){
        return (env.env.get(res.content))
    }
    if (res.type === "value"){
        return (Promise.resolve(res.content))
    }
    if (res.type === "dir"){
        let ps = res.content.path
        return (
            resolveJNormalRes(env, res.content.root)
            .then( (r) => buildPath(r, ps) )
        )
    }
}

function resolveDep(env: Env, dep: T.Dep): Promise<[string, string]>{
    let name = dep[0]
    // console.log(dep)
    return (resolveJNormalRes(env, dep[1])
        .then(val => [name, val])
    )
}

type DepResult = {alias: Map<string, string>, deps: string[]}

function uniqDeps(deps: [string, string][]): DepResult {
    type Bundle = string
    type Name = string
    let newdeps: string[] = []
    let alias: Map<Name, Name> = new Map()
    let uniqName: Map<Bundle, Name> = new Map()
    for(let [name, bundle] of deps){
        if(uniqName.has(bundle)){
            alias.set(name, uniqName.get(bundle))
        } else {
            alias.set(name, name)
            uniqName.set(bundle, name)
            newdeps.push(buildDep(name, bundle))
        }
    }
    return {alias, deps: newdeps}
}

function resolveDeps(env: Env, deps: T.Deps): Promise<[string, string][]>{
    return (
        Promise.all(_.map(deps, x => resolveDep(env, x)))
    )
}

function resolveClOpt(env: Env, opt: T.ClOption): Promise<[string, string]>{
    let name = "--" + opt[0]
    return (
        resolveJNormalRes(env, opt[1])
        .then(res => [name, res])
    )
}

function resolveClOpts(env: Env, opts: T.ClOption[]): Promise<string[]>{
    return(
        Promise.all(_.map(opts, opt => resolveClOpt(env, opt)))
        .then(res => [].concat(...res))
    )
}

function resolveCMDEle(env: Env, alias: Map<string, string>, e: T.CMDEle): Promise<string>{
    if (e.type == "quote"){
        return (resolveJNormalRes(env, e.content)
                .then(str => quote([str]))
            )
    } else {
        return Promise.resolve(e.content)
    }
}

function resolveCMDEles(env: Env, alias: Map<string, string>, es: T.CMDEle[]): Promise<string>{
    return(
        Promise.all(_.map(es, x => resolveCMDEle(env, alias, x)))
        .then(ss => ss.join(''))
    )
}

function clrun(env: Env, opts: T.ClOption[], cmd: T.CMDEle[], deps: T.Deps): Promise<string>{        
    let depres = resolveDeps(env, deps).then (x => uniqDeps(x))
    let depstr = depres.then(x => x.deps)
    let optstr = resolveClOpts(env, opts)
    let cmdstr = depres.then(x => resolveCMDEles(env, x.alias, cmd))
    return (Promise.all([optstr, depstr, cmdstr])
    .then (xs => quote(["cl", "run"].concat(...xs)))
    .then (xs => env.clReq(env.worksheet, xs))
    )
}

function clmake(env: Env, opts: T.ClOption[], deps: T.Deps): Promise<string>{
    return(
        Promise.all([resolveClOpts(env, opts), resolveDeps(env, deps).then(xs => _.map(xs, arr => buildDep(...arr)))])
        .then(xs => quote(["cl", "make"].concat(...xs)))
        .then(x => env.clReq(env.worksheet, x))
    )
}

function clcat(env: Env, bundle: T.JNormalRes): Promise<string>{
    return (
        resolveJNormalRes(env, bundle)
        .then(clWait)
        .then(x => (quote(["cl", "cat", x])))
        .then(x => env.clReq(env.worksheet, x))
        .then(res => {let strs = res.split('\n'); strs.pop(); return strs.join('\n')})
    )
}


function resolveJBlock(env: Env, blk: T.JBlock): void{
    // console.log(blk)
    // console.log(blk.command)
    let options = blk.options.slice()
    options.unshift(["name", {type: "value", content: blk.variable}])
    let cmd = blk.command
    if(cmd.type == "run"){
        env.env.set(blk.variable, clrun(env, options, cmd.content.cmd, cmd.content.dependencies))
    }
    if(cmd.type == "lit"){
        env.env.set(blk.variable, Promise.resolve(cmd.content))
    }
    if(cmd.type == "make"){
        env.env.set(blk.variable, clmake(env, options, cmd.content))
    }
    if(cmd.type == "cat"){
        env.env.set(blk.variable, clcat(env, cmd.content))
    }
}

function resolveJRes(env: Env, res: T.JRes):Promise<string>{
    if (res.type == "record"){
        return Promise.resolve('record result')
    } else {
        return (resolveJNormalRes(env, res))
    }
}

export function evalJLang(code: T.JLang, req: T.ClRequest = clReq): Promise<string>{
    return (localforage.getItem("worksheet")
            .then(worksheet => {
                if (worksheet == null){
                    throw "No worksheet"
                }
                let env: Env = {env: new Map(), worksheet: worksheet as string, clReq:req}
                // console.log(code)
                _.map(code.blocks, b => resolveJBlock(env, b))
                return resolveJRes(env, code.result)
            } )
    )
}