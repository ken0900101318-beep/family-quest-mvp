import { useState, useEffect } from 'react'
import { mockAPI } from '../lib/supabase'

export default function TaskSquare({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('ongoing') // ongoing, myRequests, history
  const [tasks, setTasks] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    // Mock 數據（之後接真實 API）
    const allTasks = await mockAPI.getTasks(user.id)
    setTasks(allTasks)
    
    // Mock 申請記錄
    setMyRequests([
      { id: 101, title: '幫爸爸洗車', points: 50, status: 'pending', createdAt: '2026-03-24' },
      { id: 102, title: '整理書櫃', points: 30, status: 'approved', createdAt: '2026-03-23' }
    ])
    
    // Mock 歷史記錄（含所有狀態）
    setHistory([
      // 今天
      { id: 201, title: '整理床鋪', points: 10, status: 'completed', completedAt: '2026-03-24', updatedAt: '2026-03-24' },
      { id: 202, title: '寫功課', points: 15, status: 'pending', completedAt: null, updatedAt: '2026-03-24' },
      
      // 昨天
      { id: 203, title: '完成作業', points: 20, status: 'completed', completedAt: '2026-03-23', updatedAt: '2026-03-23' },
      { id: 204, title: '幫忙倒垃圾', points: 10, status: 'rejected', rejectReason: '沒有綁好垃圾袋', completedAt: null, updatedAt: '2026-03-23' },
      { id: 205, title: '刷牙', points: 5, status: 'completed', completedAt: '2026-03-23', updatedAt: '2026-03-23' },
      
      // 前天
      { id: 206, title: '練習鋼琴', points: 30, status: 'completed', completedAt: '2026-03-22', updatedAt: '2026-03-22' },
      { id: 207, title: '洗碗', points: 15, status: 'expired', completedAt: null, updatedAt: '2026-03-22' },
      
      // 更早
      { id: 208, title: '整理房間', points: 25, status: 'completed', completedAt: '2026-03-20', updatedAt: '2026-03-20' },
      { id: 209, title: '遛狗', points: 10, status: 'completed', completedAt: '2026-03-19', updatedAt: '2026-03-19' },
      { id: 210, title: '讀書', points: 20, status: 'completed', completedAt: '2026-03-15', updatedAt: '2026-03-15' }
    ])
    
    setLoading(false)
  }

  const handleRequestTask = (taskData) => {
    // 提交申請
    const newRequest = {
      id: Date.now(), // 臨時 ID
      title: taskData.title,
      points: parseInt(taskData.points),
      description: taskData.description,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    // 加入申請列表
    setMyRequests([newRequest, ...myRequests])
    
    alert('✅ 任務申請已送出！等待家長審核')
    setShowRequestForm(false)
    setActiveTab('myRequests') // 切換到「我的申請」分頁
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      paddingBottom: '100px'
    }}>
      {/* 樂園背景圖片 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/playground-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0
      }} />
      
      {/* 半透明遮罩 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom, rgba(216, 180, 254, 0.3), rgba(233, 213, 255, 0.2))',
        zIndex: 1
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', position: 'relative', zIndex: 10 }}>
        {/* 頂部標題 + 返回按鈕 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '900',
            color: '#581c87',
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            🏛️ 任務大廳
          </h1>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.9)',
              borderRadius: '0.75rem',
              padding: '0.5rem 1rem',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#581c87',
              cursor: 'pointer'
            }}
          >
            ← 返回
          </button>
        </div>

        {/* 分頁切換 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '0.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <TabButton
            active={activeTab === 'ongoing'}
            onClick={() => setActiveTab('ongoing')}
            icon="📋"
            label="進行中"
          />
          <TabButton
            active={activeTab === 'myRequests'}
            onClick={() => setActiveTab('myRequests')}
            icon="⏰"
            label="我的申請"
          />
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon="📜"
            label="歷史記錄"
          />
        </div>

        {/* 內容區域 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#7e22ce', fontSize: '20px' }}>
            載入中...
          </div>
        ) : (
          <>
            {activeTab === 'ongoing' && (
              <OngoingTasks tasks={tasks} onRequestNew={() => setShowRequestForm(true)} />
            )}
            {activeTab === 'myRequests' && (
              <MyRequests requests={myRequests} />
            )}
            {activeTab === 'history' && (
              <History records={history} />
            )}
          </>
        )}

        {/* 申請任務表單彈窗 */}
        {showRequestForm && (
          <RequestTaskForm
            onSubmit={handleRequestTask}
            onClose={() => setShowRequestForm(false)}
          />
        )}
      </div>
    </div>
  )
}

// 分頁按鈕
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)' : 'transparent',
        color: active ? 'white' : '#7e22ce',
        border: 'none',
        borderRadius: '0.75rem',
        padding: '0.75rem',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      {icon} {label}
    </button>
  )
}

// 進行中的任務
function OngoingTasks({ tasks, onRequestNew }) {
  return (
    <div>
      {/* 申請新任務按鈕 */}
      <button
        onClick={onRequestNew}
        style={{
          width: '100%',
          background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
          color: 'white',
          fontWeight: '900',
          fontSize: '16px',
          padding: '1rem',
          borderRadius: '1rem',
          border: '2px solid #fcd34d',
          boxShadow: '0 6px 20px rgba(251, 191, 36, 0.4)',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        ✨ 我想申請新任務
      </button>

      {/* 任務列表 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} type="ongoing" />
        ))}
      </div>
    </div>
  )
}

// 我的申請
function MyRequests({ requests }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
          還沒有申請記錄
        </div>
      ) : (
        requests.map(request => (
          <RequestCard key={request.id} request={request} />
        ))
      )}
    </div>
  )
}

// 歷史記錄
function History({ records }) {
  const [timeRange, setTimeRange] = useState('7days') // 7days, 30days, all

  // 按時間範圍篩選
  const filterByTimeRange = (records) => {
    const now = new Date()
    const cutoffDays = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 9999
    const cutoffDate = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000)
    
    return records.filter(r => {
      const recordDate = new Date(r.completedAt || r.updatedAt)
      return recordDate >= cutoffDate
    })
  }

  // 按日期分組
  const groupByDate = (records) => {
    const groups = {}
    records.forEach(record => {
      const date = record.completedAt || record.updatedAt
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(record)
    })
    return groups
  }

  const filteredRecords = filterByTimeRange(records)
  const groupedRecords = groupByDate(filteredRecords)
  const dates = Object.keys(groupedRecords).sort().reverse()

  return (
    <div>
      {/* 時間範圍切換 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        padding: '0.5rem',
        marginBottom: '1rem',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <TimeRangeButton
          active={timeRange === '7days'}
          onClick={() => setTimeRange('7days')}
          label="近 7 天"
        />
        <TimeRangeButton
          active={timeRange === '30days'}
          onClick={() => setTimeRange('30days')}
          label="近 30 天"
        />
        <TimeRangeButton
          active={timeRange === 'all'}
          onClick={() => setTimeRange('all')}
          label="全部"
        />
      </div>

      {/* 時間軸顯示 */}
      {dates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
          {timeRange === '7days' ? '近 7 天沒有記錄' : timeRange === '30days' ? '近 30 天沒有記錄' : '還沒有任何記錄'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {dates.map(date => (
            <div key={date}>
              {/* 日期標籤 */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: '0.75rem',
                padding: '0.5rem 1rem',
                marginBottom: '0.75rem',
                display: 'inline-block'
              }}>
                <span style={{ color: '#7e22ce', fontWeight: 'bold', fontSize: '14px' }}>
                  📅 {formatDate(date)}
                </span>
              </div>
              {/* 該日期的任務 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {groupedRecords[date].map(record => (
                  <HistoryCard key={record.id} record={record} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 時間範圍按鈕
function TimeRangeButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)' : 'transparent',
        color: active ? 'white' : '#7e22ce',
        border: 'none',
        borderRadius: '0.75rem',
        padding: '0.5rem',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      {label}
    </button>
  )
}

// 日期格式化
function formatDate(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  
  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天'
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天'
  } else {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

// 任務卡片
function TaskCard({ task, type }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '1rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      border: '2px solid rgba(255, 255, 255, 0.9)'
    }}>
      <div style={{ fontSize: '40px', marginBottom: '0.5rem' }}>{task.icon}</div>
      <h3 style={{ color: '#581c87', fontSize: '16px', fontWeight: '900', marginBottom: '0.5rem' }}>
        {task.title}
      </h3>
      <div style={{
        display: 'inline-block',
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        padding: '0.25rem 0.75rem',
        borderRadius: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        <span style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>
          {task.points} pts 🎁
        </span>
      </div>
      <button
        style={{
          width: '100%',
          background: 'linear-gradient(to right, #a78bfa, #8b5cf6)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        我完成了！✨
      </button>
    </div>
  )
}

// 申請卡片
function RequestCard({ request }) {
  const statusConfig = {
    pending: { label: '待審核', color: '#f59e0b', bg: 'rgba(251, 191, 36, 0.2)' },
    approved: { label: '已核准', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
    rejected: { label: '已拒絕', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' }
  }
  const config = statusConfig[request.status]

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '1rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      border: '2px solid rgba(255, 255, 255, 0.9)'
    }}>
      <div style={{
        display: 'inline-block',
        background: config.bg,
        color: config.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '0.5rem',
        fontSize: '12px',
        fontWeight: 'bold',
        marginBottom: '0.5rem'
      }}>
        {config.label}
      </div>
      <h3 style={{ color: '#581c87', fontSize: '16px', fontWeight: '900', marginBottom: '0.5rem' }}>
        {request.title}
      </h3>
      <div style={{ color: '#7e22ce', fontSize: '14px', marginBottom: '0.25rem' }}>
        期望點數：{request.points} 點
      </div>
      <div style={{ color: '#9333ea', fontSize: '12px' }}>
        申請時間：{request.createdAt}
      </div>
    </div>
  )
}

// 歷史卡片
function HistoryCard({ record }) {
  const statusConfig = {
    completed: { 
      icon: '✅', 
      label: '已完成', 
      color: '#10b981', 
      bg: 'linear-gradient(135deg, #10b981, #059669)',
      showPoints: true 
    },
    pending: { 
      icon: '⏳', 
      label: '待審核', 
      color: '#f59e0b', 
      bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      showPoints: false 
    },
    rejected: { 
      icon: '❌', 
      label: '已拒絕', 
      color: '#ef4444', 
      bg: 'linear-gradient(135deg, #f87171, #ef4444)',
      showPoints: false 
    },
    expired: { 
      icon: '🕒', 
      label: '已過期', 
      color: '#6b7280', 
      bg: 'linear-gradient(135deg, #9ca3af, #6b7280)',
      showPoints: false 
    }
  }
  
  const config = statusConfig[record.status] || statusConfig.completed
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '1rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      border: '2px solid rgba(255, 255, 255, 0.9)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '18px' }}>{config.icon}</span>
          <h3 style={{ color: '#581c87', fontSize: '16px', fontWeight: '900' }}>
            {record.title}
          </h3>
        </div>
        <div style={{
          display: 'inline-block',
          background: `${config.color}20`,
          color: config.color,
          padding: '0.15rem 0.5rem',
          borderRadius: '0.5rem',
          fontSize: '11px',
          fontWeight: 'bold'
        }}>
          {config.label}
        </div>
        {record.rejectReason && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '12px', 
            marginTop: '0.5rem',
            fontStyle: 'italic'
          }}>
            原因：{record.rejectReason}
          </div>
        )}
      </div>
      {config.showPoints && (
        <div style={{
          background: config.bg,
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.75rem',
          fontWeight: '900',
          fontSize: '16px',
          whiteSpace: 'nowrap'
        }}>
          +{record.points}
        </div>
      )}
    </div>
  )
}

// 申請任務表單
function RequestTaskForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({ title: '', points: '', description: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.points) {
      alert('請填寫任務名稱和期望點數')
      return
    }
    onSubmit(formData)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ color: '#581c87', fontSize: '20px', fontWeight: '900', marginBottom: '1rem' }}>
          ✨ 申請新任務
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#7e22ce', fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              任務名稱
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：幫忙洗車"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #d8b4fe',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#7e22ce', fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              期望點數
            </label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              placeholder="例如：50"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #d8b4fe',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#7e22ce', fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              說明（選填）
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="例如：我想幫爸爸洗車，讓車子變乾淨"
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #d8b4fe',
                fontSize: '14px',
                resize: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: '#e5e7eb',
                color: '#6b7280',
                fontWeight: 'bold',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              送出申請
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
