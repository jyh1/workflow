import * as T from './Types'
import * as _ from 'lodash'
import {quote} from './algorithms'
import {clReq} from './Requests'


type Env = Map<string, Promise<string>>

const worksheet = "0x4329e2c6d58c4312aad5a0df042eea95"

function buildPath(r: string, ps: string[]):string{
    let psc = ps.slice()
    psc.unshift(r)
    return (psc.join('/'))
}

function resolveJNormalRes(env: Env, res: T.JNormalRes): Promise<string>{
    if (res.type === "variable"){
        return (env.get(res.content))
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

function resolveDep(env: Env, dep: T.Dep): Promise<string>{
    let name = dep[0]
    return (resolveJNormalRes(env, dep[1])
        .then(val => name+":"+val)
    )
}

function resolveDeps(env: Env, deps: T.Deps): Promise<string[]>{
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

function resolveCMDEle(env: Env, e: T.CMDEle): Promise<string>{
    if('root' in e){
        return Promise.resolve(buildPath(e.root, e.path))
    }
    if('type' in e){
        return (resolveJNormalRes(env, e))
    }
}

function resolveCMDEles(env: Env, es: T.CMDEle[]): Promise<string>{
    return(
        Promise.all(_.map(es, x => resolveCMDEle(env, x)))
        .then(ss => quote(ss))
    )
}

function clrun(env: Env, opts: T.ClOption[], cmd: T.CMDEle[], deps: T.Deps): Promise<string>{
    let depstr = resolveDeps(env, deps)
    let optstr = resolveClOpts(env, opts)
    let cmdstr = resolveCMDEles(env, cmd)
    return (Promise.all([optstr, depstr, cmdstr])
    .then (xs => quote(["cl", "run"].concat(...xs)))
    .then (xs => clReq(worksheet, xs))
    )
}

function clmake(env: Env, deps: T.Deps): Promise<string>{
    throw "not implemented"
}

function clcat(env: Env, bundle: T.JNormalRes): Promise<string>{
    throw "not implemented"
}


function resolveJBlock(env: Env, blk: T.JBlock): void{
    // console.log(blk)
    // console.log(blk.command)
    let cmd = blk.command
    if(cmd.type == "run"){
        env.set(blk.variable, clrun(env, blk.options, cmd.content.cmd, cmd.content.dependencies))
    }
    if(cmd.type == "lit"){
        env.set(blk.variable, resolveJRes(env, cmd.content))
    }
    if(cmd.type == "make"){
        env.set(blk.variable, clmake(env, cmd.content))
    }
    if(cmd.type == "cat"){
        env.set(blk.variable, clcat(env, cmd.content))
    }
}

function resolveJRes(env: Env, res: T.JRes):Promise<string>{
    if (res.type == "record"){
        throw "not implemented"
    } else {
        return (resolveJNormalRes(env, res))
    }
}

export function evalJLang(code: T.JLang): Promise<string>{
    let env: Env = new Map()
    console.log(code)
    _.map(code.blocks, b => resolveJBlock(env, b))
    return resolveJRes(env, code.result)
}