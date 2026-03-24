import { useState, useEffect } from 'react'
import { mockAPI, mockData } from '../lib/supabase'

export default function ParentDashboard({ user, onLogout }) {
  const [submissions, setSubmissions] = useState([])
  const [stats, setStats] = useState({ pending: 0, monthlyPoints: 0, activeUsers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const pending = await mockAPI.getPendingSubmissions()
    setSubmissions(pending)

    // 計算統計
    const monthlyPoints = mockData.transactions
      .filter(t => t.type === 'earn')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const activeUsers = mockData.users.filter(u => u.role === 'child').length

    setStats({
      pending: pending.length,
      monthlyPoints,
      activeUsers
    })
    
    setLoading(false)
  }

  const handleApprove = async (submission) => {
    try {
      await mockAPI.approveSubmission(submission.id)
      alert('✅ 已核准！點數已發放')
      loadData() // 重新載入
    } catch (err) {
      alert('操作失敗')
    }
  }

  const handleReject = async (submission) => {
    const reason = prompt('請輸入退回原因（會顯示給孩子）：')
    if (!reason) return

    try {
      await mockAPI.rejectSubmission(submission.id, reason)
      alert('已退回並通知孩子')
      loadData()
    } catch (err) {
      alert('操作失敗')
    }
  }

  const handleAdjust = async (submission) => {
    const task = mockData.tasks.find(t => t.id === submission.taskId)
    const newPoints = prompt(`請輸入調整後的點數（原本：${task.points} 點）：`, task.points)
    
    if (!newPoints || isNaN(newPoints)) return

    try {
      await mockAPI.approveSubmission(submission.id, parseInt(newPoints))
      alert(`✅ 已核准並調整為 ${newPoints} 點`)
      loadData()
    } catch (err) {
      alert('操作失敗')
    }
  }

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '剛剛'
    if (minutes < 60) return `${minutes} 分鐘前`
    const hours = Math.floor(minutes / 60)
    return `${hours} 小時前`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">📋 一鍵審核牆</h1>
              <p className="text-gray-600 mt-1">管理家庭任務與獎勵</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all"
            >
              登出
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="今日待審核"
            value={stats.pending}
            unit="件"
            gradient="from-orange-500 to-red-600"
            warning={stats.pending > 0}
          />
          <StatCard
            title="本月點數發放"
            value={stats.monthlyPoints}
            gradient="from-purple-600 to-indigo-700"
          />
          <StatCard
            title="活躍成員"
            value={stats.activeUsers}
            unit="人"
            gradient="from-blue-500 to-cyan-600"
          />
        </div>

        {/* Submissions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ⏳ 待審核任務
          </h2>

          {loading ? (
            <div className="text-center py-10 text-gray-500">載入中...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              🎉 目前沒有待審核的任務
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const task = mockData.tasks.find(t => t.id === submission.taskId)
                return (
                  <div
                    key={submission.id}
                    className="bg-gray-50 border-2 border-gray-200 hover:border-purple-300 rounded-xl p-5 flex items-center gap-6 transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center text-3xl flex-shrink-0 border-4 border-white shadow-lg">
                      {submission.userAvatar}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 mb-1">
                        {submission.userName}
                      </div>
                      <div className="text-gray-600 text-sm mb-1">
                        {task.icon} {task.title}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {formatTime(submission.timestamp)}
                      </div>
                    </div>

                    {/* Photo */}
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                      📸<br/>成果照片
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(submission)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all hover:scale-105"
                      >
                        ✅ 核准
                      </button>
                      <button
                        onClick={() => handleAdjust(submission)}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all hover:scale-105"
                      >
                        ✏️ 調整
                      </button>
                      <button
                        onClick={() => handleReject(submission)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-all hover:scale-105"
                      >
                        ❌ 退回
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tips */}
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-800">
              💡 <strong>提示：</strong> 長按卡片可進行批次全選操作。點擊「調整」可以修改給予的點數。退回時請填寫原因，讓孩子知道如何改進。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, unit = '', gradient, warning }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white shadow-lg`}>
      <div className="text-sm opacity-90 mb-2">{title}</div>
      <div className="text-4xl font-bold">
        {value} {unit && <span className="text-xl">{unit}</span>}
      </div>
      {warning && (
        <div className="mt-2 text-xs bg-white/20 rounded px-2 py-1 inline-block">
          需要處理
        </div>
      )}
    </div>
  )
}
