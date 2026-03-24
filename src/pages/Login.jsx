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
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div 
        className="rounded-3xl shadow-2xl p-8 w-full max-w-md"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏡</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">家庭任務管理</h1>
          <p className="text-gray-600">請輸入你的 PIN 碼登入</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="輸入 4 位數 PIN 碼"
              className="w-full px-4 py-4 text-center text-2xl font-mono border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none tracking-widest"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length !== 4 || loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all transform hover:scale-105"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        {/* 測試用快速登入 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">測試用快速登入：</p>
          <div className="flex gap-2">
            <button
              onClick={() => quickLogin('1234')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm"
            >
              👩 媽媽 (1234)
            </button>
            <button
              onClick={() => quickLogin('1111')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm"
            >
              👦 哥哥 (1111)
            </button>
            <button
              onClick={() => quickLogin('2222')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm"
            >
              👧 妹妹 (2222)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
