import { useState } from 'react'
import axios from 'axios'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SuperAdminLogin from './superAdminLogin';
import SuperPage from './SuperPage';
import EventOrgLogin from './EventOrgLogin';
import EventOrgDashboard from './EventOrgDashboard';
import MainUserLogin from './MainUserLogin';
import Events from './Events';
import MainUserRegister from './MainUserRegister';
import EventOrgRegister from './EventOrgRegister';

function App() {
  const [count, setCount] = useState(0)


function sendData(){
  
  const fetchData = async () => {
    try {
        const response = await axios.get("http://127.0.0.1:8000/api/test");
        console.log(response.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

fetchData();

}


return (
  <Router>
    <Routes>
      <Route path="" element={<SuperAdminLogin />} />
      <Route path="/dashboard" element={<SuperPage />} />
      <Route path="/eventOrgRegister" element={<EventOrgRegister />} />
      <Route path="/eventOrgLogin" element={<EventOrgLogin />} />
      <Route path="/eventDashboard" element={<EventOrgDashboard />} />
      <Route path="/userRegister" element={<MainUserRegister />} />
      <Route path="/userLogin" element={<MainUserLogin />} />
      <Route path="/events" element={<Events />} />
    </Routes>
  </Router>
);
}


export default App
