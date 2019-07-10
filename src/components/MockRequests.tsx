// mock request functions for dev
import {LoginRequest} from "./Types"

export const loginReq: LoginRequest = (username, password) => (
    new Promise((executor, resolve) => {
        setTimeout(
            () => {
                if (username==="codalab" && password === "123456"){
                    isLogin = true
                    executor({})
                } else {
                    resolve()
                }
            }
        , 300)
    })
)

let isLogin = false

export const getLoginStatus = () => (isLogin)

// let newTask = (i: string): Task => (
//     {
//           taskid: i
//         , inports: {dataset1: {}, dataset2: {}}
//         , outports: {result: {}}
//     }
//     )


// export let requestTask:RequestTask = (taskid) => (
//     new Promise((executor, resolve) => {
//         setTimeout(function() {
//             executor(newTask(taskid));
//         }, 300);
//     })
// )