import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import ChildDashboard from './pages/ChildDashboard'
import ParentDashboard from './pages/ParentDashboard'
import TaskSquare from './pages/TaskSquare'

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
              <ChildWrapper user={currentUser} onLogout={handleLogout} /> : 
              <Navigate to="/login" />
          } 
        />
        <Route 
          path="/child/square" 
          element={
            currentUser && currentUser.role === 'child' ? 
              <TaskSquareWrapper user={currentUser} /> : 
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

// Child Dashboard Wrapper
function ChildWrapper({ user, onLogout }) {
  const navigate = useNavigate()
  return <ChildDashboard user={user} onLogout={onLogout} onNavigate={(page) => navigate(`/child/${page}`)} />
}

// Task Square Wrapper
function TaskSquareWrapper({ user }) {
  const navigate = useNavigate()
  return <TaskSquare user={user} onBack={() => navigate('/child')} />
}

export default App
