import { useState } from 'react'
import { mockAPI } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const users = [
    { id: 1, name: '媽媽', emoji: '👩', pin: '1234', color: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
    { id: 2, name: '哥哥', emoji: '👦', pin: '1111', color: 'linear-gradient(135deg, #60a5fa, #3b82f6)' },
    { id: 3, name: '妹妹', emoji: '👧', pin: '2222', color: 'linear-gradient(135deg, #f9a8d4, #ec4899)' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await mockAPI.login(pin)
      
      if (user) {
        onLogin(user)
      } else {
        setError('密碼錯誤，請重試')
        setPin('')
      }
    } catch (err) {
      setError('登入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setPin('')
    setError('')
  }

  const handleBack = () => {
    setSelectedUser(null)
    setPin('')
    setError('')
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}
    >
      {/* 中央淡白漸層遮罩（UI 安全區）*/}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(255,255,255,0.25) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px' }}>
        {/* 標題 */}
        <div className="text-center mb-12">
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: 'bold', 
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            letterSpacing: '1px',
            filter: 'drop-shadow(0 2px 4px rgba(255,255,255,0.5))'
          }}>
            冒險樂園
          </h1>
          <p style={{ 
            color: 'white', 
            fontSize: '16px', 
            fontWeight: '600',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            ✨ 選擇冒險者開始旅程 ✨
          </p>
        </div>

        {!selectedUser ? (
          /* 用戶選擇畫面 */
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                style={{
                  background: 'rgba(255, 255, 255, 0.35)',
                  backdropFilter: 'blur(20px)',
                  border: '3px solid rgba(255, 255, 255, 0.6)',
                  borderRadius: '50%',
                  width: '140px',
                  height: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'
                }}
              >
                <div style={{ fontSize: '56px', marginBottom: '0.5rem' }}>
                  {user.emoji}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0 2px 6px rgba(0,0,0,0.4)'
                }}>
                  {user.name}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* 密碼輸入畫面 */
          <div style={{
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(25px)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
            border: '2px solid rgba(255,255,255,0.6)'
          }}>
            {/* 返回按鈕 */}
            <button
              onClick={handleBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              ← 返回選擇
            </button>

            {/* 已選用戶 */}
            <div className="text-center mb-8">
              <div style={{ fontSize: '64px', marginBottom: '0.75rem' }}>
                {selectedUser.emoji}
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '0.5rem',
                textShadow: '0 2px 6px rgba(0,0,0,0.4)'
              }}>
                {selectedUser.name}
              </h2>
              <p style={{ 
                fontSize: '14px',
                color: 'white',
                fontWeight: '500',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                輸入密碼進入樂園
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength="4"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  style={{
                    width: '80%',
                    maxWidth: '260px',
                    padding: '1.25rem 1.5rem',
                    textAlign: 'center',
                    fontSize: '28px',
                    fontFamily: 'monospace',
                    border: '2px solid rgba(255,255,255,0.7)',
                    borderRadius: '18px',
                    outline: 'none',
                    letterSpacing: '1rem',
                    background: 'rgba(255,255,255,0.85)',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '2px solid rgba(255,255,255,0.95)'
                    e.target.style.boxShadow = '0 6px 20px rgba(139,92,246,0.3)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '2px solid rgba(255,255,255,0.7)'
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(254, 202, 202, 0.9)',
                  border: '2px solid #fca5a5',
                  color: '#dc2626',
                  padding: '1rem 1.25rem',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'center',
                  margin: '0 auto',
                  width: '80%',
                  maxWidth: '260px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="submit"
                  disabled={pin.length !== 4 || loading}
                  style={{
                    width: '80%',
                    maxWidth: '260px',
                    background: pin.length === 4 && !loading
                      ? selectedUser.color
                      : 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.3))',
                    color: 'white',
                    padding: '1.25rem',
                    borderRadius: '18px',
                    fontWeight: 'bold',
                    fontSize: '17px',
                    border: pin.length === 4 && !loading ? 'none' : '2px solid rgba(255,255,255,0.5)',
                    cursor: pin.length === 4 && !loading ? 'pointer' : 'not-allowed',
                    boxShadow: pin.length === 4 && !loading 
                      ? '0 6px 25px rgba(0,0,0,0.3)' 
                      : '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (pin.length === 4 && !loading) {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = pin.length === 4 && !loading 
                      ? '0 6px 25px rgba(0,0,0,0.3)' 
                      : '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🗺️</span>
                  <span>{loading ? '傳送中...' : '進入冒險樂園'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
