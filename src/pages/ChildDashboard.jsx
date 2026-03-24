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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 p-4 md:p-6 relative overflow-hidden">
      {/* 星空背景動畫 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header - 更大更華麗 */}
        <div className="bg-gradient-to-r from-white/25 to-white/15 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 mb-8 shadow-2xl border-2 border-white/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* 用戶資訊 - 加大 */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-500 rounded-full flex items-center justify-center text-6xl md:text-7xl border-4 border-white shadow-2xl animate-pulse-slow">
                {user.name === '哥哥' ? '👦' : '👧'}
              </div>
              <div className="text-white">
                <div className="text-base md:text-lg opacity-90 mb-1">Lv. {user.level} 冒險家</div>
                <div className="text-3xl md:text-4xl font-black">{user.name}</div>
              </div>
            </div>
            
            {/* 金幣顯示 - 更突出 */}
            <div className="text-center md:text-right bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-2xl px-6 py-4 border-2 border-yellow-300/50">
              <div className="text-white/90 text-sm md:text-base mb-1 font-semibold">我的金幣</div>
              <div className="text-5xl md:text-6xl font-black text-yellow-300 drop-shadow-[0_0_20px_rgba(253,224,71,0.8)] animate-bounce-slow">
                {user.points} 💰
              </div>
            </div>
          </div>
        </div>

        {/* 標題 - 更大更閃 */}
        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] text-center md:text-left animate-slide-down">
          🚀 我的今日冒險
        </h2>

        {loading ? (
          <div className="text-white text-center py-20 text-2xl">載入中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mb-8">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="group bg-gradient-to-br from-white via-white to-gray-50 rounded-3xl p-6 md:p-8 shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:-translate-y-3 transition-all duration-300 border-4 border-transparent hover:border-cyan-400 hover:border-opacity-50 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* 圖示 - 更大 */}
                <div className="text-7xl md:text-8xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {task.icon}
                </div>
                
                {/* 標題 - 更大 */}
                <h3 className="text-2xl md:text-3xl font-black text-gray-800 mb-4 leading-tight">
                  {task.title}
                </h3>
                
                {/* 獎勵 - 更突出 */}
                <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg md:text-xl px-4 py-2 rounded-full mb-6 shadow-lg">
                  獎勵：{task.points} 點 ⭐
                </div>

                {/* 進度條 - 更大更明顯 */}
                {task.progress !== undefined && (
                  <div className="mb-6">
                    <div className="bg-gray-300 h-4 rounded-full overflow-hidden mb-3 border-2 border-gray-400">
                      <div
                        className="bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 h-full transition-all duration-500 shadow-inner animate-pulse-slow"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    {task.current && (
                      <div className="text-base md:text-lg text-gray-700 font-bold">
                        進度：{task.current} / {task.target} 天 🎯
                      </div>
                    )}
                  </div>
                )}

                {/* 完成按鈕 - 超大！ */}
                <button
                  onClick={() => handleComplete(task.id)}
                  className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-black text-xl md:text-2xl py-5 md:py-6 px-8 rounded-2xl shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-yellow-300/50 animate-pulse-glow"
                >
                  我完成了！✨🎉
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 導覽列 - 加大圖示和間距 */}
        <div className="bg-gradient-to-r from-white/25 to-white/15 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border-2 border-white/30 sticky bottom-4">
          <div className="flex justify-around items-center">
            <NavItem icon="🏠" label="首頁" active />
            <NavItem icon="🏛️" label="廣場" />
            <NavItem icon="🎁" label="商店" />
            <NavItem icon="📖" label="存摺" />
            <button
              onClick={onLogout}
              className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95"
            >
              <div className="text-4xl">🚪</div>
              <div className="text-sm md:text-base font-semibold">登出</div>
            </button>
          </div>
        </div>
      </div>

      {/* CSS 動畫 */}
      <style>{`
        /* 星空動畫 */
        .stars, .stars2, .stars3 {
          position: absolute;
          width: 100%;
          height: 100%;
          background: transparent;
        }
        
        .stars {
          background-image: 
            radial-gradient(2px 2px at 20% 30%, white, transparent),
            radial-gradient(2px 2px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(2px 2px at 90% 60%, white, transparent);
          background-size: 200% 200%;
          animation: stars 20s linear infinite;
          opacity: 0.5;
        }
        
        .stars2 {
          background-image: 
            radial-gradient(1px 1px at 10% 20%, white, transparent),
            radial-gradient(1px 1px at 70% 80%, white, transparent);
          background-size: 180% 180%;
          animation: stars 30s linear infinite;
          opacity: 0.3;
        }
        
        .stars3 {
          background-image: 
            radial-gradient(1px 1px at 40% 50%, white, transparent),
            radial-gradient(2px 2px at 85% 15%, white, transparent);
          background-size: 220% 220%;
          animation: stars 40s linear infinite;
          opacity: 0.4;
        }
        
        @keyframes stars {
          from { background-position: 0 0; }
          to { background-position: 100% 100%; }
        }
        
        /* 慢速脈衝 */
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        /* 慢速彈跳 */
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        /* 發光脈衝 */
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 10px 30px rgba(251, 191, 36, 0.4); }
          50% { box-shadow: 0 10px 40px rgba(251, 191, 36, 0.8); }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        /* 滑入動畫 */
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-slide-down {
          animation: slide-down 0.5s ease-out;
        }
        
        /* 淡入動畫 */
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out both;
        }
      `}</style>
    </div>
  )
}

function NavItem({ icon, label, active }) {
  return (
    <button
      className={`flex flex-col items-center gap-2 transition-all hover:scale-110 active:scale-95 ${
        active ? 'text-white' : 'text-white/70 hover:text-white'
      }`}
    >
      <div className="text-4xl">{icon}</div>
      <div className="text-sm md:text-base font-semibold">{label}</div>
    </button>
  )
}
