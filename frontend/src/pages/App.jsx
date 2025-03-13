import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'

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
    <>
      <h1>Hello </h1>
      <button onClick={sendData}> Send Data </button>
    </>
  )
}

export default App
