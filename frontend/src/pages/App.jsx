import { useState } from 'react'


import axios from 'axios'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SuperAdminLogin from './superAdminLogin';
import SuperPage from './SuperPage';

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
    </Routes>
  </Router>
);
}


export default App
