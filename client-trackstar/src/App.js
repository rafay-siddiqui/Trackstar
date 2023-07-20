import './App.css';
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents, Marker, Polyline } from 'react-leaflet'
import { useState, useEffect, useRef } from 'react';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import loadingIconUrl from './images/loading-marker-200px.gif'

import axios from 'axios'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [12, 41],
  shadowAnchor: [14, 41],
  popupAnchor: [0, -41]
});

let LoadingIcon = L.icon({
  iconUrl: loadingIconUrl,
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [12, 41],
  shadowAnchor: [14, 41],
  popupAnchor: [0, -41]
})

L.Marker.prototype.options.icon = DefaultIcon;

function App() {
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

  function CreateMarker() {
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

            const response = await axios.get(`http://router.project-osrm.org/nearest/v1/foot/${lng},${lat}`);
            if (response.status === 200 && response.data.waypoints && response.data.waypoints.length > 0) {
              setLoadingPos([])
              const snappedCoordinates = response.data.waypoints[0].location;
              const newMarkerPos = [snappedCoordinates[1], snappedCoordinates[0]];
              const isMarkerDuplicate = markersPos.some(
                pos => pos[0] === newMarkerPos[0] && pos[1] === newMarkerPos[1]
              );
              if (!isMarkerDuplicate) setMarkersPos([...markersPos, newMarkerPos]);
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
    if (newMarkersPos.length > 0) newMarkersPos.pop();
    setMarkersPos(newMarkersPos);
  }

  const resetRoute = () => {
    setMarkersPos([])
    setLoadingPos([]);
    setPathDistance(0)
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
      setSelectedRoute("")
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
      <div style={{ display: 'flex' }}>
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

  const toggleUnitType = () => {
    if (unitType === 'km') {
      setUnitType('miles')
    }
    if (unitType === 'miles') {
      setUnitType('km')
    }
  }

  return (
    <div className='App'>
      <nav className="navbar">
        <h1>TRACKSTAR</h1>
        <ul>
          <li className="navitem">Home</li>
          <li className="navitem">Tracks</li>
          <li className="navitem">History</li>
        </ul>
      </nav>

      <div className="routemaker-map">
        <MapContainer center={[43.5588, -79.7116]} zoom={13} zoomControl={false}
          style={{ height: "100vh", width: "100%" }} >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <ZoomControl position='bottomright' />
          <CreateMarker />
          {markersPos.map((marker, idx) => {
            if (idx === 0 || idx === markersPos.length - 1) return <Marker key={[...marker]} position={[...marker]} />
            return <Marker key={[...marker]} position={[...marker]} icon={LoadingIcon} />
          })}
          {loadingPos.length > 0 && <Marker position={[...loadingPos]} icon={LoadingIcon} />}
          <Polyline positions={markersPos} color='red' />
          <CenterMap center={mapCenter} />
          <MoveMap />
        </MapContainer>
      </div>

      <div className="route-options">

        <div className="routemaker-form">
          <input id='map-location' type='text' placeholder='Set Location' value={searchLocation}
            onChange={handleSearchLocationChange} onKeyUp={handleLocationSearch} />
          <button onClick={toggleCreatingRoute}>{creatingRoute ? "Creating Route" : "Create Route"}</button>

          <PointSnappingToggle />

          <div>
            <button onClick={undoMarker} disabled={!(creatingRoute && markersPos.length > 0)}>Undo Last Point</button>
            <button onClick={resetRoute} disabled={!(creatingRoute && markersPos.length > 0)}>Reset Route</button>
          </div>

          <h4 style={{ padding: '0px', margin: '0px', marginTop: '10px' }}>Distance: {pathDistance.toFixed(3)}
            <button style={{ marginLeft: "5px", padding: "0px", cursor: 'pointer', backgroundColor: "rgba(0,0,0,0)" }} onClick={toggleUnitType}>{unitType}</button>
          </h4>

          <div>
            <input ref={routeNameInputRef} disabled={markersPos.length < 2} type='text' placeholder='Enter Route Name' value={routeName} onChange={handleRouteNameChange} />
            <button onClick={saveRoute} style={routeName.length < 1 || markersPos.length
              < 2 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>Save Route</button>
          </div>

          <div>
            <select ref={loadRouteRef} value={selectedRoute} onChange={(e) => { setSelectedRoute(e.target.value) }}>
              <option value='' disabled>Choose route to load</option>
              {Object.keys(allRoutes).map((route, idx) => {
                return <option key={idx}>{route}</option>
              })}
            </select>
            <button onClick={() => loadRoute(selectedRoute)} style={!selectedRoute ?
               { opacity: 0.5, cursor: 'not-allowed' } : {}}>Load Route</button>
          </div>

        </div>
      </div>

      {locationLoading && <img className="loading-location" src={loadingIconUrl} alt="Loading Location..." />}

    </div>
  );
}

export default App;