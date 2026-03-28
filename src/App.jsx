import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ChildDashboard from './pages/ChildDashboard'
import ParentHub from './pages/ParentHub'
import TaskSquare from './pages/TaskSquare'
import Shop from './pages/Shop'
import Passbook from './pages/Passbook'

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  // 暫時保留的 localStorage 登入邏輯（下一步會換成 Supabase）
  useEffect(() => {
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

  // ✨ 完美優化：建立統一的「路由守衛」
  // 負責檢查 1. 是否已登入 2. 角色權限是否正確
  const ProtectedRoute = ({ children, allowedRole }) => {
    if (!currentUser) return <Navigate to="/login" replace />
    if (allowedRole && currentUser.role !== allowedRole) {
      // 如果小孩想闖入家長頁（或反過來），強制送回他們該去的地方
      return <Navigate to={currentUser.role === 'parent' ? '/parent/hub' : '/child'} replace />
    }
    return children
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 🚪 登入入口 */}
        <Route 
          path="/login" 
          element={
            currentUser 
              ? <Navigate to={currentUser.role === 'parent' ? '/parent/hub' : '/child'} replace /> 
              : <Login onLogin={handleLogin} />
          } 
        />

        {/* 🧒 小孩專區 */}
        <Route path="/child" element={
          <ProtectedRoute allowedRole="child">
            <ChildDashboard user={currentUser} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/child/square" element={
          <ProtectedRoute allowedRole="child">
            <TaskSquare user={currentUser} />
          </ProtectedRoute>
        } />
        <Route path="/child/shop" element={
          <ProtectedRoute allowedRole="child">
            <Shop user={currentUser} />
          </ProtectedRoute>
        } />
        <Route path="/child/passbook" element={
          <ProtectedRoute allowedRole="child">
            <Passbook user={currentUser} />
          </ProtectedRoute>
        } />

        {/* 👨‍👩‍👧‍👦 家長專區 */}
        <Route path="/parent" element={<Navigate to="/parent/hub" replace />} />
        <Route path="/parent/hub" element={
          <ProtectedRoute allowedRole="parent">
            <ParentHub user={currentUser} onLogout={handleLogout} />
          </ProtectedRoute>
        } />

        {/* 🛡️ 迷路防呆：亂打網址一律送回登入頁 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
