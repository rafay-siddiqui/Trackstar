import './App.css';
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents, Marker, Polyline } from 'react-leaflet'
import { useState, useEffect, useRef } from 'react';

import CalorieCalculator from './CalorieCalculator';
import DemoProfile from './DemoProfile'

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import loadingIconUrl from './images/loading-marker-200px.gif'

import walkingIcon from './images/person-walking.svg'
import runningIcon from './images/person-running.svg'
import bikingIcon from './images/person-biking.svg'
import saveIcon from './images/floppy-disk.svg'
import loadIcon from './images/route-solid.svg'
import overwriteIcon from './images/pencil-solid.svg'
import locationDotIcon from './images/location-dot.svg'

import axios from 'axios'
import { decode } from '@mapbox/polyline';


let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [12, 41],
  shadowAnchor: [14, 41],
  popupAnchor: [0, -41]
});

let PathIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [11, 18],
  shadowSize: [14, 14],
  iconAnchor: [5, 18],
  shadowAnchor: [5, 18],
  popupAnchor: [0, -41]
});

let LoadingIcon = L.icon({
  iconUrl: loadingIconUrl,
  iconSize: [50, 50],
  shadowSize: [50, 50],
  iconAnchor: [25, 25],
  shadowAnchor: [25, 25],
  popupAnchor: [0, -41]
})

let InvisibleIcon = L.icon({
  iconUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  iconSize: [0, 0],
  shadowSize: [0, 0],
  iconAnchor: [0, 0],
  shadowAnchor: [0, 0],
  popupAnchor: [0, 0]
});

L.Marker.prototype.options.icon = DefaultIcon;

const databaseServerURL = "http://localhost:8080"

function App() {
  const [userProfile, setUserProfile] = useState(null)
  const [markersPos, setMarkersPos] = useState([]);
  const [loadingPos, setLoadingPos] = useState([]);
  const [mapCenter, setMapCenter] = useState([43.5588, -79.7116]);
  const [searchLocation, setSearchLocation] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [creatingRoute, setCreatingRoute] = useState(false);
  const [placingPoint, setPlacingPoint] = useState(false);
  const [pointSnapping, setPointSnapping] = useState(true);
  const [pathDistance, setPathDistance] = useState(0);
  const [unitType, setUnitType] = useState('km');
  const [allRoutes, setAllRoutes] = useState({});
  const [routeName, setRouteName] = useState('')
  const routeNameInputRef = useRef(null);
  const [selectedRoute, setSelectedRoute] = useState("")
  const loadRouteRef = useRef(null);
  const [selectedActivity, setSelectedActivity] = useState('walking')
  const [menuMode, setMenuMode] = useState('route')
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    const fetchDemoUser = async () => {
      try {
        const response = await axios.get(`${databaseServerURL}/fetch-demo-user`)
        if (response.status === 200 && response.data) {
          setUserProfile(response.data.user)
        }
      } catch {
        console.error("Could not contact database to fetch demo user profile")
        setUserProfile(null)
      }
    }
    fetchDemoUser();
  }, [])

  const getActivityType = () => {
    if (selectedActivity === 'walking' || selectedActivity === 'running') {
      return 'foot'
    } else if (selectedActivity === 'biking') { return 'bike' }
  }

  const getSnappedRoute = async (start, end) => {
    const apiActivity = getActivityType()
    const response = await axios.get(`http://router.project-osrm.org/route/v1/${apiActivity}/${start[0]},${start[1]};${end[1]},${end[0]}?geometries=polyline`);
    if (response.status === 200 && response.data.routes && response.data.routes.length > 0) {
      const polyline = response.data.routes[0].geometry;
      setLoadingPos([])
      return decode(polyline).map(([latitude, longitude], idx) => {
        if (idx === decode(polyline).length - 1) {
          return [latitude, longitude]
        }
        return [latitude, longitude, true]
      })
    } else {
      setLoadingPos([])
      console.error("Could not snap route to road")
    }
  }

  function CreateMarker() {
    const apiActivity = getActivityType()
    useMapEvents({
      click: async (e) => {
        if (creatingRoute && !placingPoint) {
          setPlacingPoint(true)
          var lat = e.latlng.lat
          var lng = e.latlng.lng

          if (!pointSnapping) {
            const newMarkerPos = [lat, lng];
            const isMarkerDuplicate = markersPos.some(
              pos => pos[0] === newMarkerPos[0] && pos[1] === newMarkerPos[1]
            );
            if (!isMarkerDuplicate) setMarkersPos([...markersPos, newMarkerPos]);
            setPlacingPoint(false)
          } else {
            setLoadingPos([lat, lng])

            const response = await axios.get(`http://router.project-osrm.org/nearest/v1/${apiActivity}/${lng},${lat}`);
            if (response.status === 200 && response.data.waypoints && response.data.waypoints.length > 0) {
              const snappedCoordinates = response.data.waypoints[0].location;
              const newMarkerPos = [snappedCoordinates[1], snappedCoordinates[0]];
              const isMarkerDuplicate = markersPos.some(
                pos => pos[0] === newMarkerPos[0] && pos[1] === newMarkerPos[1]
              );
              if (!isMarkerDuplicate) {
                if (markersPos.length > 0) {
                  const lastPoint = markersPos[markersPos.length - 1]
                  const snappedRoute = await getSnappedRoute([lastPoint[1], lastPoint[0]], newMarkerPos)
                  setMarkersPos([...markersPos, ...snappedRoute]);
                } else {
                  setLoadingPos([])
                  setMarkersPos([...markersPos, newMarkerPos])
                }
              }
              setPlacingPoint(false)
            } else {
              console.error("Could not get snapped coordinates from OSRM.");
              setLoadingPos([])
              setPlacingPoint(false)
            }
          }
        }
      },
    })

    return null
  }

  function ZoomControls() {
    const handleZoomTo = (zoomLevel) => {
      setMapZoom(zoomLevel)
    }

    return (
      <div className='zoom-buttons'>
        <button onClick={() => { handleZoomTo(18) }}>Near</button>
        <button onClick={() => { handleZoomTo(15) }}>Far</button>
      </div>
    )
  }

  function ZoomControlsRef() {
    const map = useMap()
    useEffect(() => {
      if (mapZoom) {
        map.setZoom(mapZoom)
        setMapZoom(null)
      }
      // eslint-disable-next-line
    }, [mapZoom, map])
  }

  const haversineDistance = (coords1, coords2, isMiles = false) => {
    const toRad = (x) => {
      return x * Math.PI / 180;
    }

    var lon1 = coords1[1];
    var lat1 = coords1[0];

    var lon2 = coords2[1];
    var lat2 = coords2[0];

    var R = 6371; // km

    var x1 = lat2 - lat1;
    var dLat = toRad(x1);
    var x2 = lon2 - lon1;
    var dLon = toRad(x2)
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    if (isMiles) d /= 1.60934;

    return d;
  }

  useEffect(() => {
    const getTotalDistance = (points) => {
      let totalDistance = 0
      for (let i = 0; i < points.length - 1; i++) {
        totalDistance += haversineDistance(points[i], points[i + 1])
      }
      return totalDistance;
    }
    if (markersPos.length > 1) {
      if (unitType === "km") {
        setPathDistance(getTotalDistance(markersPos))
      } else if (unitType === "miles") {
        setPathDistance(getTotalDistance(markersPos) * 0.621371)
      }
    }
  }, [markersPos, unitType])

  useEffect(() => {
    setCreatingRoute(false);
  }, [menuMode])

  function MoveMap() {
    const map = useMap()
    useMapEvents({
      moveend: () => {
        const newCenter = [map.getCenter().lat, map.getCenter().lng];
        if (newCenter[0] !== mapCenter[0] || newCenter[1] !== mapCenter[1]) {
          setMapCenter(newCenter);
        }
      }
    })
  }

  const undoMarker = () => {
    let newMarkersPos = [...markersPos];
    if (newMarkersPos.length > 0) {
      newMarkersPos.pop();
      while (newMarkersPos.length > 0 && newMarkersPos[newMarkersPos.length - 1][2] === true) { newMarkersPos.pop() }
    }
    setMarkersPos(newMarkersPos);
  }

  const resetRoute = () => {
    setMarkersPos([])
    setLoadingPos([]);
    setPathDistance(0)
    setRouteName('')
    setSelectedRoute('')
  }

  const saveRoute = () => {
    if (routeName.length < 1 || markersPos.length < 2) {
      routeNameInputRef.current.focus()
    } else if (routeName.length > 0) {
      let newAllRoutes = { ...allRoutes }
      newAllRoutes[routeName] = {
        markersPos: markersPos,
        pathDistance: pathDistance,
        unitType: unitType,
        mapCenter: [(markersPos[0][0] + markersPos[markersPos.length - 1][0]) / 2,
        (markersPos[0][1] + markersPos[markersPos.length - 1][1]) / 2]
      }
      setAllRoutes(newAllRoutes)
      setRouteName('')
      resetRoute()
      setCreatingRoute(false)
      setPointSnapping(true)
    }
  }

  const loadRoute = (routeName) => {
    if (!selectedRoute) {
      loadRouteRef.current.focus();
    } else {
      setMarkersPos(allRoutes[routeName].markersPos)
      setPathDistance(allRoutes[routeName].pathDistance)
      setUnitType(allRoutes[routeName].unitType)
      setMapCenter(allRoutes[routeName].mapCenter)
      setCreatingRoute(false)
    }
  }

  const handleSearchLocationChange = (e) => {
    setSearchLocation(e.target.value);
  }

  const handleLocationSearch = async (e) => {
    if (locationLoading === false) {
      if (e.key === 'Enter') {
        setLocationLoading(true)
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${e.target.value}`)
        if (response.data[0]) {
          const { lat, lon } = response.data[0];
          setMapCenter([parseFloat(lat), parseFloat(lon)])
          setLocationLoading(false)
        } else {
          alert("Location not found")
          setLocationLoading(false)
        }
      }
    }
  }

  const handleRouteNameChange = (e) => {
    setRouteName(e.target.value)
  }

  const toggleCreatingRoute = () => {
    creatingRoute ? setCreatingRoute(false) : setCreatingRoute(true);
  }

  function CenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
      map.flyTo(center, map.getZoom());
    }, [center, map]);

    return null;
  }

  function PointSnappingToggle() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <label>
          <input
            disabled={!creatingRoute}
            type="radio"
            value="snap"
            checked={pointSnapping}
            onChange={() => setPointSnapping(true)}
          />
          Snap to Road
        </label>
        <label>
          <input
            disabled={!creatingRoute}
            type="radio"
            value="place"
            checked={!pointSnapping}
            onChange={() => setPointSnapping(false)}
          />
          Place Anywhere
        </label>
      </div>
    );
  }

  function ActivityToggle() {
    return (
      <div className='activity-select' >
        <label>
          <input
            type="radio"
            value="walk"
            checked={selectedActivity === 'walking'}
            onChange={() => setSelectedActivity('walking')}
          />
          <img src={walkingIcon} alt='Walking' />
        </label>
        <label>
          <input
            type="radio"
            value="run"
            checked={selectedActivity === 'running'}
            onChange={() => setSelectedActivity('running')}
          />
          <img src={runningIcon} alt='Running' />
        </label>
        <label>
          <input
            type="radio"
            value="bike"
            checked={selectedActivity === 'biking'}
            onChange={() => setSelectedActivity('biking')}
          />
          <img src={bikingIcon} alt='Biking' />
        </label>
      </div>
    );
  }

  const toggleUnitType = () => {
    if (unitType === 'km') {
      setUnitType('miles')
    }
    if (unitType === 'miles') {
      setUnitType('km')
    }
  }

  function DistanceDisplay() {
    return (
      <h4 style={{ display: 'flex', alignSelf: 'center' }}>Distance: {pathDistance.toFixed(2)}
        <button style={{ padding: '5px', marginLeft: '5px' }} onClick={toggleUnitType}>{unitType}</button>
      </h4>
    )
  }

  function RouteLoader() {
    return (
      <div className='load-route'>
        <select ref={loadRouteRef} value={selectedRoute} disabled={Object.keys(allRoutes).length < 1}
          onChange={(e) => { setSelectedRoute(e.target.value) }}>
          <option value='' >Choose Track to Load</option>
          {Object.keys(allRoutes).map((route, idx) => {
            return <option key={idx}>{route}</option>
          })}
        </select>
        <img className='track-history-icon' onClick={() => loadRoute(selectedRoute)} style={!selectedRoute ?
          { opacity: 0.5, cursor: 'not-allowed' } : {}} src={loadIcon} alt='Load Route' />
      </div>
    )
  }

  return (
    <div className='App' style={creatingRoute ? { cursor: `url(${locationDotIcon}) 16 34, auto` } : {}}>
      <nav className="navbar" >
        <div className='map-controls' >
          <ZoomControls />
          <input id='map-location' className={searchLocation ? '' : 'empty'} type='text' placeholder='Set Map Location' value={searchLocation}
            onChange={handleSearchLocationChange} onKeyUp={handleLocationSearch} />
        </div>
        <div className='title-container'>
          <h1>TRACKSTAR</h1>
        </div>
        <div className='profile-container' >
          <DemoProfile userProfile={userProfile} />
        </div>
      </nav>

      <div className="routemaker-map" style={{ cursor: 'inherit' }}>
        <MapContainer center={[43.5588, -79.7116]} zoom={mapZoom} zoomControl={false}
          style={{ height: "100vh", width: "100%", cursor: 'inherit' }} >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors | Rafay Siddiqui'
          />
          <ZoomControl position='bottomright' />
          <CreateMarker />
          {markersPos.map((marker, idx) => {
            if (idx === 0 || idx === markersPos.length - 1) return <Marker key={idx} position={[...marker]} />
            return <Marker key={idx} position={[...marker]} icon={marker[2] === true ? InvisibleIcon : PathIcon} />
          })}
          {loadingPos.length > 0 && <Marker position={[...loadingPos]} icon={LoadingIcon} />}
          <Polyline positions={markersPos} color='red' />
          <CenterMap center={mapCenter} />
          <MoveMap />
          <ZoomControlsRef />
        </MapContainer>
      </div>

      <div className="route-options">
        <div className='route-options-select'>
          <button className={menuMode === 'route' ? 'selected' : ''} onClick={() => setMenuMode('route')}>Track Creation</button>
          <button className={menuMode === 'calories' ? 'selected' : ''} onClick={() => setMenuMode('calories')}>Workout Logging</button>
        </div>

        {menuMode === 'calories' && (
          <>
            <CalorieCalculator routeName={selectedRoute} activity={selectedActivity} distance={pathDistance} unit={unitType} RouteLoader={RouteLoader} />
            <ActivityToggle />
            <DistanceDisplay />
          </>
        )}

        {menuMode === 'route' && <div className="routemaker-form">
          <div className={'marker-controls'}>
            <button className={`enable-markers ${!creatingRoute ? 'prompt-click' : 'prompt-click-active'}`} onClick={toggleCreatingRoute} >
              <img src={locationDotIcon} alt='Location Dot' style={{ verticalAlign: 'top', height: '20px', margin: '0px' ,marginRight: '5px' }} />
              {creatingRoute ? "Placing Markers..." : "Place Markers"}
            </button>
            <div className={'edit-markers'}>
              <button onClick={undoMarker} disabled={markersPos.length < 1}>Undo</button>
              <button onClick={resetRoute} disabled={markersPos.length < 1 && !selectedRoute && !routeName}>Reset</button>
            </div>
          </div>

          <div style={{ display: 'flex' }}>
            <PointSnappingToggle />
            <ActivityToggle />
          </div>

          <DistanceDisplay />

          <div className='save-route' style={{ display: 'flex', alignItems: 'center' }}>
            <input ref={routeNameInputRef} disabled={markersPos.length < 2} type='text' placeholder='Enter Track Name' value={routeName} onChange={handleRouteNameChange} />

            {Object.keys(allRoutes).includes(routeName) ?
              <img className='track-history-icon' onClick={saveRoute} style={routeName.length < 1 || markersPos.length
                < 2 ? { opacity: 0.5, cursor: 'not-allowed' } : {}} src={overwriteIcon} alt='Overwrite Route' /> :
              <img className='track-history-icon' onClick={saveRoute} style={routeName.length < 1 || markersPos.length
                < 2 ? { opacity: 0.5, cursor: 'not-allowed' } : {}} src={saveIcon} alt='Save Route' />
            }

          </div>

          <RouteLoader />

        </div>}
      </div>

      {locationLoading && <img className="loading-location" src={loadingIconUrl} alt="Loading Location..." />}

    </div>
  );
}

export default App;