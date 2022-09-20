export const GetTime = (hours: number = 0, minutes: number = 0, seconds: number = 0) => {
    const currentTime = new Date().getTime()
    hours = hours * 60 * 60 * 1000
    minutes = minutes * 60 * 1000
    seconds = (seconds + 1) * 1000
    return new Date(currentTime + hours + minutes + seconds).getTime()
}

export const TruncateTime = (n: number) => {
    return (n < 10 ? '0' + n : n).toString()
}