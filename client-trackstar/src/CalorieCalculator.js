import { useEffect, useState } from 'react';

function CalorieCalculator({ distance, unit, activity, routeName }) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [pace, setPace] = useState(distance / (hours + minutes / 60))
  const [intensity, setIntensity] = useState(0)
  const [weight, setWeight] = useState(0)
  const [weightUnit, setWeightUnit] = useState('kg')
  const [caloriesBurned, setCaloriesBurned] = useState(0)
  const [workoutHistory, setWorkoutHistory] = useState({})

  const saveWorkout = () => {
    if ((hours || minutes) && weight) {
      const time = Date.now();
      const newWorkoutHistory = {...workoutHistory}
      newWorkoutHistory[time] = {name: routeName, hours, minutes, distance, caloriesBurned, weight, }
      setWorkoutHistory({newWorkoutHistory})
    }
  }

  // const saveRoute = () => {
  //   if (routeName.length < 1 || markersPos.length < 2) {
  //     routeNameInputRef.current.focus()
  //   } else if (routeName.length > 0) {
  //     let newAllRoutes = { ...allRoutes }
  //     newAllRoutes[routeName] = {
  //       markersPos: markersPos,
  //       pathDistance: pathDistance,
  //       unitType: unitType,
  //       mapCenter: [(markersPos[0][0] + markersPos[markersPos.length - 1][0]) / 2,
  //       (markersPos[0][1] + markersPos[markersPos.length - 1][1]) / 2]
  //     }
  //     setAllRoutes(newAllRoutes)
  //     setRouteName('')
  //     resetRoute()
  //     setCreatingRoute(false)
  //     setPointSnapping(true)
  //   }
  // }

  useEffect(() => {
    setPace(distance / (parseInt(hours) + parseFloat(minutes / 60)))
  }, [hours, minutes, distance])

  useEffect(() => {
    function footMET(pace) {
      if (unit === 'km') pace *= 0.621371
      if (pace <= 2.0) return 2.8;
      if (pace <= 2.5) return 3.0;
      if (pace <= 3.0) return 3.3;
      if (pace <= 3.5) return 3.8;
      if (pace <= 4.0) return 5.0;
      if (pace <= 4.5) return 7.0;
      if (pace <= 5) return 8.3;
      if (pace <= 6) return 9.8;
      if (pace <= 7) return 11;
      if (pace <= 8) return 11.8;
      if (pace <= 10) return 14.5;
      return 16 + (pace - 10);
    }
    function bikeMET(pace) {
      if (unit === 'km') pace *= 0.621371
      if (pace < 10) return 4.0;
      if (pace <= 12) return 6.8;
      if (pace <= 14) return 8.0;
      if (pace <= 16) return 10.0;
      if (pace <= 20) return 12.0;
      return 16.0;
    }

    if (activity === 'walking' || activity === 'running') {
      setIntensity(footMET(pace))
    } else if (activity === 'biking') {
      setIntensity(bikeMET(pace))
    }
  }, [pace, activity, unit])

  useEffect(() => {
    const getIntensity = () => {
      let calcWeight = weight;
      if (weightUnit === 'lbs') { calcWeight *= 0.453592 }
      return (intensity * calcWeight * (parseInt(hours) + parseFloat(minutes / 60)))
    }
    setCaloriesBurned(getIntensity())
  }, [intensity, weight, hours, minutes, weightUnit])

  const toggleWeightUnit = () => {
    if (weightUnit === 'kg') {
      setWeight((weight * 2.20462).toFixed(1))
      setWeightUnit('lbs')
    } else if (weightUnit === 'lbs') {
      setWeight((weight * 0.453592).toFixed(1))
      setWeightUnit('kg')
    }
  }

  return (
    <div>
      <label>
        <input type='number' min={0} max={24} value={hours} onChange={(e) => {
          if (e.target.value <= 24 && e.target.value >= 0) {

            setHours(e.target.value)
          }
          // else { alert("Hours must be between 0 and 24") }
        }}
        />
        Hours
      </label>
      <label>
        <input type='number' min={0} max={59} value={minutes} onChange={(e) => {
          if (e.target.value < 60 && e.target.value >= 0) {
            setMinutes(e.target.value)
          }
          // else (alert('Minutes must be between 0 and 59'))
        }}
        />
        Minutes
      </label>
      <br />
      <label>
        <input style={{ width: '50px' }} type='number' min={20} max={500} value={weight <= 500 ? weight : 500} onChange={(e) => {
          if (e.target.value >= 0 && e.target.value <= 500) {
            setWeight(e.target.value)
          }
        }}
        />
        <button onClick={toggleWeightUnit}>{weightUnit}</button>
      </label>
      <br />
      <span>{`Burned ${caloriesBurned.toFixed(0)} calories`}</span>

      <br />
      <button onClick={saveWorkout}>Save workout</button>
    </div>
  )
}

export default CalorieCalculator;