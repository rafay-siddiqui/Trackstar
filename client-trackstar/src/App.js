import './App.css';
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'

function App() {
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
          <MapContainer center={[48.8566, 2.3522]} zoom={13} style={{ height: "92vh", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
          </MapContainer>
        </div>

    </div>
  );
}

export default App;
