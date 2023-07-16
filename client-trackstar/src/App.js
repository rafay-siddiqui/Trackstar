import './App.css';
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents, Marker } from 'react-leaflet'
import { useState } from 'react';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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

L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [markersPos, setMarkersPos] = useState([])
  const [mapCenter, setMapCenter] = useState([43.5588, -79.7116])
  const [searchLocation, setSearchLocation] = useState('')
  const [creatingRoute, setCreatingRoute] = useState(false)

  function CreateMarker() {
    useMapEvents({
      click: (e) => {
        var lat = e.latlng.lat
        var lng = e.latlng.lng
        creatingRoute && setMarkersPos([...markersPos, [lat, lng]])
      },
    })

    return null
  }

  const undoMarker = () => {
    let newMarkersPos = [...markersPos];
    if (newMarkersPos.length > 0) newMarkersPos.pop();
    setMarkersPos(newMarkersPos);
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

  function CenterMap() {
    const map = useMap();
    map.flyTo(mapCenter, map.getZoom());
    return null;
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
        <MapContainer center={mapCenter} zoom={13} zoomControl={false}
          style={{ height: "100vh", width: "100%" }} >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <ZoomControl position='bottomright' />
          <CreateMarker />
          {markersPos.map((marker) => {
            return <Marker key={[...marker]} position={[...marker]} />
          })}
          <CenterMap />
        </MapContainer>
      </div>

      <div className="routemaker-form">
        <input id='map-location' type='text' placeholder='Set Location' value={searchLocation} 
        onChange={handleSearchLocationChange} onKeyUp={handleLocationSearch}></input>
        <button onClick={toggleCreatingRoute}>{creatingRoute ? "Creating Route" : "Create Route"}</button>
        {creatingRoute && markersPos.length > 0 && <button onClick={undoMarker}>Undo Last Point</button>}
      </div>

    </div>
  );
}

export default App;