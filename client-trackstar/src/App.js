import './App.css';
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, ZoomControl, useMapEvents, Marker } from 'react-leaflet'
import { useState } from 'react';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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
  const [markersPos, setMarkersPos] = useState([[0,0]])

  function MyComponent() {
    useMapEvents({
      click: (e) => {
        var lat = e.latlng.lat
        var lng = e.latlng.lng
        setMarkersPos([...markersPos,[lat,lng]])
      },
    })
    return null
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
          <MyComponent />
          {markersPos.map((marker) => {
            return <Marker key={[...marker]} position={[...marker]}/>
          })}
        </MapContainer>
      </div>

      <div className="routemaker-form">
        <input id='map-location' type='text' placeholder='Location'></input>
        <span>Option 2</span>
      </div>

    </div>
  );
}

export default App;
