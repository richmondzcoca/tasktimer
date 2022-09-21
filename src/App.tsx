import React, { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import './App.scss';
import { GetTime, TruncateTime } from './helper';
import { TaskTimer } from './interfaces';

function App() {
  const startButtonText = {
    start: 'START',
    pause: 'PAUSE'
  }

  const buttonColor = {
    start: 'cyan',
    pause: 'chocolate'
  }

  const categoriesText = {
    show: 'SHOW CATEGORIES',
    hide: 'HIDE CATEGORIES'
  }

  const [hours, setHours] = useState('08')
  const [minutes, setMinutes] = useState('00')
  const [seconds, setSeconds] = useState('00')
  const [milliseconds, setMilliseconds] = useState(0)
  const [countDownButtonText, setCountDownButtonText] = useState(startButtonText.start)
  const [attrButtonColor, setAttrButtonColor] = useState(buttonColor.start)
  const [showCategories, setShowCategories] = useState(Boolean)
  const [stateCategoriesText, setStateCategoriesText] = useState(categoriesText.show)
  const [categoriesOptions, setCategoriesOptions] = useState([
    {
      name: 'One',
      isSelected: false
    },
    {
      name: 'Two',
      isSelected: true
    },
    {
      name: 'Three',
      isSelected: false
    }
  ])
  const [categoriesSelected, setCategoriesSelected] = useState('')

  const refTimeInterval: any = useRef()
  const refStartButton = useRef<HTMLButtonElement>(null)
  const refCategoriesInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const jsonData: TaskTimer = JSON.parse(localStorage.getItem('taskTimerData') as any)

    if(jsonData) {
      if(!jsonData.timeData.isPause) {
        const diff = (jsonData.timeData.countDownTime - new Date().getTime())
        const diffHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const diffSeconds = Math.floor((diff % (1000 * 60)) / 1000)
        const diffMilliseconds = Math.floor((diff % 1000))

        if(diff > 0) {
          setHours(TruncateTime(diffHours))
          setMinutes(TruncateTime(diffMinutes))
          setSeconds(TruncateTime(diffSeconds))
          setMilliseconds(diffMilliseconds)

          setTimeout(() => {
            refStartButton.current?.click()
          }, 100);
        }
        else {
          const taskTimerData = {
            timeData: {
              hours: "00",
              minutes: "00",
              seconds: "00",
              isPause: false,
              countDownTime: GetTime(0, 0, 0)
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
      cancelAnimationFrame(refTimeInterval.current)
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

        const countDownTime = GetTime(parseInt(hours), parseInt(minutes), parseInt(seconds), milliseconds)
        setCountDownButtonText(startButtonText.pause)
        setAttrButtonColor(buttonColor.pause)

        const animate = () => {
          const now = new Date().getTime()
          const distance = countDownTime - now

          if(distance < 0) {
            cancelAnimationFrame(refTimeInterval.current)
            taskTimerData.timeData.isPause = true
            setCountDownButtonText(startButtonText.start)
          }
          else {
            const intervalHours = TruncateTime(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
            const intervalMinutes = TruncateTime(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)))
            const intervalSeconds = TruncateTime(Math.floor((distance % (1000 * 60)) / 1000))
            const intervalMilliseconds = Math.floor(distance % 1000)

            taskTimerData = {
              timeData: {
                hours: intervalHours,
                minutes: intervalMinutes,
                seconds: intervalSeconds,
                isPause: false,
                countDownTime: GetTime(parseInt(intervalHours), parseInt(intervalMinutes), parseInt(intervalSeconds), intervalMilliseconds)
              }
            }

            setHours(intervalHours)
            setMinutes(intervalMinutes)
            setSeconds(intervalSeconds)
          }
  
          localStorage.setItem('taskTimerData', JSON.stringify(taskTimerData))
          refTimeInterval.current = requestAnimationFrame(animate)
        }

        refTimeInterval.current = requestAnimationFrame(animate)
        break;

      case 'pause':
        setCountDownButtonText(startButtonText.start)
        setAttrButtonColor(buttonColor.start)
        cancelAnimationFrame(refTimeInterval.current)
        
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

  const handleShowCategories = () => {
    setShowCategories(!showCategories)
    setStateCategoriesText(showCategories ? categoriesText.show : categoriesText.hide)
  }

  const handleOnChangeCategories = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategoriesSelected(e.target.value)
  }

  const onSubmitCategories = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if(refCategoriesInput.current?.value!) {
      setCategoriesOptions([{
        name: refCategoriesInput.current?.value!,
        isSelected: false
      }, ...categoriesOptions])
      setCategoriesSelected(refCategoriesInput.current?.value!)
      refCategoriesInput.current.value = ''
    }
  }

  return (
    <div className="app">
      <div className="author">Developed by: Richmond Z. Coca</div>
      <div className="container">
        <div className="timers">
          <button ref={refStartButton} data-color={attrButtonColor} onClick={startTimer}>{countDownButtonText}</button>
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
        <button className="show-categories" onClick={handleShowCategories}>{stateCategoriesText}</button>
        {
          showCategories &&
          <div className="categories">
            <form className="add-categories" onSubmit={onSubmitCategories}>
              <button>ADD</button>
              <input ref={refCategoriesInput} placeholder="Add categories" type="text" />
            </form>
            <select value={categoriesSelected} onChange={handleOnChangeCategories} aria-label="multiple select">
              {
                categoriesOptions.map( (optionData, index) =>
                  <option key={index} value={optionData.name}>{optionData.name}</option>
                )
              }
            </select>
          </div>
        }
      </div>
    </div>
  );
}

export default App;
