export interface TaskTimer {
    timeData: {
        hours: string,
        minutes: string,
        seconds: string,
        isPause: boolean,
        countDownTime: number
    }
}