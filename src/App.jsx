

import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import Register from './components/Register'
import Login from './components/Login'
import Rooms from './components/Rooms'
import ChatRoom from './components/ChatRoom'
function App() {

  const isAuthenticated = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/rooms" /> : <Login />} />
        <Route path='/rooms' element={<Rooms/>}></Route>
        <Route path='/register' element={<Register/>}></Route>
        <Route path='/login' element={<Login/>}></Route>
        <Route path="/chat/:roomId" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
