import React, { ChangeEvent, FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import './App.scss';
import { setTaskCategories, addTaskList, getTaskCategories, getTaskList, getTaskTimerData, GetTime, setTaskTimerData, TruncateTime, setShowTotalHoursData, getShowTotalHoursData } from './helper';
import { StartStopWatchInterface, TaskCategories, TaskListInterface, TaskTimer } from './interfaces';

function App() {
  const categoriesText = {
    show: 'SHOW CATEGORIES',
    hide: 'HIDE CATEGORIES'
  }

  const [hours, setHours] = useState('08')
  const [minutes, setMinutes] = useState('00')
  const [seconds, setSeconds] = useState('00')
  const [milliseconds] = useState(0)
  const [showCategories, setShowCategories] = useState(Boolean)
  const [stateCategoriesText, setStateCategoriesText] = useState(categoriesText.show)
  const [categoriesOptions, setCategoriesOptions] = useState<TaskCategories[]>([])
  const [categoriesSelected, setCategoriesSelected] = useState('')
  const [taskList, setTaskList] = useState<TaskListInterface[]>([])
  const [taskName, setTaskName] = useState('')
  const [startStopWatch, setStartStopWatch] = useState<StartStopWatchInterface>()
  const [showTotalHours, setShowTotalHours] = useState(false)
  const [sumUpAllCategories, setSumUpAllCategories] = useState(0)
  const [runOnce, setRunOnce] = useState(Boolean)

  const refTimeInterval: any = useRef()
  const refCategoriesInput = useRef<HTMLInputElement>(null)
  const refSelectCategories = useRef<HTMLSelectElement>(null)
  const refShowTotalHoursButton = useRef<HTMLButtonElement>(null)

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

      if(!runOnce && getShowTotalHoursData()) {
        refShowTotalHoursButton.current?.click()
      }
    }
  }, [categoriesOptions, runOnce])

  const updateTaskList = useCallback((index: number, elapsedTime: number, prevTime: number, isPlay = true, taskCategory: string = '') => {
    const time = updateTime(elapsedTime)
    const hours = TruncateTime(time.hours)
    const minutes = TruncateTime(time.minutes)
    const seconds = TruncateTime(time.seconds)
    const hoursEquivalent = (time.hours + (time.minutes / 60)).toFixed(2)

    const taskList = getTaskList().map((task, i) => i === index ? {
      ...task,
      hours,
      minutes,
      seconds,
      elapsedTime,
      prevTime,
      hoursEquivalent,
      isPlay
    } : task)
    setTaskList(taskList)
    addTaskList(taskList)
  }, [])

  useEffect(() => {
    const storageTaskTimerData = getTaskTimerData()
    
    const startTimerCountdown = (type: string) => {
      let taskTimerData: TaskTimer
      
      switch (type) {
        case 'start':
          if(parseInt(hours) === 0 && parseInt(minutes) === 0 && parseInt(seconds) === 0) {
            return
          }
  
          let countDownTime = storageTaskTimerData.countDownTime || GetTime(parseInt(hours), parseInt(minutes), parseInt(seconds), milliseconds)

          if(storageTaskTimerData.isPause && storageTaskTimerData.countDownTime) {
            const resumeTime = new Date(new Date().getTime() + storageTaskTimerData.distance).getTime()
            countDownTime = resumeTime
          }

          const taskListData = getTaskList().filter(task => task.isPlay)[0]
          let prevTime = taskListData.prevTime ? taskListData.prevTime : new Date().getTime() - 1000
          let elapsedTime = taskListData.elapsedTime
  
          const animate = () => {
            const now = new Date().getTime()
            const distance = countDownTime - now
  
            if(distance < 0) {
              taskTimerData = {
                isPause: true,
                hours: '08',
                minutes: '00',
                seconds: '00',
                distance: 0,
                countDownTime: 0
              }

              elapsedTime += now - prevTime
              prevTime = 0
              updateTaskList(startStopWatch?.taskIndex!, elapsedTime, prevTime, false)
              setTaskTimerData(taskTimerData)
              setStartStopWatch({
                taskIndex: 0,
                isPlay: false
              })
              setHours('08')
              setMinutes('00')
              setSeconds('00')
              alert('Your time has out.')
              cancelAnimationFrame(refTimeInterval.current)
            }
            else {
              const intervalHours = TruncateTime(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
              const intervalMinutes = TruncateTime(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)))
              const intervalSeconds = TruncateTime(Math.floor((distance % (1000 * 60)) / 1000))

              elapsedTime += now - prevTime
              prevTime = new Date().getTime()
              updateTaskList(startStopWatch?.taskIndex!, elapsedTime, prevTime, true, taskListData.taskCategory)
  
              taskTimerData = {
                hours: intervalHours,
                minutes: intervalMinutes,
                seconds: intervalSeconds,
                isPause: false,
                distance,
                countDownTime: new Date(new Date().getTime() + distance).getTime()
              }
  
              setHours(intervalHours)
              setMinutes(intervalMinutes)
              setSeconds(intervalSeconds)

              refTimeInterval.current = requestAnimationFrame(animate)
              setTaskTimerData(taskTimerData)
            }
          }
  
          refTimeInterval.current = requestAnimationFrame(animate)
          break;
  
        case 'pause':
          cancelAnimationFrame(refTimeInterval.current)
          
          localStorage.setItem('taskTimerData', JSON.stringify({...storageTaskTimerData, isPause: true}))
          const taskList = getTaskList().map((task, i) => i === startStopWatch?.taskIndex ? {
            ...task,
            prevTime: null,
            elapsedTime: task.elapsedTime - 1000
          } : task)
          setTaskList(taskList)
          addTaskList(taskList)
          break;
      
        default:
          break;
      }
    }

    if(startStopWatch) {
      if(startStopWatch?.isPlay) {
        startTimerCountdown('start')
      }
      else {
        startTimerCountdown('pause')
      }
    }
    else if(storageTaskTimerData.distance) {
     const countDownTime = new Date(new Date().getTime() + storageTaskTimerData.distance).getTime() - new Date().getTime()
     const diffHours = Math.floor((countDownTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const diffMinutes = Math.floor((countDownTime % (1000 * 60 * 60)) / (1000 * 60))
      const diffSeconds = Math.floor((countDownTime % (1000 * 60)) / 1000)
     
      setHours(TruncateTime(diffHours))
      setMinutes(TruncateTime(diffMinutes))
      setSeconds(TruncateTime(diffSeconds))
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
    setTaskTimerData({...getTaskTimerData(), distance: 0, countDownTime: 0, isPause: false})
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
    
    const newCategoryOptions = categoriesOptions.map(option => option.name === e.target.value ? {...option, isSelected: true} : {...option, isSelected: false})
    setCategoriesOptions(newCategoryOptions)
    setTaskCategories(newCategoryOptions)
  }

  const onSubmitCategories = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if(refCategoriesInput.current?.value!) {
      let newCategoryOptions = categoriesOptions.map(each => ({...each, isSelected: false}))

      newCategoryOptions = [...newCategoryOptions, {
        name: refCategoriesInput.current?.value!,
        isSelected: true,
        totalHours: 0
      }]
      setCategoriesOptions(newCategoryOptions)
      setTaskCategories(newCategoryOptions)
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
    const newTaskList = taskList.map((task, i) => i === index ? {...task, [type]: e.target.value} : task)
    setTaskList(newTaskList)
    addTaskList(newTaskList)
  }

  const handleAddTaskCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newCategoryOptions = categoriesOptions.map(each => each.name === e.target.value ? {...each, isSelected: true} : {...each, isSelected: false})
    setCategoriesSelected(e.target.value)
    setCategoriesOptions(newCategoryOptions)
    setTaskCategories(newCategoryOptions)
  }

  const handleAddTaskSubmit = (e: FormEvent) => {
    e.preventDefault()
    const newTaskList: TaskListInterface[] = [
      ...taskList, {
      name: taskName,
      taskCategory: categoriesSelected,
      isPlay: false,
      hours: '00',
      minutes: '00',
      seconds: '00',
      elapsedTime: 0,
      prevTime: null,
      hoursEquivalent: '0.00'
    }]
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
    cancelAnimationFrame(refTimeInterval.current)
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

  const handleTaskListReset = (index: number) => {
    const newTaskList = taskList.map((task, i) => i === index ? {
      ...task,
      elapsedTime: 0,
      hours: '00',
      minutes: '00',
      seconds: '00'
    } : task)
    setTaskList(newTaskList)
    addTaskList(newTaskList)
  }

  const handleCountDownReset = () => {
    if(window.confirm('Reset timer and delete all tasklist?')) {
      setHours('08')
      setMinutes('00')
      setSeconds('00')
      setTaskTimerData({
        hours: '08',
        minutes: '00',
        seconds: '00',
        isPause: true,
        countDownTime: 0,
        distance: 0
      })
      setTaskList([])
      addTaskList([])
    }
  }

  const handleShowTotalHours = () => {
    if(!showTotalHours) {
      let allCategoriesTotalHours = 0
      const newCategoryOptions = categoriesOptions.map((category, categoryIndex) => {
        let totalHours = 0
        taskList.forEach(task => {
          if(task.taskCategory === category.name) {
            totalHours += parseFloat(task.hoursEquivalent)
          }

          if(categoryIndex === 0) {
            allCategoriesTotalHours += parseFloat(task.hoursEquivalent)
          }
        })

        return {...category, totalHours}
      })
      setCategoriesOptions(newCategoryOptions)
      setTaskCategories(newCategoryOptions)
      setSumUpAllCategories(Math.round((allCategoriesTotalHours + Number.EPSILON) * 100) / 100)
    }
    setShowTotalHours(!showTotalHours)
    setShowTotalHoursData(!showTotalHours)
    setRunOnce(true)
  }

  return (
    <div className="app">
      <div className="author">Developed by: Richmond Z. Coca</div>
      <div className="container">
        <div className="timers">
          <button disabled={startStopWatch?.isPlay} onClick={handleCountDownReset}>RESET</button>
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
        <div className={`categories-container${showCategories ? ' show' : ''}`}>
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
        </div>
        <div className="add-task-container">
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
                      <button disabled={startStopWatch?.isPlay && !task.isPlay} data-color={task.isPlay ? 'chocolate' : 'cyan'} onClick={(e) => handleTaskPlay(index, task.isPlay)}>{task.isPlay ? 'PAUSE' : 'PLAY'}</button>
                      <button disabled={startStopWatch?.isPlay} className="reset" onClick={() => handleTaskListReset(index)}>RESET</button>
                    </div>
                    <input disabled={startStopWatch?.isPlay} value={task.name} onChange={e => handleTaskListChange(e, index, 'name')} className="task-name" type="text" />
                    {
                      categoriesOptions.length > 0 &&
                      <select disabled={startStopWatch?.isPlay} value={task.taskCategory} onChange={e => handleTaskListChange(e, index, 'taskCategory')}>
                        {
                          task.taskCategory === '' &&
                          <option>Select Category</option>
                        }
                        {
                          categoriesOptions.map((each, index) =>
                            <option key={index} value={each.name}>{each.name}</option>
                          )
                        }
                      </select>
                    }
                    <div className="task-lists-timer">
                      <input readOnly onChange={e => handleTaskListChange(e, index, 'hours')} value={task.hours} type="text" maxLength={2} />
                      :
                      <input readOnly onChange={e => handleTaskListChange(e, index, 'minutes')} value={task.minutes} type="text" maxLength={2} />
                      :
                      <input readOnly onChange={e => handleTaskListChange(e, index, 'seconds')} value={task.seconds} type="text" maxLength={2} />
                    </div>
                    <div className="hours-equivalent">
                      <span>{task.hoursEquivalent}</span>
                      <span>h</span>
                    </div>
                    <div className='delete-container'>
                      <button disabled={startStopWatch?.isPlay} onClick={() => handleTaskListDelete(index)} className='delete'>DELETE</button>
                    </div>
                  </div>
                )
              }
            </div>
          }
        </div>
        <div className="task-total-hours">
          <button ref={refShowTotalHoursButton} onClick={handleShowTotalHours} className={`caret${showTotalHours ? ' show' : ''}`}>
            <span>▲</span>
          </button>
          {
            showTotalHours &&
            <>
              <h1>Total Hours:</h1>
              <div className="task-total-hours-container">
                {
                  categoriesOptions.length > 0 ?
                    categoriesOptions.map((category, index) =>
                      category.totalHours > 0 &&
                      <div className="task-total-categories" key={index}>
                        <span className="task-total-category-name">{category.name}<span>:</span> </span>
                        <span className="task-total-number">{category.totalHours.toFixed(2)}h</span>
                      </div>
                    )
                  : 'N/A'
                }
                {
                  categoriesOptions.length > 0 &&
                  <div className="task-total-categories">
                    <span className="task-total-category-name">Total<span>:</span> </span>
                    <span className="task-total-number">{sumUpAllCategories}h</span>
                  </div>
                }
              </div>
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
