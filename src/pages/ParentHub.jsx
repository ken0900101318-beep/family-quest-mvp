import { useState, useEffect } from 'react'
import { mockAPI } from '../lib/supabase'

export default function ParentHub({ user, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('pending') // pending, tasks, stats
  const [pendingRequests, setPendingRequests] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // Mock 待審核申請
    setPendingRequests([
      { 
        id: 101, 
        childId: 2,
        childName: '妹妹',
        title: '幫爸爸洗車', 
        points: 50, 
        description: '我想幫爸爸洗車，讓車子變乾淨',
        status: 'pending', 
        createdAt: '2026-03-24',
        type: 'childRequest'
      },
      { 
        id: 102, 
        childId: 1,
        childName: '哥哥',
        title: '整理書櫃', 
        points: 30,
        description: '把書櫃整理乾淨',
        status: 'pending', 
        createdAt: '2026-03-24',
        type: 'childRequest'
      },
      { 
        id: 103, 
        childId: 2,
        childName: '妹妹',
        title: '完成作業', 
        points: 20,
        status: 'submitted', 
        submittedAt: '2026-03-24 14:30',
        type: 'taskSubmit'
      }
    ])
    
    // Mock 所有任務
    setAllTasks([
      { id: 1, title: '勇者床鋪堡壘', points: 5, icon: '🛏️', type: 'daily', status: 'active', assignedTo: 'all' },
      { id: 2, title: '知識圖書館', points: 10, icon: '📚', type: 'daily', status: 'active', assignedTo: 'all' },
      { id: 3, title: '彩虹牙刷挑戰', points: 50, icon: '🌈', type: 'challenge', status: 'active', assignedTo: 'all', current: 14, target: 21 }
    ])
    
    // Mock 統計數據
    setStats({
      totalPoints: 1850,
      completedTasks: 45,
      pendingReviews: 3,
      childStats: [
        { name: '哥哥', points: 950, completed: 23, rate: 85 },
        { name: '妹妹', points: 900, completed: 22, rate: 88 }
      ]
    })
    
    setLoading(false)
  }

  const handleApprove = (request, adjustedPoints) => {
    alert(`✅ 已核准「${request.title}」\n獎勵點數：${adjustedPoints || request.points} 點`)
    loadData()
  }

  const handleReject = (request, reason) => {
    alert(`❌ 已拒絕「${request.title}」\n原因：${reason}`)
    loadData()
  }

  const handleCreateTask = (taskData) => {
    alert('✅ 任務已創建！')
    setShowTaskForm(false)
    loadData()
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      paddingBottom: '100px'
    }}>
      {/* 樂園背景 */}
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
        {/* 頂部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '900',
            color: '#581c87',
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            👩 家長管理中心
          </h1>
          <button
            onClick={onLogout}
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
            登出
          </button>
        </div>

        {/* 分頁 */}
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
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
            icon="⏰"
            label="待審核"
            badge={pendingRequests.length}
          />
          <TabButton
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
            icon="📋"
            label="任務管理"
          />
          <TabButton
            active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
            icon="📊"
            label="數據統計"
          />
        </div>

        {/* 內容 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#7e22ce', fontSize: '20px' }}>
            載入中...
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <PendingReviews 
                requests={pendingRequests} 
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
            {activeTab === 'tasks' && (
              <TaskManagement 
                tasks={allTasks}
                onCreateNew={() => setShowTaskForm(true)}
              />
            )}
            {activeTab === 'stats' && (
              <Statistics stats={stats} />
            )}
          </>
        )}

        {/* 創建任務表單 */}
        {showTaskForm && (
          <TaskForm
            onSubmit={handleCreateTask}
            onClose={() => setShowTaskForm(false)}
          />
        )}
      </div>
    </div>
  )
}

// 分頁按鈕
function TabButton({ active, onClick, icon, label, badge }) {
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
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      {icon} {label}
      {badge > 0 && (
        <span style={{
          position: 'absolute',
          top: '0.25rem',
          right: '0.25rem',
          background: '#ef4444',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          fontSize: '11px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {badge}
        </span>
      )}
    </button>
  )
}

// 待審核
function PendingReviews({ requests, onApprove, onReject }) {
  if (requests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: '#7e22ce', fontSize: '18px' }}>
        🎉 目前沒有待審核項目
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {requests.map(request => (
        <ReviewCard 
          key={request.id} 
          request={request}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  )
}

// 審核卡片
function ReviewCard({ request, onApprove, onReject }) {
  const [adjustedPoints, setAdjustedPoints] = useState(request.points)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      border: '2px solid rgba(255, 255, 255, 0.9)'
    }}>
      {/* 頂部資訊 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
        <div>
          <div style={{ 
            display: 'inline-block',
            background: 'rgba(251, 191, 36, 0.2)',
            color: '#f59e0b',
            padding: '0.25rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {request.type === 'childRequest' ? '兒童申請' : '任務提交'}
          </div>
          <h3 style={{ color: '#581c87', fontSize: '20px', fontWeight: '900', marginBottom: '0.25rem' }}>
            {request.title}
          </h3>
          <div style={{ color: '#9333ea', fontSize: '14px' }}>
            {request.childName} • {request.createdAt || request.submittedAt}
          </div>
        </div>
      </div>

      {/* 說明 */}
      {request.description && (
        <div style={{
          background: 'rgba(168, 85, 247, 0.1)',
          padding: '0.75rem',
          borderRadius: '0.75rem',
          marginBottom: '1rem',
          color: '#7e22ce',
          fontSize: '14px'
        }}>
          💬 {request.description}
        </div>
      )}

      {/* 點數調整 */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', color: '#7e22ce', fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          獎勵點數
        </label>
        <input
          type="number"
          value={adjustedPoints}
          onChange={(e) => setAdjustedPoints(parseInt(e.target.value))}
          style={{
            width: '120px',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: '2px solid #d8b4fe',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        />
        {adjustedPoints !== request.points && (
          <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontSize: '13px' }}>
            (原：{request.points} 點)
          </span>
        )}
      </div>

      {/* 操作按鈕 */}
      {!showRejectForm ? (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onApprove(request, adjustedPoints)}
            style={{
              flex: 1,
              background: 'linear-gradient(to right, #10b981, #059669)',
              color: 'white',
              fontWeight: '900',
              fontSize: '16px',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            ✅ 核准
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            style={{
              flex: 1,
              background: 'linear-gradient(to right, #f87171, #ef4444)',
              color: 'white',
              fontWeight: '900',
              fontSize: '16px',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
            }}
          >
            ❌ 拒絕
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="請說明拒絕原因..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: '2px solid #fca5a5',
              fontSize: '14px',
              marginBottom: '0.75rem',
              resize: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowRejectForm(false)}
              style={{
                flex: 1,
                background: '#e5e7eb',
                color: '#6b7280',
                fontWeight: 'bold',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              onClick={() => rejectReason && onReject(request, rejectReason)}
              disabled={!rejectReason}
              style={{
                flex: 1,
                background: rejectReason ? 'linear-gradient(to right, #f87171, #ef4444)' : '#d1d5db',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: rejectReason ? 'pointer' : 'not-allowed'
              }}
            >
              確認拒絕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 任務管理（簡化版，之後補完）
function TaskManagement({ tasks, onCreateNew }) {
  return (
    <div>
      <button
        onClick={onCreateNew}
        style={{
          width: '100%',
          background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
          color: 'white',
          fontWeight: '900',
          fontSize: '16px',
          padding: '1rem',
          borderRadius: '1rem',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        ✨ 發布新任務
      </button>
      <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
        任務列表（開發中...）
      </div>
    </div>
  )
}

// 數據統計（簡化版，之後補完）
function Statistics({ stats }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
      數據統計（開發中...）
    </div>
  )
}

// 創建任務表單（簡化版，之後補完）
function TaskForm({ onSubmit, onClose }) {
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
      zIndex: 100
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>創建新任務（開發中）</h2>
        <button onClick={onClose}>關閉</button>
      </div>
    </div>
  )
}
