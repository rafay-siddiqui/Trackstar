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
      const newWorkoutHistory = { ...workoutHistory }
      newWorkoutHistory[time] = { name: routeName, hours, minutes, distance, unit, caloriesBurned, weight, weightUnit, activity }
      setWorkoutHistory(newWorkoutHistory)
      console.log(workoutHistory)
    }
  }

  useEffect(() => {
    setPace(distance / (parseInt(hours) + parseFloat(minutes / 60)))
  }, [hours, minutes, distance])

  useEffect(() => {
    function footMET(pace) {
      let minMET, maxMET;
      if (unit === 'km') pace *= 0.621371;

      if (pace <= 2.0) { minMET = 2.5; maxMET = 2.8; }
      else if (pace <= 2.5) { minMET = 2.8; maxMET = 3.0; }
      else if (pace <= 3.0) { minMET = 3.0; maxMET = 3.3; }
      else if (pace <= 3.5) { minMET = 3.3; maxMET = 3.8; }
      else if (pace <= 4.0) { minMET = 3.8; maxMET = 5.0; }
      else if (pace <= 4.5) { minMET = 5.0; maxMET = 7.0; }
      else if (pace <= 5) { minMET = 7.0; maxMET = 8.3; }
      else if (pace <= 6) { minMET = 8.3; maxMET = 9.8; }
      else if (pace <= 7) { minMET = 9.8; maxMET = 11; }
      else if (pace <= 8) { minMET = 11; maxMET = 11.8; }
      else if (pace <= 10) { minMET = 11.8; maxMET = 14.5; }
      else { minMET = 14.5; maxMET = 16 + (pace - 10); }

      return { min: minMET, max: maxMET };
    }

    function bikeMET(pace) {
      let minMET, maxMET;
      if (unit === 'km') pace *= 0.621371;

      if (pace < 10) { minMET = 3.5; maxMET = 4.0; }
      else if (pace <= 12) { minMET = 4.0; maxMET = 6.8; }
      else if (pace <= 14) { minMET = 6.8; maxMET = 8.0; }
      else if (pace <= 16) { minMET = 8.0; maxMET = 10.0; }
      else if (pace <= 20) { minMET = 10.0; maxMET = 12.0; }
      else { minMET = 12.0; maxMET = 16.0; }

      return { min: minMET, max: maxMET };
    }

    if (activity === 'walking' || activity === 'running') {
      setIntensity(footMET(pace))
    } else if (activity === 'biking') {
      setIntensity(bikeMET(pace))
    }
  }, [pace, activity, unit])

  useEffect(() => {
    let calcWeight = weight;
    if (weightUnit === 'lbs') { calcWeight *= 0.453592 }
    const minCalories = intensity.min * calcWeight * (parseInt(hours) + parseFloat(minutes / 60));
    const maxCalories = intensity.max * calcWeight * (parseInt(hours) + parseFloat(minutes / 60));
    setCaloriesBurned({ min: minCalories, max: maxCalories });
  }, [intensity, weight, hours, minutes, weightUnit]);

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
      <span>{`Burned between ${parseFloat(caloriesBurned.min).toFixed(0)} and ${parseFloat(caloriesBurned.max).toFixed(0)} calories`}</span>
      <br />
      <span>{`intensity is ${intensity.min} and ${intensity.max} hours is ${hours} minutes is ${minutes} weight is ${weight} 
      weight unit is ${weightUnit} pace is ${pace} distance is ${distance} activity is ${activity} unit is ${unit}`}</span>

      <br />
      <button onClick={saveWorkout}>Save workout</button>

      <br />
      {workoutHistory && <ul style={{ textAlign: 'left' }}>
        {Object.keys(workoutHistory).map(workout => {
          return (
            <li>
              <span>
                {workoutHistory[workout].name ? `Route: ${workoutHistory[workout].name}` : ''},
                {` ${workoutHistory[workout].distance.toFixed(2)} ${workoutHistory[workout].unit}`}
                {` in ${workoutHistory[workout].hours} ${parseInt(workoutHistory[workout].hours) !== 1 ? 'hours' : 'hour'}
                ${workoutHistory[workout].minutes ? ` and ${workoutHistory[workout].minutes} 
                ${parseInt(workoutHistory[workout].minutes) !== 1 ? 'minutes' : 'minute'}` : ''}`}
                {` by ${workoutHistory[workout].activity}`}
              </span>
              <br />
              <span>
                {`Burned between ${parseFloat(workoutHistory[workout].caloriesBurned.min).toFixed(0)} and ${parseFloat(workoutHistory[workout].caloriesBurned.max).toFixed(0)} calories at ${workoutHistory[workout].weight} ${workoutHistory[workout].weightUnit}`}
              </span>
            </li>)
        })}
      </ul>}
    </div>
  )
}

export default CalorieCalculator;