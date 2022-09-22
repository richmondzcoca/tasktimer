export interface TaskTimer {
    hours: string,
    minutes: string,
    seconds: string,
    isPause: boolean,
    countDownTime: number
}

export interface TaskCategories {
    name: string,
    isSelected: boolean
}

export interface TaskListInterface {
    name: string,
    taskCategory: string,
    isPause: boolean,
    hours: string,
    minutes: string,
    seconds: string
}