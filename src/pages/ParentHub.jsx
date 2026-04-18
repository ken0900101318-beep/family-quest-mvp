import { useState, useEffect, useRef } from 'react'
import { mockAPI } from '../lib/supabase'
import { AnnouncementManager } from '../components/Announcements'
import { useToast } from '../components/Toast'
import ReviewHistory from '../components/ReviewHistory'

export default function ParentHub({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('pending') // pending, tasks, stats, shop, users
  const [shopTab, setShopTab] = useState('pending') // pending, history, products, wishes
  const [reviewTab, setReviewTab] = useState('pending') // ✅ pending, history
  const [pendingRequests, setPendingRequests] = useState([])
  const [reviewHistory, setReviewHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(0) // ✅ 分頁
  const [hasMoreHistory, setHasMoreHistory] = useState(true) // ✅ 是否還有更多
  const [loadingMore, setLoadingMore] = useState(false) // ✅ 載入中
  const [allTasks, setAllTasks] = useState([])
  const [stats, setStats] = useState({})
  const [purchases, setPurchases] = useState([])
  const [deliveredPurchases, setDeliveredPurchases] = useState([])
  const [wishes, setWishes] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskTab, setTaskTab] = useState('list') // ✅ list, proposals
  const [taskProposals, setTaskProposals] = useState([])
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [approvalForm, setApprovalForm] = useState({ 
    title: '', 
    points: 10, 
    description: '',
    type: 'daily', // 預設每日例行
    target: null // 預設所有人
  })
  
  // 用戶管理
  const [allUsers, setAllUsers] = useState([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  
  const { showToast, ToastContainer } = useToast()
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // ✅ 防止重複抓取
  const isFetching = useRef(false)

  useEffect(() => {
    loadData(true) // 首次載入
    
    // ✅ 自動輪詢（15秒）- 即時同步任務申請
    const pollInterval = setInterval(() => {
      refreshData() // 靜默刷新
    }, 15000)
    
    // ✅ 視窗聚焦觸發
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 視窗聚焦，觸發同步')
        refreshData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // ✅ Cleanup
    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadData = async (showLoadingState = true) => {
    // ✅ 防止重複執行
    if (isFetching.current) {
      console.log('⏭️ 跳過loadData：正在載入中')
      return
    }
    
    isFetching.current = true
    
    // 只有首次載入才顯示 loading
    if (showLoadingState && isInitialLoad) {
      setLoading(true)
    }
    
    try {
    // 從 Supabase 讀取待審核任務
    // 並行載入（更快！）+ 超時保護
        const timeout = (ms) => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('請求超時')), ms)
        )
        
        const [pendingSubmissions, allWishes, users, history, proposals] = await Promise.race([
          Promise.all([
            mockAPI.getPendingSubmissions(),
            mockAPI.getWishes(),
            mockAPI.getAllUsers(),
            mockAPI.getReviewHistory(20, 0), // ✅ 載入最近20筆審核歷史
            mockAPI.getTaskRequests() // ✅ 載入任務提案
          ]),
          timeout(10000) // 10秒超時
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
      
      setPendingRequests(formattedRequests)
      
      // ✅ 設定審核歷史
      setReviewHistory(history)
      if (history.length < 20) {
        setHasMoreHistory(false)
      }
      
      // ✅ 設定任務提案（只顯示pending）
      const pendingProposals = proposals.filter(p => p.status === 'pending')
      setTaskProposals(pendingProposals)
    
      // 從 Supabase 載入所有任務
      const allTasksData = await mockAPI.getAllTasks()
      setAllTasks(allTasksData)
    
    // 統計數據
      setStats({
        totalPoints: 0,
        completedTasks: 0,
        pendingReviews: formattedRequests.length,
        childStats: []
      })
    
    // 讀取待發放的購買記錄
      const allPurchases = await mockAPI.getPurchases()
      setPurchases(allPurchases)
      
      // 讀取已發放的購買記錄
      const deliveredList = await mockAPI.getDeliveredPurchases()
      setDeliveredPurchases(deliveredList)
      
      // 讀取所有交易記錄
      const allTransactions = await mockAPI.getTransactions()
      setTransactions(allTransactions)
      
      console.log('📊 交易記錄數量:', allTransactions.length)
    
    // 讀取待審核的許願清單
      const pendingWishes = allWishes.filter(w => w.status === 'pending')
      setWishes(pendingWishes)
      
      // 設定用戶列表
      setAllUsers(users)
      
      // ✅ 計算統計數據
      const totalPoints = allTransactions
        .filter(t => t.type === 'earn')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const completedTasks = allTransactions
        .filter(t => t.source === 'task_completion')
        .length
      
      const childStats = users
        .filter(u => u.role === 'child')
        .map(child => {
          const childTransactions = allTransactions.filter(t => t.user_id === child.id)
          const childPoints = childTransactions
            .filter(t => t.type === 'earn')
            .reduce((sum, t) => sum + t.amount, 0)
          const childCompleted = childTransactions
            .filter(t => t.source === 'task_completion')
            .length
          
          return {
            name: child.name,
            points: childPoints,
            completed: childCompleted,
            rate: allTasksData.length > 0 ? Math.round((childCompleted / allTasksData.length) * 100) : 0
          }
        })
      
      setStats({
        totalPoints,
        completedTasks,
        pendingReviews: formattedRequests.length,
        childStats
      })
      
      console.log('📊 統計數據:', { totalPoints, completedTasks, childStatsCount: childStats.length })
      
      // ✅ 成功載入後，強制關閉loading
      setLoading(false)
      setIsInitialLoad(false)
    
    } catch (error) {
      console.error('❌ loadData 失敗:', error)
      console.error('錯誤詳情:', {
        message: error.message,
        stack: error.stack,
        error: error
      })
      // 不要清空 pendingRequests，保留舊資料
      // setPendingRequests([])
      
      // ✅ 審核歷史載入失敗時設為空陣列
      setReviewHistory([])
      setHasMoreHistory(false)
      
      showToast(`資料載入失敗：${error.message || '請重新整理頁面'}`, 'error')
    } finally {
      // ✅ 無論成功或失敗，都要關閉 loading
      if (showLoadingState) {
        setLoading(false)
      }
      if (isInitialLoad) {
        setIsInitialLoad(false)
      }
      // ✅ 釋放鎖定
      isFetching.current = false
    }
  }
  
  // ✅ 靜默刷新函數（防干擾式同步）
  const refreshData = async () => {
    // 0. 檢查用戶是否存在
    if (!user || !user.id) {
      console.log('⏭️ 跳過refreshData：用戶未登入')
      return
    }
    
    // 1. Ref 鎖定
    if (isFetching.current) {
      console.log('⏭️ 跳過refreshData：正在載入中')
      return
    }
    
    isFetching.current = true
    
    try {
      // 2. 獲取最新資料
      const timeout = (ms) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('請求超時')), ms)
      )
      
      const [pendingSubmissions, allWishes, users, tasks, allPurchases, deliveredList, allTransactions] = await Promise.race([
        Promise.all([
          mockAPI.getPendingSubmissions(),
          mockAPI.getWishes(),
          mockAPI.getAllUsers(),
          mockAPI.getAllTasks(),
          mockAPI.getPurchases(),
          mockAPI.getDeliveredPurchases(),
          mockAPI.getTransactions()
        ]),
        timeout(10000)
      ])
      
      // 3. 深層比對 - 待審核任務
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
      
      setPendingRequests(prev => {
        if (JSON.stringify(prev) === JSON.stringify(formattedRequests)) {
          console.log('✅ 待審核任務無變化')
          return prev
        }
        console.log('🔄 待審核任務已更新')
        return formattedRequests
      })
      
      // 4. 深層比對 - 任務列表
      setAllTasks(prev => {
        if (JSON.stringify(prev) === JSON.stringify(tasks)) {
          console.log('✅ 任務列表無變化')
          return prev
        }
        console.log('🔄 任務列表已更新')
        return tasks
      })
      
      // 5. 深層比對 - 用戶列表
      setAllUsers(prev => {
        if (JSON.stringify(prev) === JSON.stringify(users)) {
          console.log('✅ 用戶列表無變化')
          return prev
        }
        console.log('🔄 用戶列表已更新')
        return users
      })
      
      // 6. 深層比對 - 購買記錄
      setPurchases(prev => {
        if (JSON.stringify(prev) === JSON.stringify(allPurchases)) {
          return prev
        }
        console.log('🔄 購買記錄已更新')
        return allPurchases
      })
      
      // 7. 深層比對 - 發放記錄
      setDeliveredPurchases(prev => {
        if (JSON.stringify(prev) === JSON.stringify(deliveredList)) {
          return prev
        }
        console.log('🔄 發放記錄已更新')
        return deliveredList
      })
      
      // 8. 深層比對 - 交易記錄
      setTransactions(prev => {
        if (JSON.stringify(prev) === JSON.stringify(allTransactions)) {
          return prev
        }
        console.log('🔄 交易記錄已更新')
        return allTransactions
      })
      
      // 9. 深層比對 - 許願清單
      const pendingWishes = allWishes.filter(w => w.status === 'pending')
      setWishes(prev => {
        if (JSON.stringify(prev) === JSON.stringify(pendingWishes)) {
          return prev
        }
        console.log('🔄 許願清單已更新')
        return pendingWishes
      })
      
      // 10. 計算統計數據
      console.log('📊 refreshData 交易記錄數量:', allTransactions.length)
      
      const totalPoints = allTransactions
        .filter(t => t.type === 'earn')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const completedTasks = allTransactions
        .filter(t => t.source === 'task_completion')
        .length
      
      const childStats = users
        .filter(u => u.role === 'child')
        .map(child => {
          const childTransactions = allTransactions.filter(t => t.user_id === child.id)
          const childPoints = childTransactions
            .filter(t => t.type === 'earn')
            .reduce((sum, t) => sum + t.amount, 0)
          const childCompleted = childTransactions
            .filter(t => t.source === 'task_completion')
            .length
          
          return {
            name: child.name,
            points: childPoints,
            completed: childCompleted,
            rate: tasks.length > 0 ? Math.round((childCompleted / tasks.length) * 100) : 0
          }
        })
      
      setStats({
        totalPoints,
        completedTasks,
        pendingReviews: pendingSubmissions.length,
        childStats
      })
      
      console.log('📊 refreshData 統計:', { totalPoints, completedTasks, childStatsCount: childStats.length })
      
      console.log('✅ refreshData 完成（靜默）')
      
    } catch (error) {
      console.error('❌ refreshData 失敗:', error.message)
      // 失敗不影響用戶，靜默處理
    } finally {
      isFetching.current = false
    }
  }

  // ✅ 重試載入審核歷史
  const retryLoadHistory = async () => {
    await loadData(false)
  }
  
  // ✅ 載入更多審核歷史
  const loadMoreHistory = async () => {
    if (loadingMore || !hasMoreHistory) return
    
    setLoadingMore(true)
    try {
      const nextPage = historyPage + 1
      const newHistory = await mockAPI.getReviewHistory(20, nextPage * 20)
      
      if (newHistory.length === 0) {
        setHasMoreHistory(false)
        showToast('已載入所有記錄', 'info')
      } else {
        setReviewHistory(prev => [...prev, ...newHistory])
        setHistoryPage(nextPage)
        if (newHistory.length < 20) {
          setHasMoreHistory(false)
        }
      }
    } catch (err) {
      console.error('載入更多失敗:', err)
      showToast('載入失敗，請稍後再試', 'error')
    } finally {
      setLoadingMore(false)
    }
  }
  
  const handleApprove = async (request, adjustedPoints) => {
    try {
      console.log('🔍 開始核准:', { request, adjustedPoints })
      await mockAPI.approveSubmission(request.id, adjustedPoints)
      console.log('✅ 核准成功')
      // 從待審核列表中移除
      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
      showToast(`已核准「${request.title}」 (${adjustedPoints || request.points} 點)`, 'success')
      
      // ✅ 核准後立即同步
      setTimeout(() => refreshData(), 500)
    } catch (err) {
      console.error('❌ 核准失敗:', err)
      showToast(`核准失敗：${err.message || '請稍後再試'}`, 'error')
    }
  }

  const handleReject = async (request, reason) => {
    try {
      await mockAPI.rejectSubmission(request.id, reason)
      // 從待審核列表中移除
      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
      showToast(`已拒絕「${request.title}」`, 'error')
    } catch {
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
  
  // ✅ 開啟核准Modal
  const openApprovalModal = (proposal) => {
    setSelectedProposal(proposal)
    setApprovalForm({
      title: proposal.title,
      points: proposal.points,
      description: proposal.description || '',
      type: 'daily', // 預設每日例行
      target: null // 預設所有人
    })
    setShowApprovalModal(true)
  }
  
  // ✅ 核准任務提案
  const handleApproveProposal = async () => {
    if (!approvalForm.title.trim()) {
      showToast('請輸入任務名稱', 'error')
      return
    }
    
    if (!approvalForm.points || approvalForm.points < 1 || approvalForm.points > 1000) {
      showToast('點數必須在 1-1000 之間', 'error')
      return
    }
    
    try {
      console.log('🚀 開始核准提案:', {
        id: selectedProposal.id,
        title: approvalForm.title.trim(),
        points: parseInt(approvalForm.points),
        description: approvalForm.description.trim()
      })
      
      await mockAPI.approveTaskRequest(
        selectedProposal.id,
        approvalForm.title.trim(),
        parseInt(approvalForm.points),
        approvalForm.description.trim(),
        approvalForm.type, // 任務類型
        approvalForm.target // 指派對象
      )
      
      showToast(`✅ 已核准「${approvalForm.title}」並發佈為新任務！`, 'success')
      setShowApprovalModal(false)
      setSelectedProposal(null)
      
      // ✅ 立即從State移除該提案
      setTaskProposals(prev => prev.filter(p => p.id !== selectedProposal.id))
      
      // ✅ 重新載入完整資料（確保同步）
      loadData(false)
    } catch (error) {
      console.error('❌ 核准提案失敗:', error)
      const errorMsg = error.message || '核准失敗，請稍後再試'
      showToast(`❌ ${errorMsg}`, 'error')
    }
  }
  
  // ✅ 拒絕任務提案
  const handleRejectProposal = async (proposalId) => {
    if (!confirm('確定要退回這個提案嗎？')) {
      return
    }
    
    try {
      await mockAPI.rejectTaskRequest(proposalId)
      showToast('❌ 已退回提案', 'info')
      
      // ✅ 立即從State移除該提案
      setTaskProposals(prev => prev.filter(p => p.id !== proposalId))
      
      // ✅ 重新載入完整資料（確保同步）
      loadData(false)
    } catch (error) {
      console.error('❌ 退回提案失敗:', error)
      const errorMsg = error.message || '退回失敗，請稍後再試'
      showToast(`❌ ${errorMsg}`, 'error')
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
              <>
                {/* ✅ 審核分頁切換 */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    onClick={() => setReviewTab('pending')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: reviewTab === 'pending' ? 'linear-gradient(to right, #8b5cf6, #7c3aed)' : '#f3f4f6',
                      color: reviewTab === 'pending' ? 'white' : '#6b7280',
                      fontWeight: reviewTab === 'pending' ? '700' : '600',
                      fontSize: '14px',
                      borderRadius: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ⏰ 待處理 ({pendingRequests.length})
                  </button>
                  <button
                    onClick={() => setReviewTab('history')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: reviewTab === 'history' ? 'linear-gradient(to right, #8b5cf6, #7c3aed)' : '#f3f4f6',
                      color: reviewTab === 'history' ? 'white' : '#6b7280',
                      fontWeight: reviewTab === 'history' ? '700' : '600',
                      fontSize: '14px',
                      borderRadius: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    📋 審核歷史 ({reviewHistory.length})
                  </button>
                </div>
                
                {reviewTab === 'pending' && (
                  <PendingReviews
                    requests={pendingRequests}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    showToast={showToast}
                  />
                )}
                
                {reviewTab === 'history' && (
                  <ReviewHistory 
                    history={reviewHistory}
                    onLoadMore={loadMoreHistory}
                    hasMore={hasMoreHistory}
                    loading={loadingMore}
                  />
                )}
              </>
            )}
            {activeTab === 'tasks' && (
              <TaskManagement 
                tasks={allTasks}
                pendingSubmissions={pendingRequests}
                taskTab={taskTab}
                setTaskTab={setTaskTab}
                taskProposals={taskProposals}
                onCreateNew={() => { setEditingTask(null); setShowTaskForm(true); }}
                onEditTask={handleEditTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onApproveProposal={openApprovalModal}
                onRejectProposal={handleRejectProposal}
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
        
        {/* ✅ 核准提案Modal */}
        {showApprovalModal && selectedProposal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#7e22ce', fontSize: '24px', fontWeight: 'bold' }}>
                ✅ 修改並核准提案
              </h2>
              
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                  提案人：<strong>{selectedProposal.userName}</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  原始點數：<strong>{selectedProposal.points}</strong>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>
                  任務名稱 *
                </label>
                <input
                  type="text"
                  value={approvalForm.title}
                  onChange={(e) => setApprovalForm({...approvalForm, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '14px'
                  }}
                  placeholder="例如：整理房間"
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>
                  點數 *
                </label>
                <input
                  type="number"
                  value={approvalForm.points}
                  onChange={(e) => setApprovalForm({...approvalForm, points: e.target.value})}
                  min="1"
                  max="1000"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>
                  任務類型 *
                </label>
                <select
                  value={approvalForm.type}
                  onChange={(e) => setApprovalForm({...approvalForm, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="daily">📅 每日例行</option>
                  <option value="challenge">🏆 長期挑戰</option>
                  <option value="extra">⚡ 單次任務</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>
                  指派對象 *
                </label>
                <select
                  value={approvalForm.target || ''}
                  onChange={(e) => setApprovalForm({...approvalForm, target: e.target.value === '' ? null : e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">👨‍👩‍👧‍👦 所有人</option>
                  {allUsers.filter(u => u.role !== 'parent').map(u => (
                    <option key={u.id} value={u.id}>
                      {u.avatar} {u.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>
                  任務說明（可選）
                </label>
                <textarea
                  value={approvalForm.description}
                  onChange={(e) => setApprovalForm({...approvalForm, description: e.target.value})}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="任務的詳細說明..."
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    fontWeight: 'bold',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleApproveProposal}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    fontWeight: 'bold',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  ✅ 確認發佈
                </button>
              </div>
            </div>
          </div>
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
function PendingReviews({ requests, onApprove, onReject, showToast }) {
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
function TaskManagement({ tasks, onCreateNew, onEditTask, onToggleTask, onDeleteTask, pendingSubmissions = [], taskTab, setTaskTab, taskProposals = [], onApproveProposal, onRejectProposal }) {
  const [selectedMember, setSelectedMember] = useState('all') // all / 哥哥 / 妹妹
  const [filterCategory, setFilterCategory] = useState('all') // all / daily / challenge / longterm / pending / todayIncomplete
  const [todayStats, setTodayStats] = useState({ completed: 0, total: 0 })
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // 載入今日進度統計
  useEffect(() => {
    const loadTodayProgress = async () => {
      setIsLoadingStats(true)
      try {
        // 取得今天的日期（YYYY-MM-DD 格式）
        const now = new Date()
        const today = now.toISOString().split('T')[0]
        
        // 獲取所有submissions
        const allSubmissions = await mockAPI.getAllSubmissions()
        
        // 過濾今日已完成的submissions（增強容錯）
        const todayApproved = allSubmissions.filter(s => {
          if (s.status !== 'approved') return false
          
          // 支援多種時間格式
          const submissionDate = new Date(s.timestamp)
          const submissionDateStr = submissionDate.toISOString().split('T')[0]
          
          return submissionDateStr === today
        })
        
        // 計算當前成員的每日任務
        let memberDailyTasks = tasks.filter(t => t.type === 'daily' && t.status === 'active')
        
        if (selectedMember !== 'all') {
          memberDailyTasks = memberDailyTasks.filter(t => {
            if (t.assignedUsers && t.assignedUsers.length > 0) {
              return t.assignedUsers.some(user => user.name === selectedMember)
            }
            if (t.assignedTo) {
              return t.assignedTo === selectedMember || t.assignedTo === 'all'
            }
            return false
          })
        }
        
        // 計算今日完成數（針對當前成員的任務）
        const completedSubmissions = todayApproved.filter(s => {
          return memberDailyTasks.some(t => t.id === s.taskId)
        })
        
        const completedCount = completedSubmissions.length
        
        // ✅ 深層比對：只有數字真的不同才更新
        setTodayStats(prev => {
          if (prev.completed === completedCount && prev.total === memberDailyTasks.length) {
            return prev // 不更新，避免觸發重新渲染
          }
          return {
            completed: completedCount,
            total: memberDailyTasks.length
          }
        })
      } catch (error) {
        console.error('❌ 載入今日進度失敗:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }
    
    // 只在首次載入時執行
    if (tasks.length > 0) {
      loadTodayProgress()
    }
  }, [selectedMember, tasks.length]) // 成員切換或任務數量變化時更新

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
  if (filterCategory === 'daily' || filterCategory === 'challenge' || filterCategory === 'longterm') {
    filteredTasks = filteredTasks.filter(t => t.type === filterCategory)
  } else if (filterCategory === 'todayIncomplete') {
    // 顯示今日未完成的每日任務
    filteredTasks = filteredTasks.filter(t => t.type === 'daily' && t.status === 'active')
  }

  // 統計數據
  const stats = {
    total: selectedMember === 'all' ? tasks.length : filteredTasks.length,
    todayProgress: `${todayStats.completed} / ${todayStats.total}`,
    todayCompleted: todayStats.completed,
    todayTotal: todayStats.total,
    pending: pendingSubmissions.length,
    challenge: tasks.filter(t => {
      if (t.type !== 'challenge') return false
      if (selectedMember === 'all') return true
      
      if (t.assignedUsers && t.assignedUsers.length > 0) {
        return t.assignedUsers.some(user => user.name === selectedMember)
      }
      if (t.assignedTo) {
        return t.assignedTo === selectedMember || t.assignedTo === 'all'
      }
      return false
    }).length
  }

  return (
    <div>
      {/* ✅ 雙頁籤 */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setTaskTab('list')}
          style={{
            padding: '1rem 2rem',
            background: taskTab === 'list' ? 'linear-gradient(135deg, #7e22ce, #6b21a8)' : 'transparent',
            color: taskTab === 'list' ? 'white' : '#6b7280',
            fontWeight: 'bold',
            fontSize: '16px',
            border: 'none',
            borderBottom: taskTab === 'list' ? '3px solid #7e22ce' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📋 任務列表
        </button>
        <button
          onClick={() => setTaskTab('proposals')}
          style={{
            padding: '1rem 2rem',
            background: taskTab === 'proposals' ? 'linear-gradient(135deg, #7e22ce, #6b21a8)' : 'transparent',
            color: taskTab === 'proposals' ? 'white' : '#6b7280',
            fontWeight: 'bold',
            fontSize: '16px',
            border: 'none',
            borderBottom: taskTab === 'proposals' ? '3px solid #7e22ce' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          💡 孩子提案
          {taskProposals.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {taskProposals.length}
            </span>
          )}
        </button>
      </div>
      
      {/* 任務列表頁籤 */}
      {taskTab === 'list' && (
        <>
          {/* 頂部快速過濾器 */}
          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* 所有任務 */}
        <div 
          onClick={() => setFilterCategory('all')}
          style={{
            background: '#FFFBEB',
            borderLeft: '4px solid #F59E0B',
            borderRadius: '0.75rem',
            padding: '1.25rem 1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: filterCategory === 'all' ? '0 8px 20px rgba(245,158,11,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            transform: filterCategory === 'all' ? 'translateY(-4px) scale(1.02)' : 'none',
            borderBottom: filterCategory === 'all' ? '4px solid #F59E0B' : 'none'
          }}
          onMouseOver={(e) => { if (filterCategory !== 'all') e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseOut={(e) => { if (filterCategory !== 'all') e.currentTarget.style.transform = 'none' }}
        >
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#D97706', marginBottom: '0.5rem' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '13px', color: '#78716C', fontWeight: '600' }}>
            所有任務
          </div>
        </div>

        {/* 今日進度 */}
        <div 
          onClick={() => setFilterCategory(filterCategory === 'todayIncomplete' ? 'all' : 'todayIncomplete')}
          style={{
            background: '#F0FDF4',
            borderLeft: '4px solid #10B981',
            borderRadius: '0.75rem',
            padding: '1.25rem 1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: filterCategory === 'todayIncomplete' ? '0 8px 20px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            transform: filterCategory === 'todayIncomplete' ? 'translateY(-4px) scale(1.02)' : 'none',
            borderBottom: filterCategory === 'todayIncomplete' ? '4px solid #10B981' : 'none'
          }}
          onMouseOver={(e) => { if (filterCategory !== 'todayIncomplete') e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseOut={(e) => { if (filterCategory !== 'todayIncomplete') e.currentTarget.style.transform = 'none' }}
        >
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
            {isLoadingStats ? '...' : stats.todayProgress}
          </div>
          <div style={{ fontSize: '13px', color: '#78716C', fontWeight: '600' }}>
            今日進度
          </div>
        </div>

        {/* 待審核 */}
        <div 
          onClick={() => {
            // 跳轉到待審核分頁
            window.location.hash = '#reviews'
          }}
          style={{
            background: '#FEF2F2',
            borderLeft: '4px solid #EF4444',
            borderRadius: '0.75rem',
            padding: '1.25rem 1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(239,68,68,0.3)' }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#DC2626', marginBottom: '0.5rem' }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '13px', color: '#78716C', fontWeight: '600' }}>
            待審核
          </div>
        </div>

        {/* 挑戰任務 */}
        <div 
          onClick={() => setFilterCategory(filterCategory === 'challenge' ? 'all' : 'challenge')}
          style={{
            background: '#F5F3FF',
            borderLeft: '4px solid #8B5CF6',
            borderRadius: '0.75rem',
            padding: '1.25rem 1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: filterCategory === 'challenge' ? '0 8px 20px rgba(139,92,246,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            transform: filterCategory === 'challenge' ? 'translateY(-4px) scale(1.02)' : 'none',
            borderBottom: filterCategory === 'challenge' ? '4px solid #8B5CF6' : 'none'
          }}
          onMouseOver={(e) => { if (filterCategory !== 'challenge') e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseOut={(e) => { if (filterCategory !== 'challenge') e.currentTarget.style.transform = 'none' }}
        >
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7C3AED', marginBottom: '0.5rem' }}>
            {stats.challenge}
          </div>
          <div style={{ fontSize: '13px', color: '#78716C', fontWeight: '600' }}>
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
        <GroupedTaskList
          tasks={filteredTasks}
          onEditTask={onEditTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
        />
      )}
        </>
      )}
      
      {/* ✅ 提案列表頁籤 */}
      {taskTab === 'proposals' && (
        <div>
          {taskProposals.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '1rem' }}>📝</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                尚無提案
              </div>
              <div style={{ fontSize: '14px' }}>
                等待孩子提出新任務申請
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {taskProposals.map(proposal => (
                <div
                  key={proposal.id}
                  style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#111' }}>
                          {proposal.title}
                        </span>
                        <span style={{
                          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {proposal.points} 💰
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                        提案人：<strong>{proposal.userName}</strong>
                      </div>
                      {proposal.description && (
                        <div style={{ fontSize: '14px', color: '#374151', marginTop: '0.75rem', lineHeight: '1.6' }}>
                          {proposal.description}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '0.75rem' }}>
                        提案時間：{new Date(proposal.createdAt).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => onRejectProposal(proposal.id)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        borderRadius: '0.75rem',
                        border: '2px solid #fecaca',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ 退回
                    </button>
                    <button
                      onClick={() => onApproveProposal(proposal)}
                      style={{
                        flex: 2,
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      ✅ 修改並核准
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 任務卡片（管理視圖 - 緊湊版）
// 任務類型設定（供 TaskRow 與 GroupedTaskList 共用）
const TASK_TYPE_CONFIG = {
  daily: { color: '#10b981', emoji: '📅', label: '每日例行' },
  challenge: { color: '#f59e0b', emoji: '🏆', label: '長期挑戰' },
  extra: { color: '#8b5cf6', emoji: '⚡', label: '單次任務' }
}
const TASK_GROUP_ORDER = ['daily', 'challenge', 'extra']

// 分組清單容器
function GroupedTaskList({ tasks, onEditTask, onToggleTask, onDeleteTask }) {
  const grouped = {}
  tasks.forEach(t => {
    const key = TASK_TYPE_CONFIG[t.type] ? t.type : 'daily'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  const visibleGroups = TASK_GROUP_ORDER.filter(k => grouped[k] && grouped[k].length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {visibleGroups.map(key => {
        const cfg = TASK_TYPE_CONFIG[key]
        return (
          <div key={key}>
            {/* 分組標題 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '0.875rem',
              paddingBottom: '0.625rem',
              borderBottom: `2px solid ${cfg.color}33`
            }}>
              <span style={{ fontSize: '20px' }}>{cfg.emoji}</span>
              <span style={{
                fontSize: '16px',
                fontWeight: '700',
                color: cfg.color
              }}>
                {cfg.label}
              </span>
              <span style={{
                fontSize: '13px',
                color: '#9ca3af',
                fontWeight: '500'
              }}>
                · {grouped[key].length} 項
              </span>
            </div>
            {/* 清單（寬螢幕自動兩欄，窄螢幕單欄） */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '0.75rem'
            }}>
              {grouped[key].map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 頭像群（最多疊加 3 個，多的顯示 +N）
function AvatarGroup({ users }) {
  if (!users || users.length === 0) {
    return (
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        flexShrink: 0,
        border: '2px solid white'
      }}>👥</div>
    )
  }
  const show = users.slice(0, 3)
  const rest = users.length - show.length
  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      {show.map((u, i) => (
        <div
          key={i}
          title={u.name}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#ede9fe',
            border: '2px solid white',
            marginLeft: i === 0 ? 0 : '-10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            zIndex: show.length - i,
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
          }}
        >
          {u.avatar || '👤'}
        </div>
      ))}
      {rest > 0 && (
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#6b7280',
          color: 'white',
          border: '2px solid white',
          marginLeft: '-10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '700',
          zIndex: 0
        }}>+{rest}</div>
      )}
    </div>
  )
}

// 下拉選單（點擊外部自動關閉）
function DropdownMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        aria-label="更多操作"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '0.5rem',
          background: open ? '#f3f4f6' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '22px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1
        }}
        onMouseOver={(e) => { if (!open) e.currentTarget.style.background = '#f9fafb' }}
        onMouseOut={(e) => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        ⋯
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.625rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          minWidth: '150px',
          zIndex: 20,
          overflow: 'hidden'
        }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { setOpen(false); item.onClick() }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.875rem',
                background: 'white',
                border: 'none',
                fontSize: '14px',
                color: item.danger ? '#dc2626' : '#374151',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                borderTop: i === 0 ? 'none' : '1px solid #f3f4f6'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f9fafb' }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'white' }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 單筆任務橫條
function TaskRow({ task, onEdit, onToggle, onDelete }) {
  const config = TASK_TYPE_CONFIG[task.type] || TASK_TYPE_CONFIG.daily
  const isInactive = task.status === 'inactive'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      padding: '0.875rem 1rem',
      opacity: isInactive ? 0.55 : 1,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'all 0.15s',
      flexWrap: 'wrap'
    }}>
      {/* 左：頭像群 */}
      <AvatarGroup users={task.assignedUsers} />

      {/* 中：標題 + 描述 */}
      <div style={{ flex: 1, minWidth: '120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>{task.icon}</span>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#111827',
            margin: 0,
            lineHeight: 1.4,
            wordBreak: 'break-word'
          }}>
            {task.title}
          </h3>
        </div>
        {task.description && task.description.trim() && (
          <div style={{
            fontSize: '13px',
            color: '#6b7280',
            marginTop: '0.25rem',
            paddingLeft: '1.75rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word'
          }}>
            {task.description}
          </div>
        )}
      </div>

      {/* 右：點數 + 類型徽章 + 更多 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        flexShrink: 0
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '16px',
          fontWeight: '800',
          color: '#d97706'
        }}>
          <span style={{ fontSize: '18px' }}>🪙</span>
          <span>{task.points}</span>
        </span>

        <span style={{
          fontSize: '12px',
          color: config.color,
          background: `${config.color}1a`,
          padding: '0.25rem 0.625rem',
          borderRadius: '1rem',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}>
          {config.emoji} {config.label}
        </span>

        {isInactive && (
          <span style={{
            fontSize: '12px',
            color: '#6b7280',
            background: '#f3f4f6',
            padding: '0.25rem 0.625rem',
            borderRadius: '1rem',
            fontWeight: '600'
          }}>
            已停用
          </span>
        )}

        <DropdownMenu
          items={[
            { icon: '✏️', label: '編輯', onClick: () => onEdit(task) },
            {
              icon: isInactive ? '✅' : '🔒',
              label: isInactive ? '啟用' : '停用',
              onClick: () => onToggle(task)
            },
            {
              icon: '🗑️',
              label: '刪除',
              onClick: () => {
                if (confirm(`確定要永久刪除「${task.title}」嗎？此操作無法復原！`)) {
                  onDelete(task.id)
                }
              },
              danger: true
            }
          ]}
        />
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


// ✅ 審核歷史組件
