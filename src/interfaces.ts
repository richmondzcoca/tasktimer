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