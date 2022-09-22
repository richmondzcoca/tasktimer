import { TaskCategories, TaskListInterface, TaskTimer } from "./interfaces"

export const GetTime = (hours: number = 0, minutes: number = 0, seconds: number = 0, milliseconds: number = 0) => {
    const currentTime = new Date().getTime()
    hours = hours * 60 * 60 * 1000
    minutes = minutes * 60 * 1000
    seconds = seconds * 1000
    return new Date(currentTime + hours + minutes + seconds + milliseconds).getTime()
}

export const TruncateTime = (n: number) => {
    return (n < 10 ? '0' + n : n).toString()
}

export const getTaskTimerData = () => {
    const jsonData: TaskTimer = JSON.parse(localStorage.getItem('taskTimerData') || '{}')
    return jsonData
}

export const addTaskTimerData = (data: TaskTimer) => {
    localStorage.setItem('taskTimerData', JSON.stringify(data))
}

export const getTaskCategories = () => {
    const jsonData: TaskCategories[] = JSON.parse(localStorage.getItem('taskTimerCategories') || '[]')
    return jsonData
}

export const addTaskCategories = (data: TaskCategories[]) => {
    localStorage.setItem('taskTimerCategories', JSON.stringify(data))
}

export const getTaskList = () => {
    return JSON.parse(localStorage.getItem('taskListData') || '[]') as TaskListInterface[]
}

export const addTaskList = (data: TaskListInterface[]) => {
    localStorage.setItem('taskListData', JSON.stringify(data))
}