import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ChildDashboard from './pages/ChildDashboard'
import ParentDashboard from './pages/ParentDashboard'

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // 檢查 localStorage 是否有登入資訊
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (user) => {
    setCurrentUser(user)
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            currentUser ? 
              <Navigate to={currentUser.role === 'parent' ? '/parent' : '/child'} /> : 
              <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/child" 
          element={
            currentUser && currentUser.role === 'child' ? 
              <ChildDashboard user={currentUser} onLogout={handleLogout} /> : 
              <Navigate to="/login" />
          } 
        />
        <Route 
          path="/parent" 
          element={
            currentUser && currentUser.role === 'parent' ? 
              <ParentDashboard user={currentUser} onLogout={handleLogout} /> : 
              <Navigate to="/login" />
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
