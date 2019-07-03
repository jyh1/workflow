// mock request functions for dev
import {RequestTask, Task} from "./Types"

let newTask = (i: string): Task => (
    {
          taskid: i
        , inports: {dataset1: {}, dataset2: {}}
        , outports: {result: {}}
    }
    )


export let requestTask:RequestTask = (taskid) => (
    new Promise((executor, resolve) => {
        setTimeout(function() {
            executor(newTask(taskid));
        }, 300);
    })
)