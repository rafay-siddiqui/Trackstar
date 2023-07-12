import './App.css';
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'

function App() {
  return (
    <div className='App'>
      <nav className="navbar">
        <h1>Trackstar</h1>
        <ul>
          <li>Home</li>
          <li>Tracks</li>
          <li>History</li>
        </ul>
      </nav>
      <MapContainer center={[48.8566, 2.3522]} zoom={13} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
      </MapContainer>
    </div>
  );
}

export default App;
