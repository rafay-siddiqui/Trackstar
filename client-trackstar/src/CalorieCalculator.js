import { useEffect, useState } from 'react';

function CalorieCalculator( {distance, unit, mode} ) {
  const [duration, setDuration] = useState({ hours: 0, minutes: 0 })
  const [pace, setPace] = useState(distance / (duration.hours + duration.minutes / 60))
  
  useEffect(() => {
    setPace(distance / (duration.hours + duration.minutes / 60))
  }, [duration, distance])

  return (
    <div>
      <label>
        <input type='number' min={0} max={24} value={duration.hours} onChange={(e) => {
          if (e.target.value <= 24 && e.target.value >= 0) {

            setDuration({ ...duration, hours: e.target.value })
          } 
          // else { alert("Hours must be between 0 and 24") }
        }}
        />
        Hours
      </label>
      <label>
        <input type='number' min={0} max={59} value={duration.minutes} onChange={(e) => {
          if (e.target.value < 60 && e.target.value >= 0) {
            setDuration({ ...duration, minutes: e.target.value })
          } 
          // else (alert('Minutes must be between 0 and 59'))
        }}
        />
        Minutes
      </label>
      <span>{`${pace.toFixed(2)} ${unit}/hr`}</span>
    </div>
  )
}

export default CalorieCalculator;