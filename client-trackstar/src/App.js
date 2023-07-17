import './App.css';
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents, Marker } from 'react-leaflet'
import { useState, useEffect } from 'react';

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
  const [creatingRoute, setCreatingRoute] = useState(false);
  const [placingPoint, setPlacingPoint] = useState(false);
  const [pointSnapping, setPointSnapping] = useState(true);
  const [pathDistance, setPathDistance] = useState(0);

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
            if (!isMarkerDuplicate) console.log('placed ' + newMarkerPos)
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
              if (!isMarkerDuplicate) console.log('placed ' + newMarkerPos)
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
  
    if(isMiles) d /= 1.60934;
  
    return d;
  }

  useEffect(() => {
    //  Distance calculation of path-restricted route (OSRM is missing walkways)
    // const fetchPath = async () => {
    //   let posString = markersPos.map(point => `${point[1]},${point[0]}`).join(';')
    //   const response = await axios.get(`http://router.project-osrm.org/route/v1/bicycle/${posString}?continue_straight=true`)
    //   if (response.status === 200) {
    //     setPathCoordinates(response.data.routes[0].distance)
    //   } else console.error("Could not get route path from OSRM.")
    // }
    const getTotalDistance = (points) => {
      let totalDistance = 0
      for (let i=0; i < points.length-1; i++) {
        totalDistance += haversineDistance(points[i], points[i+1])
      }
      return totalDistance;
    }
    if (markersPos.length > 1) {
      //  Distance calculation of path-restricted route
      // fetchPath()
      setPathDistance(getTotalDistance(markersPos))
    }
  }, [markersPos])

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

  const resetMarkers = () => {
    setMarkersPos([])
  }

  const handleSearchLocationChange = (e) => {
    setSearchLocation(e.target.value);
  }

  const handleLocationSearch = async (e) => {
    if (e.key === 'Enter') {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${e.target.value}`)
      if (response.data[0]) {
        const { lat, lon } = response.data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)])
      }
    }
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
            type="radio"
            value="snap"
            checked={pointSnapping}
            onChange={() => setPointSnapping(true)}
          />
          Snap to Road
        </label>
        <label>
          <input
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
          <CenterMap center={mapCenter} />
          <MoveMap />
        </MapContainer>
      </div>

      <div className="routemaker-form">
        <input id='map-location' type='text' placeholder='Set Location' value={searchLocation}
          onChange={handleSearchLocationChange} onKeyUp={handleLocationSearch}></input>
        <button onClick={toggleCreatingRoute}>{creatingRoute ? "Creating Route" : "Create Route"}</button>
        {creatingRoute && <PointSnappingToggle />}
        {creatingRoute && markersPos.length > 0 &&
          <div>
            <button onClick={undoMarker}>Undo Last Point</button>
            <button onClick={resetMarkers}>Reset Route</button>
          </div>}
          <h4 style={{padding: '0px', margin: '0px', marginTop: '10px'}}>Distance: {pathDistance.toFixed(3)} km</h4>
      </div>

    </div>
  );
}

export default App;