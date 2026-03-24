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
    } catch (err) {
      alert('提交失敗，請稍後再試')
    }
  }

  // 按時段分類任務
  const getTasksByTime = () => {
    return {
      morning: tasks.filter(t => t.id === 1), // 床鋪
      afternoon: tasks.filter(t => t.id === 2), // 作業
      evening: tasks.filter(t => t.id === 3) // 牙刷挑戰
    }
  }

  const tasksByTime = getTasksByTime()
  const totalTasks = tasks.length
  const completedTasks = 0 // 之後從狀態計算

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-300 via-purple-200 to-purple-100 relative overflow-hidden">
      {/* 樂園背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {/* 摩天輪 */}
        <div className="absolute bottom-10 left-10 text-9xl animate-spin-slow">🎡</div>
        {/* 旋轉木馬 */}
        <div className="absolute bottom-10 right-10 text-8xl">🎠</div>
        {/* 彩旗 */}
        <div className="absolute top-20 left-0 right-0 flex justify-around text-4xl">
          <span>🚩</span><span>🚩</span><span>🚩</span><span>🚩</span><span>🚩</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 relative z-10">
        {/* 頂部資訊欄 */}
        <div className="flex justify-between items-center mb-8">
          {/* 左側：頭像+等級 */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-5xl border-4 border-white shadow-xl">
              {user.name === '哥哥' ? '👦' : '👧'}
            </div>
            <div>
              <div className="text-purple-900 font-bold text-lg">{user.name}</div>
              <div className="text-purple-700 text-sm">Lv.{user.level} 冒險家</div>
            </div>
          </div>

          {/* 右側：Point Bank */}
          <div className="bg-white rounded-2xl px-6 py-3 shadow-lg border-2 border-purple-300">
            <div className="text-purple-600 text-xs font-semibold mb-1">Point Bank</div>
            <div className="text-3xl font-black text-purple-900 flex items-center gap-2">
              {user.points}
              <span className="text-yellow-500 animate-bounce">💰</span>
            </div>
          </div>
        </div>

        {/* 中央進度環 */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full p-6 shadow-xl border-4 border-purple-300">
            <div className="text-5xl font-black text-purple-900">{completedTasks}/{totalTasks}</div>
            <div className="text-purple-600 text-sm font-semibold mt-1">今日完成</div>
          </div>
        </div>

        {/* 標題 */}
        <h2 className="text-3xl font-black text-purple-900 mb-6 text-center">
          🌟 我的今日冒險
        </h2>

        {loading ? (
          <div className="text-center py-20 text-purple-700 text-xl">載入中...</div>
        ) : (
          <div className="space-y-6 mb-20">
            {/* Morning Card */}
            {tasksByTime.morning.length > 0 && (
              <TaskCard
                title="Morning"
                subtitle="勇者床鋪堡壘"
                icon="🛏️"
                color="blue"
                task={tasksByTime.morning[0]}
                onComplete={handleComplete}
              />
            )}

            {/* Afternoon Card */}
            {tasksByTime.afternoon.length > 0 && (
              <TaskCard
                title="Afternoon"
                subtitle="知識圖書館"
                icon="📚"
                color="green"
                task={tasksByTime.afternoon[0]}
                onComplete={handleComplete}
              />
            )}

            {/* Evening Challenge Card */}
            {tasksByTime.evening.length > 0 && (
              <TaskCard
                title="Challenge"
                subtitle="彩虹牙刷挑戰"
                icon="🌈"
                color="purple"
                task={tasksByTime.evening[0]}
                onComplete={handleComplete}
              />
            )}
          </div>
        )}

        {/* 底部導覽 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-purple-300 shadow-2xl">
          <div className="max-w-5xl mx-auto flex justify-around items-center py-4">
            <NavIcon icon="🏠" label="首頁" active />
            <NavIcon icon="🏛️" label="廣場" />
            <NavIcon icon="🎁" label="商店" />
            <button onClick={onLogout} className="flex flex-col items-center">
              <div className="text-3xl">🚪</div>
              <div className="text-xs text-gray-600 mt-1">登出</div>
            </button>
          </div>
        </div>
      </div>

      {/* CSS 動畫 */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  )
}

// 任務卡片組件
function TaskCard({ title, subtitle, icon, color, task, onComplete }) {
  const colorClasses = {
    blue: {
      bg: 'from-blue-400 to-blue-500',
      border: 'border-blue-600',
      text: 'text-blue-900'
    },
    green: {
      bg: 'from-green-400 to-green-500',
      border: 'border-green-600',
      text: 'text-green-900'
    },
    purple: {
      bg: 'from-purple-400 to-purple-500',
      border: 'border-purple-600',
      text: 'text-purple-900'
    }
  }

  const colors = colorClasses[color]

  return (
    <div className={`bg-gradient-to-br ${colors.bg} rounded-3xl p-6 shadow-2xl border-4 ${colors.border} relative overflow-hidden`}>
      {/* 裝飾性圖示背景 */}
      <div className="absolute -right-10 -bottom-10 text-9xl opacity-20">
        {icon}
      </div>

      <div className="relative z-10">
        {/* 頂部標籤 */}
        <div className={`inline-block bg-white px-4 py-1 rounded-full text-sm font-bold ${colors.text} mb-4`}>
          {title}
        </div>

        {/* 主要內容 */}
        <div className="flex items-start gap-6">
          {/* 左側圖示 */}
          <div className="text-7xl">{icon}</div>

          {/* 中間內容 */}
          <div className="flex-1">
            <h3 className="text-white text-2xl font-black mb-3">{subtitle}</h3>
            
            {/* 進度條 */}
            {task.progress !== undefined && (
              <div className="bg-white/30 rounded-full h-3 mb-3 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            )}

            {/* 進度文字 */}
            {task.current && (
              <div className="text-white text-sm mb-3">
                {task.current} / {task.target} 天
              </div>
            )}

            {/* 獎勵標籤 */}
            <div className="inline-block bg-white px-4 py-2 rounded-full">
              <span className="text-yellow-600 font-black text-lg">
                Reward {task.points} pts 🎁
              </span>
            </div>
          </div>
        </div>

        {/* 完成按鈕 */}
        <button
          onClick={() => onComplete(task.id)}
          className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 font-black text-xl py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border-4 border-yellow-600"
        >
          我完成了！✨
        </button>
      </div>
    </div>
  )
}

// 導覽圖示組件
function NavIcon({ icon, label, active }) {
  return (
    <button className={`flex flex-col items-center ${active ? 'opacity-100' : 'opacity-50'} hover:opacity-100 transition-all`}>
      <div className="text-3xl">{icon}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </button>
  )
}
