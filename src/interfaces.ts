export interface TaskTimer {
    hours: string,
    minutes: string,
    seconds: string,
    isPause: boolean,
    distance: number,
    countDownTime: number
}

export interface TaskCategories {
    name: string,
    isSelected: boolean
}

export interface TaskListInterface {
    name: string,
    taskCategory: string,
    isPlay: boolean,
    hours: string,
    minutes: string,
    seconds: string,
    elapsedTime: number,
    prevTime: number | null,
    hoursEquivalent: string
}

export interface StartStopWatchInterface {
    isPlay: boolean,
    taskIndex: number
}