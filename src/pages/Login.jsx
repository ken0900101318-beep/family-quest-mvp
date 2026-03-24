import { useState } from 'react'
import { mockAPI } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const quickLogin = (testPin) => {
    setPin(testPin)
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
        background: 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div 
        className="w-full max-w-md"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(25px)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.5)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div className="text-center mb-8">
          <div style={{ fontSize: '72px', marginBottom: '1rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
            🏰
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.75rem',
            letterSpacing: '0.5px'
          }}>
            冒險樂園
          </h1>
          <p style={{ color: '#7e22ce', fontSize: '15px', fontWeight: '500' }}>
            ✨ 輸入密碼開始冒險 ✨
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                textAlign: 'center',
                fontSize: '28px',
                fontFamily: 'monospace',
                border: '2px solid #e9d5ff',
                borderRadius: '18px',
                outline: 'none',
                letterSpacing: '1rem',
                background: 'rgba(255,255,255,0.8)',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(139,92,246,0.08)'
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid #a78bfa'
                e.target.style.boxShadow = '0 4px 16px rgba(139,92,246,0.2)'
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid #e9d5ff'
                e.target.style.boxShadow = '0 2px 8px rgba(139,92,246,0.08)'
              }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(254, 202, 202, 0.8)',
              border: '2px solid #fca5a5',
              color: '#dc2626',
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length !== 4 || loading}
            style={{
              width: '100%',
              background: pin.length === 4 && !loading
                ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
                : 'linear-gradient(135deg, #d8b4fe, #c4b5fd)',
              color: 'white',
              padding: '1.25rem',
              borderRadius: '18px',
              fontWeight: 'bold',
              fontSize: '17px',
              border: 'none',
              cursor: pin.length === 4 && !loading ? 'pointer' : 'not-allowed',
              boxShadow: pin.length === 4 && !loading 
                ? '0 6px 20px rgba(139,92,246,0.35)' 
                : '0 2px 8px rgba(139,92,246,0.15)',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
            onMouseEnter={(e) => {
              if (pin.length === 4 && !loading) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 8px 25px rgba(139,92,246,0.45)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = pin.length === 4 && !loading 
                ? '0 6px 20px rgba(139,92,246,0.35)' 
                : '0 2px 8px rgba(139,92,246,0.15)'
            }}
          >
            <span style={{ fontSize: '20px' }}>🗺️</span>
            <span>{loading ? '傳送中...' : '進入冒險樂園'}</span>
          </button>
        </form>

        {/* 測試用快速登入 */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(233,213,255,0.5)' }}>
          <p style={{ fontSize: '12px', color: '#9333ea', textAlign: 'center', marginBottom: '0.875rem', fontWeight: '500' }}>
            🎯 測試快速通道
          </p>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button
              onClick={() => quickLogin('1234')}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(233,213,255,0.6), rgba(216,180,254,0.6))',
                color: '#7e22ce',
                padding: '0.75rem 0.5rem',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1.5px solid #e9d5ff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(216,180,254,0.8), rgba(168,85,247,0.6))'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(233,213,255,0.6), rgba(216,180,254,0.6))'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              👩 媽媽
            </button>
            <button
              onClick={() => quickLogin('1111')}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(191,219,254,0.6), rgba(147,197,253,0.6))',
                color: '#1e40af',
                padding: '0.75rem 0.5rem',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1.5px solid #bfdbfe',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(147,197,253,0.8), rgba(96,165,250,0.6))'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(191,219,254,0.6), rgba(147,197,253,0.6))'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              👦 哥哥
            </button>
            <button
              onClick={() => quickLogin('2222')}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(252,231,243,0.6), rgba(251,207,232,0.6))',
                color: '#be185d',
                padding: '0.75rem 0.5rem',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1.5px solid #fce7f3',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(251,207,232,0.8), rgba(249,168,212,0.6))'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(252,231,243,0.6), rgba(251,207,232,0.6))'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              👧 妹妹
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
