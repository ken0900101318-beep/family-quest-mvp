import { useState, useEffect } from 'react'
import { mockAPI } from '../lib/supabase'

export default function ChildDashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    const userTasks = await mockAPI.getTasks(user.id)
    setTasks(userTasks)
    setLoading(false)
  }

  const handleComplete = async (taskId) => {
    const confirmed = window.confirm('確定要提交這個任務嗎？')
    if (!confirmed) return

    try {
      await mockAPI.submitTask(taskId, user.id)
      alert('✅ 任務已提交！等待家長審核中...')
      // 在實際版本中，這裡應該更新 UI 狀態
    } catch (err) {
      alert('提交失敗，請稍後再試')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center text-4xl border-4 border-white">
                {user.name === '哥哥' ? '👦' : '👧'}
              </div>
              <div className="text-white">
                <div className="text-sm opacity-90">Lv. {user.level} 冒險家</div>
                <div className="text-2xl font-bold">{user.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm mb-1">我的金幣</div>
              <div className="text-4xl font-bold text-yellow-300 drop-shadow-lg">
                {user.points} 💰
              </div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <h2 className="text-3xl font-bold text-white mb-6 drop-shadow-lg">
          🚀 我的今日冒險
        </h2>

        {loading ? (
          <div className="text-white text-center py-20">載入中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all"
              >
                <div className="text-5xl mb-4">{task.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {task.title}
                </h3>
                <div className="text-green-600 font-bold mb-4">
                  獎勵：{task.points} 點
                </div>

                {task.progress !== undefined && (
                  <div className="mb-4">
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    {task.current && (
                      <div className="text-sm text-gray-600">
                        進度：{task.current} / {task.target} 天
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleComplete(task.id)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  我完成了！✨
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="bg-white/20 backdrop-blur-md rounded-3xl p-4 shadow-xl">
          <div className="flex justify-around">
            <NavItem icon="🏠" label="首頁" active />
            <NavItem icon="🏛️" label="廣場" />
            <NavItem icon="🎁" label="商店" />
            <NavItem icon="📖" label="存摺" />
            <button
              onClick={onLogout}
              className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all"
            >
              <div className="text-2xl">🚪</div>
              <div className="text-xs">登出</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active }) {
  return (
    <button
      className={`flex flex-col items-center gap-1 transition-all ${
        active ? 'text-white' : 'text-white/70 hover:text-white'
      }`}
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-xs">{label}</div>
    </button>
  )
}
