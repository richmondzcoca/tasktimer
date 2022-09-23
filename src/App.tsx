import React, { ChangeEvent, FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import './App.scss';
import { addTaskCategories, addTaskList, getTaskCategories, getTaskList, getTaskTimerData, GetTime, TruncateTime } from './helper';
import { StartStopWatchInterface, TaskCategories, TaskListInterface, TaskTimer } from './interfaces';

function App() {
  const categoriesText = {
    show: 'SHOW CATEGORIES',
    hide: 'HIDE CATEGORIES'
  }

  const [hours, setHours] = useState('08')
  const [minutes, setMinutes] = useState('00')
  const [seconds, setSeconds] = useState('00')
  const [milliseconds, setMilliseconds] = useState(0)
  const [showCategories, setShowCategories] = useState(Boolean)
  const [stateCategoriesText, setStateCategoriesText] = useState(categoriesText.show)
  const [categoriesOptions, setCategoriesOptions] = useState<TaskCategories[]>([])
  const [categoriesSelected, setCategoriesSelected] = useState('')
  const [taskList, setTaskList] = useState<TaskListInterface[]>([])
  const [taskName, setTaskName] = useState('')
  const [startStopWatch, setStartStopWatch] = useState<StartStopWatchInterface>()

  const refTimeInterval: any = useRef()
  const refStopWatch: any = useRef()
  const refCategoriesInput = useRef<HTMLInputElement>(null)
  const refSelectCategories = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    let index: null | number = null
    getTaskList().map((task, i) => task.isPlay === true ? index = i : task)

    if(index !== null) {
      setStartStopWatch({
        isPlay: true,
        taskIndex: index
      })
    }

    setCategoriesOptions(getTaskCategories())
    setTaskList(getTaskList())

    return () => {
      cancelAnimationFrame(refTimeInterval.current)
    }
  }, [])

  useEffect(() => {
    if(categoriesOptions.length) {
      setCategoriesSelected(categoriesOptions.filter(option => option.isSelected === true)[0]?.name)
    }
    addTaskCategories(categoriesOptions)
  }, [categoriesOptions])

  const updateTaskList = useCallback((index: number, elapsedTime: number, prevTime: number) => {
    const time = updateTime(elapsedTime)
    const hours = TruncateTime(time.hours)
    const minutes = TruncateTime(time.minutes)
    const seconds = TruncateTime(time.seconds)

    const taskList = getTaskList().map((task, i) => i === index ? {
      ...task,
      hours,
      minutes,
      seconds,
      elapsedTime,
      prevTime
    } : task)
    setTaskList(taskList)
    addTaskList(taskList)
  },[])

  useEffect(() => {
    const startTimerCountdown = (type: string) => {
      let taskTimerData: TaskTimer
      
      switch (type) {
        case 'start':
          if(parseInt(hours) === 0 && parseInt(minutes) === 0 && parseInt(seconds) === 0) {
            return
          }
  
          const countDownTime = GetTime(parseInt(hours), parseInt(minutes), parseInt(seconds), milliseconds)
  
          const animate = () => {
            const now = new Date().getTime()
            const distance = countDownTime - now
  
            if(distance < 0) {
              cancelAnimationFrame(refTimeInterval.current)
              taskTimerData.isPause = true
            }
            else {
              const intervalHours = TruncateTime(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
              const intervalMinutes = TruncateTime(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)))
              const intervalSeconds = TruncateTime(Math.floor((distance % (1000 * 60)) / 1000))
              const intervalMilliseconds = Math.floor(distance % 1000)
  
              taskTimerData = {
                hours: intervalHours,
                minutes: intervalMinutes,
                seconds: intervalSeconds,
                isPause: false,
                countDownTime: GetTime(parseInt(intervalHours), parseInt(intervalMinutes), parseInt(intervalSeconds), intervalMilliseconds)
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
          cancelAnimationFrame(refTimeInterval.current)
          
          const storageTaskTimerData = getTaskTimerData() 
          localStorage.setItem('taskTimerData', JSON.stringify({...storageTaskTimerData, isPause: true}))
          break;
      
        default:
          break;
      }
    }
    
    const jsonData: TaskTimer = JSON.parse(localStorage.getItem('taskTimerData') as any)

    if(jsonData) {
      if(!jsonData.isPause) {
        const diff = (jsonData.countDownTime - new Date().getTime())
        const diffHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const diffSeconds = Math.floor((diff % (1000 * 60)) / 1000)
        const diffMilliseconds = Math.floor((diff % 1000))

        if(diff > 0) {
          setHours(TruncateTime(diffHours))
          setMinutes(TruncateTime(diffMinutes))
          setSeconds(TruncateTime(diffSeconds))
          setMilliseconds(diffMilliseconds)
        }
        else {
          const taskTimerData = {
            hours: "00",
            minutes: "00",
            seconds: "00",
            isPause: false,
            countDownTime: GetTime(0, 0, 0)
          }
  
          localStorage.setItem('taskTimerData', JSON.stringify(taskTimerData))
        }
      }
      else {
        setHours(TruncateTime(parseInt(jsonData.hours)))
        setMinutes(TruncateTime(parseInt(jsonData.minutes)))
        setSeconds(TruncateTime(parseInt(jsonData.seconds)))
      }
    }

    if(startStopWatch) {
      if(startStopWatch?.isPlay) {
        const taskListData = getTaskList().filter((task, i) => i === startStopWatch?.taskIndex)[0]
        let prevTime = taskListData.prevTime ? taskListData.prevTime : new Date().getTime()
        let elapsedTime = taskListData.elapsedTime

        const animate = () => {
          elapsedTime += new Date().getTime() - prevTime;
          prevTime = new Date().getTime()
        
          updateTaskList(startStopWatch?.taskIndex!, elapsedTime, prevTime)
          refStopWatch.current = requestAnimationFrame(animate)
        }
        refStopWatch.current = requestAnimationFrame(animate)
        startTimerCountdown('start')
      }
      else {
        cancelAnimationFrame(refStopWatch.current)
        const taskList = getTaskList().map((task, i) => i === startStopWatch?.taskIndex ? {
          ...task,
          prevTime: null
        } : task)
        setTaskList(taskList)
        addTaskList(taskList)
        startTimerCountdown('pause')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startStopWatch, updateTaskList])

  const updateTime = (elapsedTime: number) => {
    let tempTime = elapsedTime;
    const milliseconds = tempTime % 1000;
    tempTime = Math.floor(tempTime / 1000);
    const seconds = tempTime % 60;
    tempTime = Math.floor(tempTime / 60);
    const minutes = tempTime % 60;
    tempTime = Math.floor(tempTime / 60);
    const hours = tempTime % 60;
    return {hours, minutes, seconds, milliseconds}
  }
  
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

  const handleShowCategories = () => {
    setShowCategories(!showCategories)
    setStateCategoriesText(showCategories ? categoriesText.show : categoriesText.hide)
  }

  const handleOnChangeCategories = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategoriesSelected(e.target.value)
    setCategoriesOptions(categoriesOptions.map(option => option.name === e.target.value ? {...option, isSelected: true} : {...option, isSelected: false}))
  }

  const onSubmitCategories = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if(refCategoriesInput.current?.value!) {
      setCategoriesOptions(categoriesOptions.map(each => ({...each, isSelected: false})))
      setCategoriesOptions([{
        name: refCategoriesInput.current?.value!,
        isSelected: true
      }, ...categoriesOptions])
      setCategoriesSelected(refCategoriesInput.current?.value!)
      refCategoriesInput.current.value = ''
    }
  }

  const handleRemoveCategories = () => {
    if(categoriesSelected === '' || categoriesSelected === undefined) {
      return setCategoriesOptions(categoriesOptions.filter(option => option.name !== refSelectCategories.current?.value))
    }

    setCategoriesOptions(categoriesOptions.filter(option => option.name !== categoriesSelected))
  }

  const handleTaskListChange = (e: any, index: number, type: string) => {
    setTaskList(taskList.map((task, i) => i === index ? {...task, [type]: e.target.value} : task))
  }

  const handleAddTaskCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategoriesSelected(e.target.value)
    setCategoriesOptions(categoriesOptions.map(each => each.name === e.target.value ? {...each, isSelected: true} : {...each, isSelected: false}))
  }

  const handleAddTaskSubmit = (e: FormEvent) => {
    e.preventDefault()
    const newTaskList = [{
      name: taskName,
      taskCategory: categoriesSelected,
      isPlay: false,
      hours: '00',
      minutes: '00',
      seconds: '00',
      elapsedTime: 0,
      prevTime: null
    }, ...taskList]
    setTaskList(newTaskList)
    addTaskList(newTaskList)
    setTaskName('')
  }

  const handleTaskNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value)
  }

  const handleTaskListDelete = (index: number) => {
    const newTaskList = taskList.filter((task, i) => i !== index)
    setTaskList(newTaskList)
    addTaskList(newTaskList)

  }

  const handleTaskPlay = (index: number, isPlay: boolean) => {
    cancelAnimationFrame(refStopWatch.current)
    setStartStopWatch({
      isPlay: !isPlay,
      taskIndex: index
    })

    let previousPlayIndex: null | number = null

    getTaskList().filter((task, i) => task.isPlay ? previousPlayIndex = i : task)

    let taskList = getTaskList().map((task, i) => i === index ? {...task, isPlay: !task.isPlay} : {...task, isPlay: false})

    taskList = taskList.map((task, i) => i === previousPlayIndex ? {...task, prevTime: null} : task)
    setTaskList(taskList)
    addTaskList(taskList)
  }

  return (
    <div className="app">
      <div className="author">Developed by: Richmond Z. Coca</div>
      <div className="container">
        <div className="timers">
          {/* <button ref={refStartButton} data-color={attrButtonColor} onClick={startTimerCountdown}>{countDownButtonText}</button> */}
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
            {
              categoriesOptions.length !== 0 &&
              <div className="select-container">
                <button onClick={handleRemoveCategories}>REMOVE</button>
                <select ref={refSelectCategories} value={categoriesSelected} onChange={handleOnChangeCategories}>
                  {
                    categoriesOptions.map( (optionData, index) =>
                      <option key={index} value={optionData.name}>{optionData.name}</option>
                    )
                  }
                </select>
              </div>
            }
          </div>
        }
        <form className="add-task" onSubmit={handleAddTaskSubmit}>
          <button>ADD</button>
          <input value={taskName} onChange={handleTaskNameChange} type="text" placeholder="Enter a new task name..." />
          {
            categoriesOptions.length > 0 &&
            <select value={categoriesSelected} onChange={handleAddTaskCategoryChange}>
              {
                categoriesOptions.map((each, index) =>
                  <option key={index} value={each.name}>{each.name}</option>
                )
              }
            </select>
          }
        </form>
        {
          taskList.length > 0 &&
          <div className="task-lists">
            {
              taskList.length > 0 &&
              taskList.map((task, index) =>
                <div className="task-list" key={index}>
                  <div className="task-lists-button">
                    <button data-color={task.isPlay ? 'chocolate' : 'cyan'} onClick={(e) => handleTaskPlay(index, task.isPlay)}>{task.isPlay ? 'PAUSE' : 'PLAY'}</button>
                    <button className="reset">RESET</button>
                  </div>
                  <input value={task.name} onChange={e => handleTaskListChange(e, index, 'name')} className="task-name" type="text" />
                  {
                    categoriesOptions.length > 0 &&
                    <select value={task.taskCategory} onChange={e => handleTaskListChange(e, index, 'taskCategory')} name="" id="">
                      {
                        categoriesOptions.map((each, index) =>
                          <option key={index} value={each.name}>{each.name}</option>
                        )
                      }
                    </select>
                  }
                  <div className="task-lists-timer">
                    <input onChange={e => handleTaskListChange(e, index, 'hours')} value={task.hours} type="text" maxLength={2} />
                    :
                    <input onChange={e => handleTaskListChange(e, index, 'minutes')} value={task.minutes} type="text" maxLength={2} />
                    :
                    <input onChange={e => handleTaskListChange(e, index, 'seconds')} value={task.seconds} type="text" maxLength={2} />
                  </div>
                  <div className='delete-container'>
                    <button onClick={() => handleTaskListDelete(index)} className='delete'>DELETE</button>
                  </div>
                </div>
              )
            }
          </div>
        }
      </div>
    </div>
  );
}

export default App;
