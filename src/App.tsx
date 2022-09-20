import React, { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import './App.scss';
import { GetTime, TruncateTime } from './helper';
import { TaskTimer } from './interfaces';

function App() {
  const startButtonText = {
    start: 'START',
    pause: 'PAUSE'
  }

  const [hours, setHours] = useState('00')
  const [minutes, setMinutes] = useState('00')
  const [seconds, setSeconds] = useState('00')
  const [countDownButtonText, setCountDownButtonText] = useState(startButtonText.start)

  const timeInterval: any = useRef()
  const startButton: any = useRef()

  useEffect(() => {
    const jsonData: TaskTimer = JSON.parse(localStorage.getItem('taskTimerData') as any)

    if(jsonData) {
      if(!jsonData.timeData.isPause) {
        const diffMilliseconds = (jsonData.timeData.countDownTime - new Date().getTime())
        const diffHours = Math.floor((diffMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const diffMinutes = Math.floor((diffMilliseconds % (1000 * 60 * 60)) / (1000 * 60))
        const diffSeconds = Math.floor((diffMilliseconds % (1000 * 60)) / 1000)

        if(diffMilliseconds > 0) {
          setHours(TruncateTime(diffHours))
          setMinutes(TruncateTime(diffMinutes))
          setSeconds(TruncateTime(diffSeconds));

          setTimeout(() => {
            startButton.current.click()
          }, 100);
        }
        else {
          const taskTimerData = {
            timeData: {
              hours,
              minutes,
              seconds,
              isPause: false,
              countDownTime: GetTime(parseInt(hours), parseInt(minutes), parseInt(seconds))
            }
          }
  
          localStorage.setItem('taskTimerData', JSON.stringify(taskTimerData))
        }
      }
      else {
        setHours(TruncateTime(parseInt(jsonData.timeData.hours)))
        setMinutes(TruncateTime(parseInt(jsonData.timeData.minutes)))
        setSeconds(TruncateTime(parseInt(jsonData.timeData.seconds)))
      }
    }

    return () => {
      clearInterval(timeInterval.current)
    }
  }, [])
  
  

  const onKeyUp = (e: KeyboardEvent, type: string) => {
    if(e.key === 'Backspace') {
      switch (type) {
        case 'hours':
          setHours('')          
          break;

        case 'minutes':
          setMinutes('')
          break;

        case 'seconds':
          setSeconds('')
          break;
      
        default:
          break;
      }
    }
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>, type: string) => {
    switch (type) {
      case 'hours':
        setHours(e.target.value)
        break;

      case 'minutes':
        setMinutes(e.target.value)
        break;

      case 'seconds':
        setSeconds(e.target.value)
        break;
    
      default:
        break;
    }
  }

  const onBlur = (e: ChangeEvent<HTMLInputElement>, type: string) => {
    const value = e.target.value === '' ? '0' : e.target.value
    
    switch (type) {
      case 'hours':
        parseInt(value) < 10 ? setHours("0" + parseInt(value)) : setHours(value)
        break;

      case 'minutes':
        parseInt(value) < 10 ? setMinutes("0" + parseInt(value)) : setMinutes(value)
        break;

      case 'seconds':
        parseInt(value) < 10 ? setSeconds("0" + parseInt(value)) : setSeconds(value)
        break;
    
      default:
        break;
    }
  }

  const startTimer = (e: any) => {
    let taskTimerData: TaskTimer
    
    switch (e.target.textContent.toLowerCase()) {
      case 'start':
        if(parseInt(hours) === 0 && parseInt(minutes) === 0 && parseInt(seconds) === 0) {
          return
        }

        const countDownTime = GetTime(parseInt(hours), parseInt(minutes), parseInt(seconds))
        setCountDownButtonText(startButtonText.pause)

        timeInterval.current = setInterval(() => {
          const now = new Date().getTime()
          const distance = countDownTime - now

          console.log("distance: ", distance)

          if(distance < 0) {
            clearInterval(timeInterval.current)
            taskTimerData.timeData.isPause = true
            setCountDownButtonText(startButtonText.start)
          }
          else {
            const intervalHours = TruncateTime(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
            const intervalMinutes = TruncateTime(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)))
            const intervalSeconds = TruncateTime(Math.floor((distance % (1000 * 60)) / 1000))

            taskTimerData = {
              timeData: {
                hours: intervalHours,
                minutes: intervalMinutes,
                seconds: intervalSeconds,
                isPause: false,
                countDownTime: GetTime(parseInt(intervalHours), parseInt(intervalMinutes), parseInt(intervalSeconds))
              }
            }

            setHours(intervalHours)
            setMinutes(intervalMinutes)
            setSeconds(intervalSeconds)
          }
  
          localStorage.setItem('taskTimerData', JSON.stringify(taskTimerData))
        }, 1000)
        break;

      case 'pause':
        setCountDownButtonText(startButtonText.start)
        clearInterval(timeInterval.current)
        timeInterval.current = null
        
        taskTimerData = {
          timeData: {
            hours,
            minutes,
            seconds,
            isPause: true,
            countDownTime: GetTime(parseInt(hours), parseInt(minutes), parseInt(seconds))
          }
        }

        localStorage.setItem('taskTimerData', JSON.stringify(taskTimerData))
        break;
    
      default:
        break;
    }
  }

  return (
    <div className="app">
      <div className="container">
        <div className="timers">
          <button ref={startButton} onClick={startTimer}>{countDownButtonText}</button>
          <div className="timer" data-text="hours">
            <input
              onKeyUp={(e) => onKeyUp(e, 'hours')}
              onChange={(e) => onChange(e, 'hours')}
              onBlur={(e) => onBlur(e, 'hours')}
              value={hours} type="text" pattern="\d*" maxLength={2}
            />
          </div>
          <span>:</span>
          <div className="timer" data-text="minutes">
            <input
              onKeyUp={(e) => onKeyUp(e, 'minutes')}
              onChange={(e) => onChange(e, 'minutes')}
              onBlur={(e) => onBlur(e, 'minutes')}
              value={minutes} type="text" pattern="\d*" maxLength={2}
            />
          </div>
          <span>:</span>
          <div className="timer" data-text="seconds">
            <input
              onKeyUp={(e) => onKeyUp(e, 'seconds')}
              onChange={(e) => onChange(e, 'seconds')}
              onBlur={(e) => onBlur(e, 'seconds')}
              value={seconds} type="text" pattern="\d*" maxLength={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
