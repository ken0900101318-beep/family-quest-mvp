import { useState, useEffect } from 'react'
import { mockAPI, mockData } from '../lib/supabase'
import { AnnouncementManager } from '../components/Announcements'
import { useToast } from '../components/Toast'

export default function ParentHub({ user, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('pending') // pending, tasks, stats, shop, users
  const [shopTab, setShopTab] = useState('pending') // pending, history, products, wishes
  const [pendingRequests, setPendingRequests] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [stats, setStats] = useState({})
  const [purchases, setPurchases] = useState([])
  const [deliveredPurchases, setDeliveredPurchases] = useState([])
  const [wishes, setWishes] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  
  // 用戶管理
  const [allUsers, setAllUsers] = useState([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  
  const { showToast, ToastContainer } = useToast()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    loadData(true) // 首次載入，顯示 loading
    
    // 每30秒自動刷新（背景靜默更新）
    const interval = setInterval(() => {
      loadData(false) // 背景更新，不顯示 loading
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadData = async (showLoadingState = true) => {
    // 只有首次載入才顯示 loading
    if (showLoadingState && isInitialLoad) {
      setLoading(true)
    }
    
    try {
    
    // 從 Supabase 讀取待審核任務
    // 並行載入（更快！）
        const [pendingSubmissions, allWishes, users] = await Promise.all([
          mockAPI.getPendingSubmissions(),
          mockAPI.getWishes(),
          mockAPI.getAllUsers()
        ])
    
    // 轉換格式以匹配 UI
      const formattedRequests = pendingSubmissions.map(sub => ({
        id: sub.id,
        childId: sub.userId,
        childName: sub.userName,
        title: sub.taskTitle,
        points: sub.points,
        description: '',
        status: 'submitted',
        submittedAt: new Date(sub.timestamp).toLocaleString('zh-TW'),
        type: 'taskSubmit',
        photo: sub.photo,
        taskId: sub.taskId
      }))
    
      console.log('🔍 待審核 Debug:', {
        原始數量: pendingSubmissions.length,
        第一筆原始: pendingSubmissions[0],
        第一筆轉換: formattedRequests[0]
      })
      
      setPendingRequests(formattedRequests)
    
      // 從 Supabase 載入所有任務
      const allTasksData = await mockAPI.getAllTasks()
      setAllTasks(allTasksData)
    
    // 從 localStorage 計算真實統計數據
    // 統計數據（暫時簡化，之後可以從 Supabase 計算）
      setStats({
        totalPoints: 0,
        completedTasks: 0,
        pendingReviews: formattedRequests.length,
        childStats: []
      })
    
    // 讀取待發放的購買記錄（所有兒童）
      const allPurchases = await mockAPI.getPurchases()
      setPurchases(allPurchases)
      
      // 讀取已發放的購買記錄
      const deliveredList = await mockAPI.getDeliveredPurchases()
      setDeliveredPurchases(deliveredList)
      
      // 讀取所有交易記錄
      const allTransactions = await mockAPI.getTransactions()
      setTransactions(allTransactions)
    
    // 讀取待審核的許願清單
    // allWishes 已在上方並行載入
      const pendingWishes = allWishes.filter(w => w.status === 'pending')
      setWishes(pendingWishes)
    
    // 讀取所有任務
      const tasks = await mockAPI.getAllTasks()
      setAllTasks(tasks)
      
      // 設定用戶列表
      setAllUsers(users)
    
    } catch (error) {
      console.error('載入失敗:', error)
      setPendingRequests([])
    } finally {
      if (showLoadingState && isInitialLoad) {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }
  }

  const handleApprove = async (request, adjustedPoints) => {
    try {
      await mockAPI.approveSubmission(request.id, adjustedPoints)
      // 從待審核列表中移除
      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
      showToast(`已核准「${request.title}」 (${adjustedPoints || request.points} 點)`, 'success')
    } catch (err) {
      showToast('核准失敗，請稍後再試', 'error')
    }
  }

  const handleReject = async (request, reason) => {
    try {
      await mockAPI.rejectSubmission(request.id, reason)
      // 從待審核列表中移除
      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
      showToast(`已拒絕「${request.title}」`, 'error')
    } catch (err) {
      showToast('拒絕失敗，請稍後再試', 'error')
    }
  }

  const handleCreateTask = async (taskData) => {
    // 立即顯示處理中提示
    showToast('⏳ 處理中，請稍候...', 'info')
    
    // 用戶 UUID
    const brotherUUID = '00000000-0000-0000-0000-000000000012'
    const sisterUUID = '00000000-0000-0000-0000-000000000013'
    
    const dataToSave = editingTask 
      ? { ...editingTask, ...taskData }
      : { 
          ...taskData, 
          status: 'active', 
          assignee: taskData.assignedTo === 'all' 
            ? [brotherUUID, sisterUUID] 
            : taskData.assignedTo === '哥哥' 
              ? [brotherUUID] 
              : [sisterUUID]
        }
    
    try {
      const updatedTasks = await mockAPI.saveTask(dataToSave)
      setAllTasks(updatedTasks)
      
      showToast(editingTask ? '✅ 任務已更新！' : '✅ 任務已創建！', 'success')
      setShowTaskForm(false)
      setEditingTask(null)
    } catch (error) {
      showToast('❌ 操作失敗，請重試', 'error')
      console.error('Create task error:', error)
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'active' ? 'inactive' : 'active'
    const updatedTask = { ...task, status: newStatus }
    const updatedTasks = await mockAPI.saveTask(updatedTask)
    setAllTasks(updatedTasks)
    showToast(`任務已${newStatus === 'active' ? '啟用' : '停用'}`, 'success')
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await mockAPI.deleteTask(taskId)
      setAllTasks(prev => prev.filter(t => t.id !== taskId))
      showToast('✅ 任務已刪除', 'success')
    } catch (error) {
      showToast('❌ 刪除失敗', 'error')
      console.error('Delete task error:', error)
    }
  }

  const handleDeliverPurchase = async (purchase) => {
    try {
      await mockAPI.deliverPurchase(purchase.id, user.id)
      setPurchases(prev => prev.filter(p => p.id !== purchase.id))
      showToast(`已標記「${purchase.productName}」為已發放`, 'success')
      loadData()
    } catch (error) {
      showToast('操作失敗', 'error')
      console.error(error)
    }
  }

  const handleApproveWish = async (wish) => {
    try {
      await mockAPI.approveWish(wish.id)
      setWishes(prev => prev.filter(w => w.id !== wish.id))
      showToast(`已核准許願「${wish.product_name}」`, 'success')
      loadData()
    } catch (error) {
      showToast('操作失敗', 'error')
      console.error(error)
    }
  }

  const handleRejectWish = async (wish, reason) => {
    if (!reason) {
      showToast('請輸入拒絕原因', 'warning')
      return
    }
    try {
      await mockAPI.rejectWish(wish.id, reason)
      setWishes(prev => prev.filter(w => w.id !== wish.id))
      showToast(`已拒絕許願「${wish.product_name}」`, 'error')
      loadData()
    } catch (error) {
      showToast('操作失敗', 'error')
      console.error(error)
    }
  }

  // 用戶管理處理函數
  const handleSaveUser = async (userData) => {
    showToast('⏳ 處理中，請稍候...', 'info')
    
    try {
      if (editingUser) {
        await mockAPI.updateUser(editingUser.id, userData)
      } else {
        await mockAPI.createUser(userData)
      }
      
      const users = await mockAPI.getAllUsers()
      setAllUsers(users)
      
      showToast(editingUser ? '✅ 用戶已更新！' : '✅ 用戶已創建！', 'success')
      setShowUserForm(false)
      setEditingUser(null)
    } catch (error) {
      showToast(`❌ ${error.message || '操作失敗，請重試'}`, 'error')
      console.error('Save user error:', error)
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setShowUserForm(true)
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('確定要刪除此用戶嗎？刪除後將無法恢復。')) {
      return
    }
    
    try {
      await mockAPI.deleteUser(userId)
      const users = await mockAPI.getAllUsers()
      setAllUsers(users)
      showToast('✅ 用戶已刪除', 'success')
    } catch (error) {
      showToast('❌ 刪除失敗，請重試', 'error')
      console.error('Delete user error:', error)
    }
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
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            icon="👥"
            label="用戶管理"
          />
          <TabButton
            active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
            icon="📊"
            label="數據統計"
          />
          <TabButton
            active={activeTab === 'announcements'}
            onClick={() => setActiveTab('announcements')}
            icon="📢"
            label="公告管理"
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
                onDeleteTask={handleDeleteTask}
              />
            )}
            {activeTab === 'shop' && (
              <ShopManagement
                shopTab={shopTab}
                setShopTab={setShopTab}
                purchases={purchases}
                deliveredPurchases={deliveredPurchases}
                wishes={wishes}
                transactions={transactions}
                onDeliverPurchase={handleDeliverPurchase}
                onApproveWish={handleApproveWish}
                onRejectWish={handleRejectWish}
                showToast={showToast}
              />
            )}
            {activeTab === 'stats' && (
              <Statistics stats={stats} />
            )}

            {activeTab === 'users' && (
              <UserManagement 
                users={allUsers}
                onAdd={() => { setEditingUser(null); setShowUserForm(true); }}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            )}

            {activeTab === 'announcements' && (
              <AnnouncementManager userId={user.id} />
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

        {/* 創建/編輯用戶表單 */}
        {showUserForm && (
          <UserForm
            user={editingUser}
            onSubmit={handleSaveUser}
            onClose={() => { setShowUserForm(false); setEditingUser(null); }}
          />
        )}

        {/* Toast 通知 */}
        <ToastContainer />
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
      showToast('請先選擇要批次核准的項目', 'warning')
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
      showToast(`已批次核准 ${selectedIds.length} 個項目`, 'success')
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
function TaskManagement({ tasks, onCreateNew, onEditTask, onToggleTask, onDeleteTask }) {
  const [selectedMember, setSelectedMember] = useState('all') // all / 哥哥 / 妹妹
  const [filterCategory, setFilterCategory] = useState('all') // all / daily / challenge / longterm

  // 雙重過濾：成員 + 類別
  let filteredTasks = tasks
  
  // 成員過濾
  if (selectedMember !== 'all') {
    filteredTasks = filteredTasks.filter(t => {
      // 如果任務有 assignedUsers 陣列
      if (t.assignedUsers && t.assignedUsers.length > 0) {
        return t.assignedUsers.some(user => user.name === selectedMember)
      }
      // 舊資料相容：如果有 assignedTo 欄位
      if (t.assignedTo) {
        return t.assignedTo === selectedMember || t.assignedTo === 'all'
      }
      return false
    })
  }
  
  // 類別過濾
  if (filterCategory !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.type === filterCategory)
  }

  // 統計數據
  // 注意：daily 要包含所有顯示為黃色卡片的任務（daily + longterm）
  const stats = {
    total: filteredTasks.length,
    active: filteredTasks.filter(t => t.status === 'active').length,
    daily: filteredTasks.filter(t => 
      (t.type === 'daily' || t.type === 'longterm') && t.status === 'active'
    ).length,
    challenge: filteredTasks.filter(t => t.type === 'challenge' && t.status === 'active').length
  }

  return (
    <div>
      {/* 頂部快速過濾器 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* 總任務 - 點擊顯示全部 */}
        <div 
          onClick={() => setFilterCategory(filterCategory === 'all' ? 'all' : 'all')}
          style={{
            background: filterCategory === 'all' ? '#fef3c7' : 'white',
            border: filterCategory === 'all' ? '3px solid #fbbf24' : '2px solid #fbbf24',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: filterCategory === 'all' ? '0 4px 12px rgba(251,191,36,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: filterCategory === 'all' ? 'translateY(-2px)' : 'none'
          }}
          onMouseOver={(e) => { if (filterCategory !== 'all') e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseOut={(e) => { if (filterCategory !== 'all') e.currentTarget.style.transform = 'scale(1)' }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
            總任務數
          </div>
        </div>

        {/* 啟用中 - 點擊顯示全部 */}
        <div 
          onClick={() => setFilterCategory('all')}
          style={{
            background: 'white',
            border: '2px solid #10b981',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {stats.active}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
            啟用中
          </div>
        </div>

        {/* 每日任務 - 點擊過濾 */}
        <div 
          onClick={() => setFilterCategory(filterCategory === 'daily' ? 'all' : 'daily')}
          style={{
            background: filterCategory === 'daily' ? '#dbeafe' : 'white',
            border: filterCategory === 'daily' ? '3px solid #3b82f6' : '2px solid #3b82f6',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: filterCategory === 'daily' ? '0 4px 12px rgba(59,130,246,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: filterCategory === 'daily' ? 'translateY(-2px)' : 'none'
          }}
          onMouseOver={(e) => { if (filterCategory !== 'daily') e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseOut={(e) => { if (filterCategory !== 'daily') e.currentTarget.style.transform = 'scale(1)' }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {stats.daily}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
            每日任務
          </div>
        </div>

        {/* 挑戰任務 - 點擊過濾 */}
        <div 
          onClick={() => setFilterCategory(filterCategory === 'challenge' ? 'all' : 'challenge')}
          style={{
            background: filterCategory === 'challenge' ? '#fce7f3' : 'white',
            border: filterCategory === 'challenge' ? '3px solid #ec4899' : '2px solid #ec4899',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: filterCategory === 'challenge' ? '0 4px 12px rgba(236,72,153,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: filterCategory === 'challenge' ? 'translateY(-2px)' : 'none'
          }}
          onMouseOver={(e) => { if (filterCategory !== 'challenge') e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseOut={(e) => { if (filterCategory !== 'challenge') e.currentTarget.style.transform = 'scale(1)' }}
        >
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec4899' }}>
            {stats.challenge}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
            挑戰任務
          </div>
        </div>
      </div>

      {/* 發布新任務按鈕 */}
      <button
        onClick={onCreateNew}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
          color: 'white',
          fontWeight: '900',
          fontSize: '18px',
          padding: '1.25rem',
          borderRadius: '1.25rem',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}
      >
        <span style={{ fontSize: '24px' }}>✨</span>
        <span>發布新任務</span>
      </button>

      {/* 成員切換 */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '0.75rem',
        borderRadius: '1rem',
        border: '2px solid #e9d5ff',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
      }}>
        {['all', '哥哥', '妹妹'].map(member => (
          <button
            key={member}
            onClick={() => setSelectedMember(member)}
            style={{
              flex: 1,
              background: selectedMember === member
                ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
                : 'white',
              color: selectedMember === member ? 'white' : '#7e22ce',
              fontWeight: 'bold',
              fontSize: '15px',
              padding: '0.875rem',
              borderRadius: '0.75rem',
              border: selectedMember === member ? 'none' : '2px solid #e9d5ff',
              cursor: 'pointer',
              boxShadow: selectedMember === member ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {member === 'all' ? '👨‍👩‍👧‍👦 全部成員' : member === '哥哥' ? '👦 哥哥' : '👧 妹妹'}
          </button>
        ))}
      </div>

      {/* 任務列表 */}
      {filteredTasks.length === 0 ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1.5rem',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '2px dashed #d8b4fe'
        }}>
          <div style={{ fontSize: '72px', marginBottom: '1rem' }}>
            {tasks.length === 0 ? '📋' : 
             selectedMember !== 'all' ? '👤' :
             filterCategory === 'daily' ? '📅' : 
             filterCategory === 'challenge' ? '🏆' : 
             filterCategory === 'longterm' ? '🎯' : '📋'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem' }}>
            {tasks.length === 0 ? '還沒有任務' :
             selectedMember !== 'all' ? `${selectedMember}目前沒有專屬任務` :
             filterCategory === 'daily' ? '目前沒有每日任務' : 
             filterCategory === 'challenge' ? '目前沒有挑戰任務' :
             filterCategory === 'longterm' ? '目前沒有長期任務' : '沒有符合條件的任務'}
          </div>
          <div style={{ fontSize: '14px', color: '#9333ea' }}>
            {tasks.length === 0 ? '點上方按鈕發布第一個任務吧！' :
             selectedMember !== 'all' ? '可以為此成員新增專屬任務！' :
             '要不要新增一個？點上方按鈕發布！'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEditTask}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 任務卡片（管理視圖 - 緊湊版）
function TaskCard({ task, onEdit, onToggle, onDelete }) {
  const typeConfig = {
    daily: { sideColor: '#10b981', emoji: '📅', label: '每日例行' },
    challenge: { sideColor: '#f59e0b', emoji: '🏆', label: '長期挑戰' },
    extra: { sideColor: '#8b5cf6', emoji: '⚡', label: '單次任務' }
  }

  const config = typeConfig[task.type] || typeConfig.daily
  const isInactive = task.status === 'inactive'

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid #e5e7eb',
      borderLeft: `4px solid ${isInactive ? '#9ca3af' : config.sideColor}`,
      borderRadius: '0.5rem',
      padding: '1rem',
      opacity: isInactive ? 0.5 : 1,
      transition: 'all 0.2s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* 第一行：圖示 + 標題 + 操作按鈕 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
        {/* 左側：圖示 + 標題 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '28px', flexShrink: 0 }}>{task.icon}</span>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '700', 
            color: '#111827',
            margin: 0,
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap'
          }}>
            {task.title}
          </h3>
        </div>

        {/* 右側：操作按鈕組 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          <button
            onClick={() => onEdit(task)}
            style={{
              background: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.target.style.background = '#e5e7eb'; e.target.style.color = '#374151' }}
            onMouseOut={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.color = '#6b7280' }}
          >
            ✏️
          </button>

          <button
            onClick={() => onToggle(task)}
            style={{
              background: isInactive ? '#d1fae5' : '#fee2e2',
              color: isInactive ? '#059669' : '#dc2626',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.target.style.opacity = '0.8' }}
            onMouseOut={(e) => { e.target.style.opacity = '1' }}
          >
            {isInactive ? '✅' : '🔒'}
          </button>

          <button
            onClick={() => {
              if (confirm(`確定要永久刪除「${task.title}」嗎？此操作無法復原！`)) {
                onDelete(task.id)
              }
            }}
            style={{
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.target.style.background = '#fecaca'; e.target.style.color = '#b91c1c' }}
            onMouseOut={(e) => { e.target.style.background = '#fee2e2'; e.target.style.color = '#dc2626' }}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* 第二行：點數 + 類型標籤 + 指派對象 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        fontSize: '13px',
        color: '#6b7280',
        paddingLeft: '2.25rem' // 對齊第一行文字（圖示寬度 + gap）
      }}>
        <span style={{ fontWeight: '600', color: '#f59e0b' }}>
          {task.points} 💰
        </span>
        <span style={{ color: '#d1d5db' }}>·</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>{config.emoji}</span>
          <span>{config.label}</span>
        </span>
        
        {/* 指派對象標籤 */}
        {task.assignedUsers && task.assignedUsers.length > 0 && (
          <>
            <span style={{ color: '#d1d5db' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
              {task.assignedUsers.map((user, idx) => (
                <span 
                  key={idx}
                  style={{
                    background: '#f3f4f6',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#4b5563',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>{user.avatar || '👤'}</span>
                  <span>{user.name}</span>
                </span>
              ))}
            </div>
          </>
        )}
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
                padding: '1rem',
                border: '2px solid #e9d5ff'
              }}
            >
              <div style={{
                fontSize: '36px',
                textAlign: 'center',
                marginBottom: '0.5rem'
              }}>
                {child.name === '哥哥' ? '👦' : '👧'}
              </div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#581c87',
                textAlign: 'center',
                marginBottom: '0.875rem'
              }}>
                {child.name}
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9333ea', marginBottom: '0.25rem' }}>點數</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7e22ce' }}>{child.points}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9333ea', marginBottom: '0.25rem' }}>完成</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7e22ce' }}>{child.completed}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9333ea', marginBottom: '0.25rem' }}>達成率</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7e22ce' }}>{child.rate}%</div>
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
function ShopManagement({ shopTab, setShopTab, purchases, deliveredPurchases, wishes, transactions, onDeliverPurchase, onApproveWish, onRejectWish, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState(shopTab || 'purchases') // purchases / history / wishes / ledger / products
  const [products, setProducts] = useState([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (activeSubTab === 'products') {
      loadProducts()
    }
  }, [activeSubTab])
  
  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await mockAPI.getProducts(true) // true = 包含停用商品
      console.log('📦 載入商品:', data)
      setProducts(data)
    } catch (error) {
      console.error('載入商品失敗:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        // 更新商品
        await mockAPI.updateProduct(editingProduct.id, productData)
        showToast('商品已更新', 'success')
      } else {
        // 新增商品
        await mockAPI.addProduct(
          productData.name,
          productData.price,
          productData.icon,
          productData.stock
        )
        showToast('商品已新增', 'success')
      }
      setShowProductForm(false)
      setEditingProduct(null)
      loadProducts()
    } catch (error) {
      showToast('操作失敗', 'error')
      console.error('Save product error:', error)
    }
  }
  
  const handleToggleProductStatus = async (productId, currentStatus) => {
    try {
      const newStatus = await mockAPI.toggleProductStatus(productId)
      showToast(`商品已${newStatus === 'inactive' ? '停用' : '啟用'}`, 'success')
      loadProducts()
    } catch (error) {
      showToast('操作失敗', 'error')
      console.error('Toggle product status error:', error)
    }
  }

  const handleDeleteProduct = async (productId) => {
    try {
      await mockAPI.deleteProduct(productId)
      showToast('✅ 商品已刪除', 'success')
      loadProducts()
    } catch (error) {
      showToast('❌ 刪除失敗', 'error')
      console.error('Delete product error:', error)
    }
  }

  // 從 localStorage 獲取所有交易記錄


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
          onClick={() => setActiveSubTab('history')}
          style={{
            flex: 1,
            background: activeSubTab === 'history'
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'transparent',
            color: activeSubTab === 'history' ? 'white' : '#10b981',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ✅ 發放記錄 ({deliveredPurchases.length})
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
          onClick={() => setActiveSubTab('products')}
          style={{
            flex: 1,
            background: activeSubTab === 'products'
              ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
              : 'transparent',
            color: activeSubTab === 'products' ? 'white' : '#9333ea',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          🎁 商品管理
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

      {/* 發放記錄 */}
      {activeSubTab === 'history' && (
        <div>
          {deliveredPurchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
              目前沒有發放記錄
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {deliveredPurchases.map(purchase => (
                <div
                  key={purchase.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '2px solid #d1fae5',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '36px' }}>{purchase.productIcon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
                        {purchase.userName} {purchase.userAvatar}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#581c87' }}>
                        {purchase.productName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#7e22ce', marginTop: '0.25rem' }}>
                        數量：{purchase.quantity} | 花費：{purchase.totalPrice} 點
                      </div>
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '0.5rem' }}>
                        ✅ 已發放 · {new Date(purchase.createdAt).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  </div>
                </div>
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

      {/* 商品管理 */}
      {activeSubTab === 'products' && (
        <div>
          {/* 新增商品按鈕 */}
          <button
            onClick={() => {
              setEditingProduct(null)
              setShowProductForm(true)
            }}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #a78bfa, #8b5cf6)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
              padding: '1.25rem',
              borderRadius: '1rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
              marginBottom: '1.5rem'
            }}
          >
            ➕ 新增商品
          </button>

          {/* 商品列表 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
              載入中...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
              還沒有商品，點擊上方按鈕新增
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={(p) => {
                    setEditingProduct(p)
                    setShowProductForm(true)
                  }}
                  onToggleStatus={handleToggleProductStatus}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}

          {/* 商品表單 Modal */}
          {showProductForm && (
            <ProductFormModal
              product={editingProduct}
              onSubmit={handleSaveProduct}
              onClose={() => {
                setShowProductForm(false)
                setEditingProduct(null)
              }}
            />
          )}
        </div>
      )}

      {/* 金庫帳本 */}
      {activeSubTab === 'ledger' && (
        <FinanceLedger transactions={transactions} />
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
          <span style={{ fontSize: '24px' }}>🎁</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#881337' }}>
            {wish.product_name}
          </h3>
        </div>
        <div style={{ fontSize: '14px', color: '#be185d', marginBottom: '0.5rem' }}>
          👤 {wish.user_name || '未知用戶'}
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
            許願原因：{wish.description}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#db2777' }}>
          許願時間：{wish.created_at ? new Date(wish.created_at).toLocaleString('zh-TW') : '未知時間'}
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
    points: 10,
    type: 'daily',
    assignedTo: 'all',
    target: null,
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const icons = ['⭐', '🛏️', '📚', '🍽️', '🧹', '🚿', '🎨', '🎵', '⚽', '🌈']
  const types = [
    { value: 'daily', label: '每日例行', icon: '📅' },
    { value: 'extra', label: '單次任務', icon: '⚡' },
    { value: 'challenge', label: '長期挑戰', icon: '🏆' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (submitting) return // 防止重複提交
    
    if (!formData.title || !formData.points || formData.points <= 0) {
      alert('請填寫完整資訊並確保點數大於 0')
      return
    }
    
    // 如果類型是挑戰，必須填寫目標天數
    if (formData.type === 'challenge' && (!formData.target || formData.target <= 0)) {
      alert('挑戰任務必須設定目標天數')
      return
    }
    
    setSubmitting(true)
    try {
      // 確保數字欄位是整數（不是空字串）
      const cleanedData = {
        ...formData,
        points: parseInt(formData.points) || 0,
        target: formData.target ? parseInt(formData.target) : null
      }
      await onSubmit(cleanedData)
    } finally {
      setSubmitting(false)
    }
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
              gap: '0.5rem',
              justifyContent: 'center'
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
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || '' })}
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
                onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || '' })}
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
              disabled={submitting}
              style={{
                flex: 1,
                background: submitting 
                  ? '#d1d5db' 
                  : 'linear-gradient(to right, #fbbf24, #f59e0b)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)',
                opacity: submitting ? 0.6 : 1
              }}
            >
              {submitting ? '⏳ 處理中...' : (task ? '✅ 儲存變更' : '✨ 發布任務')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
// 商品管理相關組件
export function ProductCard({ product, onEdit, onToggleStatus, onDelete }) {
  const isActive = product.status === 'active'
  
  return (
    <div style={{
      background: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(200, 200, 200, 0.5)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '1.5rem',
      border: `2px solid ${isActive ? '#e9d5ff' : '#d1d5db'}`,
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
      opacity: isActive ? 1 : 0.7
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '48px' }}>{product.icon || '🎁'}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#581c87', marginBottom: '0.25rem' }}>
            {product.name}
          </h3>
          <div style={{ fontSize: '16px', color: '#7e22ce', fontWeight: 'bold' }}>
            💰 {product.price} 點
          </div>
          {product.stock !== undefined && (
            <div style={{ fontSize: '12px', color: '#9333ea', marginTop: '0.25rem' }}>
              庫存：{product.stock === 999 ? '無限' : `${product.stock} 個`}
            </div>
          )}
          {!isActive && (
            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '0.25rem', fontWeight: 'bold' }}>
              ⚠️ 已停用
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onEdit(product)}
          style={{
            flex: 1,
            background: 'linear-gradient(to right, #3b82f6, #2563eb)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ✏️ 編輯
        </button>
        <button
          onClick={() => onToggleStatus(product.id, product.status)}
          style={{
            flex: 1,
            background: isActive 
              ? 'linear-gradient(to right, #f59e0b, #d97706)'
              : 'linear-gradient(to right, #10b981, #059669)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {isActive ? '🔒 停用' : '✅ 啟用'}
        </button>
        <button
          onClick={() => {
            if (confirm(`確定要刪除「${product.name}」嗎？此操作無法復原！`)) {
              onDelete(product.id)
            }
          }}
          style={{
            flex: 1,
            background: 'linear-gradient(to right, #dc2626, #b91c1c)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          🗑️ 刪除
        </button>
      </div>
    </div>
  )
}

// 商品表單 Modal
export function ProductFormModal({ product, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    icon: product?.icon || '🎁',
    price: product?.price || 0,
    stock: product?.stock || 999
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || formData.price <= 0) {
      alert('請填寫完整資訊')
      return
    }
    onSubmit(formData)
  }

  const iconOptions = ['🎁', '🍦', '🎮', '🎬', '📚', '🎨', '🏀', '🎸', '🍕', '🍰', '🎪', '🎯']

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
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#581c87',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          {product ? '✏️ 編輯商品' : '➕ 新增商品'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* 圖示選擇 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem', display: 'block' }}>
              選擇圖示
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  style={{
                    fontSize: '32px',
                    padding: '0.5rem',
                    border: formData.icon === icon ? '3px solid #a78bfa' : '2px solid #e9d5ff',
                    borderRadius: '0.75rem',
                    background: formData.icon === icon ? '#f3e8ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 品名 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem', display: 'block' }}>
              品名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：冰淇淋券"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #e9d5ff',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 點數 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem', display: 'block' }}>
              需要點數
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              min="1"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #e9d5ff',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 庫存 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem', display: 'block' }}>
              庫存數量（999 = 無限）
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              min="0"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #e9d5ff',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 按鈕 */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: '#f3f4f6',
                color: '#6b7280',
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
                background: 'linear-gradient(to right, #a78bfa, #8b5cf6)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
              }}
            >
              {product ? '✅ 儲存' : '✨ 新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 用戶管理組件
function UserManagement({ users, onAdd, onEdit, onDelete }) {
  return (
    <div>
      {/* 新增用戶按鈕 */}
      <button
        onClick={onAdd}
        style={{
          width: '100%',
          background: 'linear-gradient(to right, #a78bfa, #8b5cf6)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '18px',
          padding: '1.25rem',
          borderRadius: '1rem',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
          marginBottom: '1.5rem'
        }}
      >
        ➕ 新增用戶
      </button>

      {/* 用戶列表 */}
      {users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
          還沒有用戶，點擊上方按鈕新增
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => onEdit(user)}
              onDelete={() => onDelete(user.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 用戶卡片組件
function UserCard({ user, onEdit, onDelete }) {
  const roleText = user.role === 'parent' ? '家長' : '兒童'
  const roleColor = user.role === 'parent' ? '#7e22ce' : '#0891b2'
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
      border: '2px solid #e9d5ff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '48px' }}>{user.avatar}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#581c87', marginBottom: '0.25rem' }}>
            {user.name}
          </h3>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '14px', color: '#7e22ce' }}>
            <span style={{
              background: roleColor,
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold'
            }}>
              {roleText}
            </span>
            <span>🔢 PIN: {user.pin}</span>
            {user.role === 'child' && (
              <>
                <span>💰 {user.points} 點</span>
                <span>⭐ Lv.{user.level}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onEdit}
          style={{
            flex: 1,
            background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ✏️ 編輯
        </button>
        <button
          onClick={onDelete}
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
          🗑️ 刪除
        </button>
      </div>
    </div>
  )
}

// 用戶表單組件
function UserForm({ user, onSubmit, onClose }) {
  const [formData, setFormData] = useState(user || {
    name: '',
    role: 'child',
    pin: '',
    avatar: '👤',
    points: 0,
    level: 1
  })
  const [submitting, setSubmitting] = useState(false)

  const avatars = ['👤', '👨', '👩', '👦', '👧', '🧒', '👶', '🧑', '👨‍🦱', '👩‍🦰', '👨‍🦰', '👩‍🦱']

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (submitting) return
    
    if (!formData.name || !formData.pin) {
      alert('請填寫完整資訊')
      return
    }
    
    if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
      alert('PIN 必須是 4 位數字')
      return
    }
    
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
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
          {user ? '✏️ 編輯用戶' : '➕ 新增用戶'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* 頭像 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              頭像
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
              {avatars.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar })}
                  style={{
                    fontSize: '32px',
                    padding: '0.5rem',
                    borderRadius: '0.75rem',
                    border: formData.avatar === avatar ? '3px solid #8b5cf6' : '2px solid #e9d5ff',
                    background: formData.avatar === avatar ? '#f3e8ff' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* 姓名 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              姓名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例：小明"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #d8b4fe',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 角色 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              角色
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {[
                { value: 'parent', label: '👨‍👩‍👧 家長' },
                { value: 'child', label: '👦 兒童' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: option.value })}
                  style={{
                    background: formData.role === option.value
                      ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
                      : 'white',
                    color: formData.role === option.value ? 'white' : '#8b5cf6',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #c4b5fd',
                    cursor: 'pointer'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* PIN */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              PIN 碼（4 位數字）
            </label>
            <input
              type="text"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              placeholder="例：1234"
              maxLength="4"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #d8b4fe',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 兒童額外欄位 */}
          {formData.role === 'child' && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#7e22ce',
                  marginBottom: '0.5rem'
                }}>
                  初始點數
                </label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #d8b4fe',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#7e22ce',
                  marginBottom: '0.5rem'
                }}>
                  等級
                </label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #d8b4fe',
                    fontSize: '16px'
                  }}
                />
              </div>
            </>
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
              disabled={submitting}
              style={{
                flex: 1,
                background: submitting 
                  ? '#d1d5db' 
                  : 'linear-gradient(to right, #a78bfa, #8b5cf6)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                opacity: submitting ? 0.6 : 1
              }}
            >
              {submitting ? '⏳ 處理中...' : (user ? '✅ 儲存' : '➕ 新增')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
