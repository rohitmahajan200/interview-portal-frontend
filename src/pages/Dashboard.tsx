import axios from 'axios'
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {

    const navigate=useNavigate()

    const handleLogout=async()=>{
    await axios.post(
        "http://localhost:8080/api/candidates/logout",
        {}
        ,{
            headers:{
                'Content-Type': 'application/json',
                'x-client-type':'web'
            },
            withCredentials:true
        });
    navigate("/");
}
  return (
    <div>
        <h1>Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
    </div>

  )
}

export default Dashboard