import { useState, useEffect } from 'react'
import { mockAPI, mockData } from '../lib/supabase'

export default function ParentHub({ user, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('pending') // pending, tasks, stats, shop
  const [pendingRequests, setPendingRequests] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [stats, setStats] = useState({})
  const [purchases, setPurchases] = useState([])
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // 從 localStorage 讀取提交記錄
    const stored = JSON.parse(localStorage.getItem('submissions') || '[]')
    const pendingSubmissions = stored.filter(s => s.status === 'pending')
    
    // 轉換格式以匹配 UI
    const formattedRequests = []
    for (const sub of pendingSubmissions) {
      // 從 API 獲取最新任務資料
      const userTasks = await mockAPI.getTasks(sub.userId)
      const task = userTasks.find(t => t.id === sub.taskId)
      
      formattedRequests.push({
        id: sub.id,
        childId: sub.userId,
        childName: sub.userName,
        title: task ? task.title : `任務 #${sub.taskId}`,
        points: task ? task.points : 10,
        description: sub.description || '',
        status: 'submitted',
        submittedAt: new Date(sub.timestamp).toLocaleString('zh-TW'),
        type: 'taskSubmit',
        photo: sub.photo,
        taskId: sub.taskId
      })
    }
    
    setPendingRequests(formattedRequests)
    
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
    
    // 讀取兌換記錄
    const purchaseData = JSON.parse(localStorage.getItem('purchases') || '[]')
    const pendingPurchases = purchaseData.filter(p => p.status === 'pending')
    setPurchases(pendingPurchases)
    
    // 讀取許願清單
    const wishData = JSON.parse(localStorage.getItem('wishes') || '[]')
    const pendingWishes = wishData.filter(w => w.status === 'pending')
    setWishes(pendingWishes)
    
    setLoading(false)
  }

  const handleApprove = async (request, adjustedPoints) => {
    try {
      await mockAPI.approveSubmission(request.id, adjustedPoints)
      // 從待審核列表中移除
      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
      alert(`✅ 已核准「${request.title}」\n獎勵點數：${adjustedPoints || request.points} 點`)
    } catch (err) {
      alert('❌ 核准失敗，請稍後再試')
    }
  }

  const handleReject = async (request, reason) => {
    try {
      await mockAPI.rejectSubmission(request.id, reason)
      // 從待審核列表中移除
      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
      alert(`❌ 已拒絕「${request.title}」\n原因：${reason}`)
    } catch (err) {
      alert('❌ 拒絕失敗，請稍後再試')
    }
  }

  const handleCreateTask = (taskData) => {
    if (editingTask) {
      // 更新現有任務
      const updatedTasks = allTasks.map(t => 
        t.id === editingTask.id ? { ...t, ...taskData } : t
      )
      setAllTasks(updatedTasks)
      alert('✅ 任務已更新！')
    } else {
      // 創建新任務
      const newTask = {
        id: Date.now(),
        ...taskData,
        status: 'active'
      }
      setAllTasks([...allTasks, newTask])
      alert('✅ 任務已創建！')
    }
    setShowTaskForm(false)
    setEditingTask(null)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleToggleTask = (task) => {
    const newStatus = task.status === 'active' ? 'inactive' : 'active'
    const updatedTasks = allTasks.map(t => 
      t.id === task.id ? { ...t, status: newStatus } : t
    )
    setAllTasks(updatedTasks)
    alert(`✅ 任務已${newStatus === 'active' ? '啟用' : '停用'}`)
  }

  const handleDeliverPurchase = (purchase) => {
    const purchaseData = JSON.parse(localStorage.getItem('purchases') || '[]')
    const updated = purchaseData.map(p => 
      p.id === purchase.id ? { ...p, status: 'delivered', deliveredAt: new Date().toISOString() } : p
    )
    localStorage.setItem('purchases', JSON.stringify(updated))
    setPurchases(prev => prev.filter(p => p.id !== purchase.id))
    alert(`✅ 已標記「${purchase.productName}」為已發放`)
    loadData()
  }

  const handleApproveWish = (wish) => {
    const wishData = JSON.parse(localStorage.getItem('wishes') || '[]')
    const updated = wishData.map(w => 
      w.id === wish.id ? { ...w, status: 'approved' } : w
    )
    localStorage.setItem('wishes', JSON.stringify(updated))
    setWishes(prev => prev.filter(w => w.id !== wish.id))
    alert(`✅ 已核准許願「${wish.name}」`)
    loadData()
  }

  const handleRejectWish = (wish, reason) => {
    if (!reason) {
      alert('請輸入拒絕原因')
      return
    }
    const wishData = JSON.parse(localStorage.getItem('wishes') || '[]')
    const updated = wishData.map(w => 
      w.id === wish.id ? { ...w, status: 'rejected', rejectReason: reason } : w
    )
    localStorage.setItem('wishes', JSON.stringify(updated))
    setWishes(prev => prev.filter(w => w.id !== wish.id))
    alert(`❌ 已拒絕許願「${wish.name}」\n原因：${reason}`)
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
            active={activeTab === 'shop'}
            onClick={() => setActiveTab('shop')}
            icon="🎁"
            label="商店管理"
            badge={purchases.length + wishes.length}
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
                onCreateNew={() => { setEditingTask(null); setShowTaskForm(true); }}
                onEditTask={handleEditTask}
                onToggleTask={handleToggleTask}
              />
            )}
            {activeTab === 'shop' && (
              <ShopManagement
                purchases={purchases}
                wishes={wishes}
                onDeliverPurchase={handleDeliverPurchase}
                onApproveWish={handleApproveWish}
                onRejectWish={handleRejectWish}
              />
            )}
            {activeTab === 'stats' && (
              <Statistics stats={stats} />
            )}
          </>
        )}

        {/* 創建/編輯任務表單 */}
        {showTaskForm && (
          <TaskForm
            task={editingTask}
            onSubmit={handleCreateTask}
            onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
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
  const [selectedIds, setSelectedIds] = useState([])
  
  const handleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(requests.map(r => r.id))
    }
  }

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) {
      alert('請先選擇要批次核准的項目')
      return
    }
    
    if (confirm(`確定要批次核准 ${selectedIds.length} 個項目嗎？`)) {
      for (const id of selectedIds) {
        const request = requests.find(r => r.id === id)
        if (request) {
          await onApprove(request, request.points)
        }
      }
      setSelectedIds([])
      alert(`✅ 已批次核准 ${selectedIds.length} 個項目`)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  if (requests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: '#7e22ce', fontSize: '18px' }}>
        🎉 目前沒有待審核項目
      </div>
    )
  }

  // 計算摘要數據
  const totalItems = requests.length
  const totalPoints = requests.reduce((sum, r) => sum + r.points, 0)

  return (
    <div>
      {/* 頂部摘要卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 8px 20px rgba(251, 191, 36, 0.4)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>待審核數量</div>
          <div style={{ fontSize: '36px', fontWeight: '900' }}>{totalItems}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>總獎勵點數</div>
          <div style={{ fontSize: '36px', fontWeight: '900' }}>{totalPoints} 💰</div>
        </div>
        {selectedIds.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '1rem',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>已選擇</div>
            <div style={{ fontSize: '36px', fontWeight: '900' }}>{selectedIds.length}</div>
          </div>
        )}
      </div>

      {/* 批次操作按鈕 */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={handleSelectAll}
          style={{
            flex: 1,
            background: 'rgba(168, 85, 247, 0.1)',
            color: '#7e22ce',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: '2px solid #d8b4fe',
            cursor: 'pointer'
          }}
        >
          {selectedIds.length === requests.length ? '取消全選' : '全選'}
        </button>
        <button
          onClick={handleBatchApprove}
          disabled={selectedIds.length === 0}
          style={{
            flex: 2,
            background: selectedIds.length > 0
              ? 'linear-gradient(to right, #10b981, #059669)'
              : '#d1d5db',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
            boxShadow: selectedIds.length > 0 ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none'
          }}
        >
          ✅ 批次核准 ({selectedIds.length})
        </button>
      </div>

      {/* 審核列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {requests.map(request => (
          <ReviewCard 
            key={request.id} 
            request={request}
            selected={selectedIds.includes(request.id)}
            onToggleSelect={() => toggleSelect(request.id)}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  )
}

// 審核卡片
function ReviewCard({ request, selected, onToggleSelect, onApprove, onReject }) {
  const [adjustedPoints, setAdjustedPoints] = useState(request.points)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  return (
    <div style={{
      background: selected 
        ? 'rgba(167, 139, 250, 0.2)'
        : 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      border: selected ? '2px solid #a78bfa' : '2px solid rgba(255, 255, 255, 0.9)',
      padding: '1.5rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      position: 'relative'
    }}>
      {/* 選擇框 */}
      <div
        onClick={onToggleSelect}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '3px solid #a78bfa',
          background: selected ? '#a78bfa' : 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          transition: 'all 0.2s'
        }}
      >
        {selected && '✓'}
      </div>
      
      {/* 頂部資訊 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', paddingRight: '2.5rem' }}>
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

      {/* 成果照片 */}
      {request.photo && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ color: '#7e22ce', fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            📸 成果照片
          </div>
          <img
            src={request.photo}
            alt="任務成果"
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'cover',
              borderRadius: '0.75rem',
              border: '2px solid #d8b4fe'
            }}
          />
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

// 任務管理
function TaskManagement({ tasks, onCreateNew, onEditTask, onToggleTask }) {
  const [selectedMember, setSelectedMember] = useState('all') // all / 哥哥 / 妹妹

  const filteredTasks = selectedMember === 'all' 
    ? tasks 
    : tasks.filter(t => t.assignedTo === selectedMember || t.assignedTo === 'all')

  return (
    <div>
      {/* 發布新任務按鈕 */}
      <button
        onClick={onCreateNew}
        style={{
          width: '100%',
          background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
          color: 'white',
          fontWeight: '900',
          fontSize: '18px',
          padding: '1.25rem',
          borderRadius: '1rem',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 20px rgba(251, 191, 36, 0.4)'
        }}
      >
        ✨ 發布新任務
      </button>

      {/* 成員切換 */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        background: 'rgba(255, 255, 255, 0.7)',
        padding: '0.5rem',
        borderRadius: '0.75rem'
      }}>
        {['all', '哥哥', '妹妹'].map(member => (
          <button
            key={member}
            onClick={() => setSelectedMember(member)}
            style={{
              flex: 1,
              background: selectedMember === member
                ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
                : 'transparent',
              color: selectedMember === member ? 'white' : '#9333ea',
              fontWeight: 'bold',
              fontSize: '14px',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {member === 'all' ? '👨‍👩‍👧‍👦 全部' : member === '哥哥' ? '👦 哥哥' : '👧 妹妹'}
          </button>
        ))}
      </div>

      {/* 任務列表 */}
      {filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce', fontSize: '16px' }}>
          還沒有任務，點上方按鈕發布新任務
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEditTask}
              onToggle={onToggleTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 任務卡片（管理視圖）
function TaskCard({ task, onEdit, onToggle }) {
  const typeColors = {
    daily: { bg: '#fef3c7', color: '#f59e0b', label: '每日' },
    challenge: { bg: '#fce7f3', color: '#ec4899', label: '挑戰' },
    extra: { bg: '#ddd6fe', color: '#8b5cf6', label: '額外' }
  }

  const config = typeColors[task.type] || typeColors.daily

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
      border: '2px solid #e9d5ff',
      opacity: task.status === 'inactive' ? 0.5 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
        <div style={{ fontSize: '48px' }}>{task.icon}</div>
        <div style={{
          background: config.bg,
          color: config.color,
          padding: '0.25rem 0.75rem',
          borderRadius: '0.5rem',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {config.label}
        </div>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#581c87', marginBottom: '0.5rem' }}>
        {task.title}
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{
          background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '0.5rem',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {task.points} 💰
        </div>
        <div style={{ fontSize: '14px', color: '#7e22ce', fontWeight: '600' }}>
          {task.assignedTo === 'all' ? '👨‍👩‍👧‍👦 全家' : task.assignedTo === '哥哥' ? '👦 哥哥' : '👧 妹妹'}
        </div>
      </div>

      {task.current && task.target && (
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          fontSize: '14px',
          color: '#7e22ce',
          marginBottom: '0.75rem'
        }}>
          進度：{task.current}/{task.target} 天
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button 
          onClick={() => onEdit(task)}
          style={{
            flex: 1,
            background: 'rgba(168, 85, 247, 0.1)',
            color: '#7e22ce',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: '2px solid #d8b4fe',
            cursor: 'pointer'
          }}
        >
          ✏️ 編輯
        </button>
        <button 
          onClick={() => onToggle(task)}
          style={{
            background: task.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: task.status === 'active' ? '#ef4444' : '#10b981',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: task.status === 'active' ? '2px solid #fca5a5' : '2px solid #86efac',
            cursor: 'pointer'
          }}
        >
          {task.status === 'active' ? '❌ 停用' : '✅ 啟用'}
        </button>
      </div>
    </div>
  )
}

// 數據統計
function Statistics({ stats }) {
  const [period, setPeriod] = useState('week') // week / month

  // Mock 14天趨勢數據
  const trendData = period === 'week' ? [
    { day: '週一', brother: 4, sister: 3 },
    { day: '週二', brother: 5, sister: 4 },
    { day: '週三', brother: 3, sister: 5 },
    { day: '週四', brother: 4, sister: 4 },
    { day: '週五', brother: 5, sister: 3 },
    { day: '週六', brother: 6, sister: 6 },
    { day: '週日', brother: 4, sister: 5 }
  ] : [
    { day: '第1週', brother: 28, sister: 26 },
    { day: '第2週', brother: 30, sister: 28 },
    { day: '第3週', brother: 27, sister: 29 },
    { day: '第4週', brother: 29, sister: 27 }
  ]

  const maxValue = Math.max(...trendData.flatMap(d => [d.brother, d.sister]))

  return (
    <div>
      {/* 總覽卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>累積點數</div>
          <div style={{ fontSize: '36px', fontWeight: '900' }}>{stats.totalPoints}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>完成任務</div>
          <div style={{ fontSize: '36px', fontWeight: '900' }}>{stats.completedTasks}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>待審核</div>
          <div style={{ fontSize: '36px', fontWeight: '900' }}>{stats.pendingReviews}</div>
        </div>
      </div>

      {/* 孩子表現對比 */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#581c87',
          marginBottom: '1.5rem'
        }}>
          👦👧 孩子表現對比
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {stats.childStats.map(child => (
            <div
              key={child.name}
              style={{
                background: 'rgba(168, 85, 247, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '2px solid #e9d5ff'
              }}
            >
              <div style={{
                fontSize: '48px',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                {child.name === '哥哥' ? '👦' : '👧'}
              </div>
              <h4 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#581c87',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                {child.name}
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#9333ea', marginBottom: '0.25rem' }}>點數</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7e22ce' }}>{child.points}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#9333ea', marginBottom: '0.25rem' }}>完成</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7e22ce' }}>{child.completed}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#9333ea', marginBottom: '0.25rem' }}>達成率</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7e22ce' }}>{child.rate}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 趨勢圖表 */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#581c87'
          }}>
            📈 完成趨勢
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setPeriod('week')}
              style={{
                background: period === 'week' ? '#a78bfa' : '#e9d5ff',
                color: period === 'week' ? 'white' : '#7e22ce',
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              近7天
            </button>
            <button
              onClick={() => setPeriod('month')}
              style={{
                background: period === 'month' ? '#a78bfa' : '#e9d5ff',
                color: period === 'month' ? 'white' : '#7e22ce',
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              近30天
            </button>
          </div>
        </div>

        {/* 簡易長條圖 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {trendData.map(data => (
            <div key={data.day}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#7e22ce',
                marginBottom: '0.5rem'
              }}>
                {data.day}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ width: '50px', fontSize: '12px', color: '#9333ea' }}>👦 哥哥</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    height: '24px',
                    width: `${(data.brother / maxValue) * 100}%`,
                    background: 'linear-gradient(to right, #60a5fa, #3b82f6)',
                    borderRadius: '0.25rem',
                    minWidth: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '0.5rem',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {data.brother}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                <div style={{ width: '50px', fontSize: '12px', color: '#9333ea' }}>👧 妹妹</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    height: '24px',
                    width: `${(data.sister / maxValue) * 100}%`,
                    background: 'linear-gradient(to right, #f472b6, #ec4899)',
                    borderRadius: '0.25rem',
                    minWidth: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '0.5rem',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {data.sister}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 商店管理
function ShopManagement({ purchases, wishes, onDeliverPurchase, onApproveWish, onRejectWish }) {
  const [activeSubTab, setActiveSubTab] = useState('purchases') // purchases / wishes / ledger

  // 從 localStorage 獲取所有交易記錄
  const getAllTransactions = () => {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]')
    const purchaseData = JSON.parse(localStorage.getItem('purchases') || '[]')
    
    const transactions = []
    
    // 獲得點數（已核准的任務）
    submissions
      .filter(s => s.status === 'approved')
      .forEach(s => {
        transactions.push({
          id: `earn-${s.id}`,
          type: 'earn',
          amount: s.points || 10,
          description: s.taskTitle || '完成任務',
          userName: s.userName,
          timestamp: s.approvedAt || s.timestamp
        })
      })
    
    // 消費點數（兌換商品）
    purchaseData.forEach(p => {
      transactions.push({
        id: `spend-${p.id}`,
        type: 'spend',
        amount: p.price,
        description: p.productName,
        userName: p.userName,
        timestamp: p.createdAt
      })
    })
    
    return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  return (
    <div>
      {/* 子分頁 */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        background: 'rgba(255, 255, 255, 0.5)',
        padding: '0.5rem',
        borderRadius: '0.75rem'
      }}>
        <button
          onClick={() => setActiveSubTab('purchases')}
          style={{
            flex: 1,
            background: activeSubTab === 'purchases'
              ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
              : 'transparent',
            color: activeSubTab === 'purchases' ? 'white' : '#9333ea',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          📦 待發放 ({purchases.length})
        </button>
        <button
          onClick={() => setActiveSubTab('wishes')}
          style={{
            flex: 1,
            background: activeSubTab === 'wishes'
              ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
              : 'transparent',
            color: activeSubTab === 'wishes' ? 'white' : '#9333ea',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ✨ 許願清單 ({wishes.length})
        </button>
        <button
          onClick={() => setActiveSubTab('ledger')}
          style={{
            flex: 1,
            background: activeSubTab === 'ledger'
              ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
              : 'transparent',
            color: activeSubTab === 'ledger' ? 'white' : '#9333ea',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          💰 金庫帳本
        </button>
      </div>

      {/* 待發放商品 */}
      {activeSubTab === 'purchases' && (
        <div>
          {purchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
              目前沒有待發放商品
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {purchases.map(purchase => (
                <PurchaseCard
                  key={purchase.id}
                  purchase={purchase}
                  onDeliver={onDeliverPurchase}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 許願清單 */}
      {activeSubTab === 'wishes' && (
        <div>
          {wishes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
              目前沒有許願
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {wishes.map(wish => (
                <WishCard
                  key={wish.id}
                  wish={wish}
                  onApprove={onApproveWish}
                  onReject={onRejectWish}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 金庫帳本 */}
      {activeSubTab === 'ledger' && (
        <FinanceLedger transactions={getAllTransactions()} />
      )}
    </div>
  )
}

// 待發放商品卡片
function PurchaseCard({ purchase, onDeliver }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '1.5rem',
      border: '2px solid #e9d5ff',
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '48px' }}>{purchase.icon}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#581c87', marginBottom: '0.25rem' }}>
            {purchase.productName}
          </h3>
          <div style={{ fontSize: '14px', color: '#7e22ce' }}>
            👤 {purchase.userName} | 💰 {purchase.price} 點
          </div>
          <div style={{ fontSize: '12px', color: '#9333ea', marginTop: '0.25rem' }}>
            兌換時間：{new Date(purchase.createdAt).toLocaleString('zh-TW')}
          </div>
        </div>
      </div>

      <button
        onClick={() => onDeliver(purchase)}
        style={{
          width: '100%',
          background: 'linear-gradient(to right, #10b981, #059669)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          padding: '0.75rem',
          borderRadius: '0.75rem',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
        }}
      >
        ✅ 標記為已發放
      </button>
    </div>
  )
}

// 許願卡片
function WishCard({ wish, onApprove, onReject }) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '1.5rem',
      border: '2px solid #fce7f3',
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '24px' }}>✨</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#881337' }}>
            {wish.name}
          </h3>
        </div>
        <div style={{ fontSize: '14px', color: '#be185d', marginBottom: '0.5rem' }}>
          👤 {wish.userName} | 💰 {wish.price} 點
        </div>
        {wish.description && (
          <div style={{
            background: 'rgba(236, 72, 153, 0.1)',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '14px',
            color: '#9d174d',
            marginBottom: '0.5rem'
          }}>
            {wish.description}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#db2777' }}>
          許願時間：{new Date(wish.createdAt).toLocaleString('zh-TW')}
        </div>
      </div>

      {!showRejectForm ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onApprove(wish)}
            style={{
              flex: 1,
              background: 'linear-gradient(to right, #10b981, #059669)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer'
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
              fontWeight: 'bold',
              fontSize: '14px',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer'
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
            rows={2}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '2px solid #fda4af',
              fontSize: '14px',
              marginBottom: '0.5rem',
              resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowRejectForm(false)}
              style={{
                flex: 1,
                background: '#e9d5ff',
                color: '#7e22ce',
                fontWeight: 'bold',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              取消
            </button>
            <button
              onClick={() => onReject(wish, rejectReason)}
              disabled={!rejectReason}
              style={{
                flex: 1,
                background: rejectReason ? 'linear-gradient(to right, #f87171, #ef4444)' : '#d1d5db',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: rejectReason ? 'pointer' : 'not-allowed',
                fontSize: '14px'
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

// 金庫帳本
function FinanceLedger({ transactions }) {
  const [filter, setFilter] = useState('all') // all / earn / spend
  const [sortBy, setSortBy] = useState('date') // date / amount

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true
    return t.type === filter
  })

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.timestamp) - new Date(a.timestamp)
    } else {
      return b.amount - a.amount
    }
  })

  // 計算統計
  const totalEarned = transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0)
  const totalSpent = transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalEarned - totalSpent

  const handleExportCSV = () => {
    const headers = ['日期', '類型', '金額', '說明', '成員']
    const rows = sortedTransactions.map(t => [
      new Date(t.timestamp).toLocaleString('zh-TW'),
      t.type === 'earn' ? '獲得' : '消費',
      t.type === 'earn' ? `+${t.amount}` : `-${t.amount}`,
      t.description,
      t.userName
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `金庫帳本_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div>
      {/* 總覽卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>總獲得</div>
          <div style={{ fontSize: '32px', fontWeight: '900' }}>+{totalEarned}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>總消費</div>
          <div style={{ fontSize: '32px', fontWeight: '900' }}>-{totalSpent}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>淨結餘</div>
          <div style={{ fontSize: '32px', fontWeight: '900' }}>{balance}</div>
        </div>
      </div>

      {/* 篩選器和匯出 */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
          {[
            { value: 'all', label: '全部', icon: '📝' },
            { value: 'earn', label: '獲得', icon: '💰' },
            { value: 'spend', label: '消費', icon: '🛒' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              style={{
                background: filter === option.value ? '#a78bfa' : '#e9d5ff',
                color: filter === option.value ? 'white' : '#7e22ce',
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            background: 'linear-gradient(to right, #10b981, #059669)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.5rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}
        >
          📊 匯出 CSV
        </button>
      </div>

      {/* 交易列表 */}
      {sortedTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
          目前沒有交易記錄
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1rem',
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
        }}>
          {sortedTransactions.map(transaction => (
            <div
              key={transaction.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid #e9d5ff'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: transaction.type === 'earn'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '1rem'
              }}>
                {transaction.type === 'earn' ? '💰' : '🛒'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#581c87',
                  marginBottom: '0.25rem'
                }}>
                  {transaction.description}
                </div>
                <div style={{ fontSize: '14px', color: '#9333ea' }}>
                  {transaction.userName} • {new Date(transaction.timestamp).toLocaleString('zh-TW')}
                </div>
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '900',
                color: transaction.type === 'earn' ? '#10b981' : '#ef4444'
              }}>
                {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 創建/編輯任務表單
function TaskForm({ task, onSubmit, onClose }) {
  const [formData, setFormData] = useState(task || {
    title: '',
    icon: '⭐',
    points: '',
    type: 'daily',
    assignedTo: 'all',
    target: '',
    description: ''
  })

  const icons = ['⭐', '🛏️', '📚', '🍽️', '🧹', '🚿', '🎨', '🎵', '⚽', '🌈']
  const types = [
    { value: 'daily', label: '每日例行', icon: '📅' },
    { value: 'extra', label: '單次任務', icon: '⚡' },
    { value: 'challenge', label: '長期挑戰', icon: '🏆' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.points) {
      alert('請填寫完整資訊')
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
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#581c87',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          {task ? '✏️ 編輯任務' : '✨ 發布新任務'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* 任務圖示 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              任務圖示
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.5rem'
            }}>
              {icons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  style={{
                    fontSize: '32px',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: formData.icon === icon ? '3px solid #a78bfa' : '2px solid #e9d5ff',
                    background: formData.icon === icon ? 'rgba(167, 139, 250, 0.1)' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 任務名稱 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              任務名稱
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例：整理床鋪"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #d8b4fe',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 任務類型 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              任務類型
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {types.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  style={{
                    background: formData.type === type.value
                      ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
                      : 'white',
                    color: formData.type === type.value ? 'white' : '#9333ea',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #d8b4fe',
                    cursor: 'pointer'
                  }}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* 獎勵點數 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              獎勵點數
            </label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              placeholder="例：10"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #d8b4fe',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 分配對象 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              分配給
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { value: 'all', label: '👨‍👩‍👧‍👦 全部' },
                { value: '哥哥', label: '👦 哥哥' },
                { value: '妹妹', label: '👧 妹妹' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, assignedTo: option.value })}
                  style={{
                    background: formData.assignedTo === option.value
                      ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                      : 'white',
                    color: formData.assignedTo === option.value ? 'white' : '#f59e0b',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #fcd34d',
                    cursor: 'pointer'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 長期挑戰目標天數 */}
          {formData.type === 'challenge' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#7e22ce',
                marginBottom: '0.5rem'
              }}>
                挑戰天數
              </label>
              <input
                type="number"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                placeholder="例：21（天）"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: '2px solid #d8b4fe',
                  fontSize: '16px'
                }}
              />
            </div>
          )}

          {/* 按鈕 */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: '#e9d5ff',
                color: '#7e22ce',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '1rem',
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
                fontSize: '16px',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)'
              }}
            >
              {task ? '✅ 儲存變更' : '✨ 發布任務'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
