import { createClient } from '@supabase/supabase-js'

// Supabase 配置（使用環境變數）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 檢查環境變數是否設定
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check .env.local file.')
}

// Mock mode - 設為 false 啟用真實資料庫
export const MOCK_MODE = false

export const supabase = MOCK_MODE 
  ? null 
  : createClient(supabaseUrl, supabaseKey)

// 測試家庭 ID（固定使用這個）
const TEST_FAMILY_ID = '00000000-0000-0000-0000-000000000001'

// ========================================
// Mock 資料（Supabase 超時時備用）
// ========================================

function getMockPendingSubmissions() {
  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString()
  
  return [
    {
      id: 'mock-1',
      taskId: 'task-1',
      taskTitle: '勇者床鋪堡壘',
      userId: 'user-1',
      userName: '哥哥',
      userAvatar: '👦',
      timestamp: now,
      status: 'pending',
      photo: null,
      points: 5
    },
    {
      id: 'mock-2',
      taskId: 'task-2',
      taskTitle: '知識圖書館',
      userId: 'user-2',
      userName: '妹妹',
      userAvatar: '👧',
      timestamp: yesterday,
      status: 'pending',
      photo: null,
      points: 10
    },
    {
      id: 'mock-3',
      taskId: 'task-3',
      taskTitle: '彩虹牙刷挑戰',
      userId: 'user-1',
      userName: '哥哥',
      userAvatar: '👦',
      timestamp: now,
      status: 'pending',
      photo: null,
      points: 50
    }
  ]
}

// ========================================
// API 函數
// ========================================

export const mockAPI = {
  // 登入
  login: async (pin) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('pin', pin)
      .eq('family_id', TEST_FAMILY_ID)
      .single()
    
    if (error) {
      console.error('Login error:', error)
      return null
    }
    
    return {
      id: data.id,
      name: data.name,
      role: data.role,
      pin: data.pin,
      avatar: data.avatar,
      points: data.points,
      level: data.level,
      familyId: data.family_id
    }
  },
  
  // 更新用戶點數
  updateUserPoints: async (userId, newPoints) => {
    const { data, error } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Update points error:', error)
      return null
    }
    
    return {
      id: data.id,
      name: data.name,
      points: data.points
    }
  },
  
  // 取得用戶任務（使用新的 task_assignments）
  getTasks: async (userId) => {
    const { data, error } = await supabase
      .from('task_assignments')
      .select(`
        id,
        progress,
        status,
        completed_at,
        tasks!inner (
          id,
          family_id,
          title,
          icon,
          points,
          type,
          target,
          description,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('tasks.status', 'active')
    
    if (error) {
      console.error('Get tasks error:', error)
      return []
    }
    
    return data.map(assignment => ({
      assignmentId: assignment.id,
      id: assignment.tasks.id,
      title: assignment.tasks.title,
      icon: assignment.tasks.icon,
      points: assignment.tasks.points,
      type: assignment.tasks.type,
      target: assignment.tasks.target,
      status: assignment.status,
      progress: assignment.progress,
      description: assignment.tasks.description,
      completedAt: assignment.completed_at
    }))
  },
  
  // 取得所有任務（家長端用，需要顯示有哪些人被指派）
  getAllTasks: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_assignments (
          user_id,
          users (name, avatar)
        )
      `)
      .eq('family_id', TEST_FAMILY_ID)
    
    if (error) {
      console.error('Get all tasks error:', error)
      return []
    }
    
    return data.map(task => ({
      id: task.id,
      title: task.title,
      icon: task.icon,
      points: task.points,
      type: task.type,
      target: task.target,
      status: task.status,
      description: task.description,
      assignedUsers: task.task_assignments?.map(a => ({
        userId: a.user_id,
        name: a.users?.name,
        avatar: a.users?.avatar
      })) || []
    }))
  },
  
  // 儲存任務（新增或更新 - 使用新的 task_assignments）
  saveTask: async (taskData) => {
    if (taskData.id) {
      // 更新現有任務
      const { error } = await supabase
        .from('tasks')
        .update({
          title: taskData.title,
          icon: taskData.icon,
          points: taskData.points,
          type: taskData.type,
          target: taskData.target,
          status: taskData.status,
          description: taskData.description
        })
        .eq('id', taskData.id)
      
      if (error) {
        console.error('Update task error:', error)
        throw new Error(`更新任務失敗: ${error.message || error.code || '未知錯誤'}`)
      }
      
      // TODO: 更新指派（如果 assignee 有變動）
      
    } else {
      // 新增任務（兩階段：先建任務，再建指派）
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          family_id: TEST_FAMILY_ID,
          title: taskData.title,
          icon: taskData.icon,
          points: taskData.points,
          type: taskData.type,
          target: taskData.target,
          description: taskData.description,
          status: 'active'
        })
        .select()
        .single()
      
      if (taskError) {
        console.error('Insert task error:', taskError)
        throw new Error(`新增任務失敗: ${taskError.message || '未知錯誤'}`)
      }
      
      // 建立任務指派
      if (taskData.assignee && taskData.assignee.length > 0) {
        const assignments = taskData.assignee.map(userId => ({
          task_id: newTask.id,
          user_id: userId,
          progress: 0,
          status: 'assigned'
        }))
        
        const { error: assignError } = await supabase
          .from('task_assignments')
          .insert(assignments)
        
        if (assignError) {
          console.error('Create assignments error:', assignError)
          // 任務已建立，但指派失敗（不拋出錯誤，只記錄）
        }
      }
    }
    
    // 返回更新後的所有任務
    return await mockAPI.getAllTasks()
  },
  
  // 刪除任務
  deleteTask: async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    
    if (error) {
      console.error('Delete task error:', error)
      throw new Error(`刪除任務失敗: ${error.message}`)
    }
  },

  // 更新任務進度
  updateTaskProgress: async (assignmentId, newProgress, target) => {
    const isCompleted = target && newProgress >= target
    
    const { data, error } = await supabase
      .from('task_assignments')
      .update({ 
        progress: newProgress,
        status: isCompleted ? 'completed' : 'in_progress',
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq('id', assignmentId)
      .select()
    
    if (error) {
      console.error('Update task progress error:', error)
      throw new Error(`更新進度失敗: ${error.message || '未知錯誤'}`)
    }
    
    return data
  },
  
  // 提交任務
  submitTask: async (taskId, userId, photoData = null) => {
    // 查詢任務資訊
    const { data: task } = await supabase
      .from('tasks')
      .select('title, points')
      .eq('id', taskId)
      .single()
    
    // 查詢用戶資訊
    const { data: user } = await supabase
      .from('users')
      .select('name, avatar')
      .eq('id', userId)
      .single()
    
    // 新增提交記錄
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        task_id: taskId,
        user_id: userId,
        photo: photoData,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Submit task error:', error)
      throw error
    }
    
    return {
      id: data.id,
      taskId: taskId,
      taskTitle: task?.title || '未知任務',
      userId: userId,
      userName: user?.name || '未知用戶',
      userAvatar: user?.avatar || '👤',
      timestamp: data.created_at,
      status: data.status,
      photo: data.photo
    }
  },
  
  // 取得待審核任務
  getPendingSubmissions: async () => {
    try {
      // 超快查詢：最少欄位 + 最少數量 + 不排序
      const { data, error } = await supabase
        .from('submissions')
        .select('id, task_id, user_id, created_at, status, photo')
        .eq('status', 'pending')
        .limit(20)
      
      if (error) {
        console.error('Get pending submissions error:', error)
        // 超時時返回 mock 資料讓 UI 至少能動
        if (error.code === '57014') {
          console.warn('⚠️ Supabase 超時，使用 mock 資料')
          return getMockPendingSubmissions()
        }
        return []
      }
      
      if (!data || data.length === 0) {
        return []
      }
      
      // 取得相關的 tasks 和 users（批次查詢）
      const taskIds = [...new Set(data.map(s => s.task_id).filter(Boolean))]
      const userIds = [...new Set(data.map(s => s.user_id).filter(Boolean))]
      
      const [tasksData, usersData] = await Promise.all([
        supabase.from('tasks').select('id, title, points').in('id', taskIds),
        supabase.from('users').select('id, name, avatar').in('id', userIds)
      ])
      
      const tasksMap = new Map((tasksData.data || []).map(t => [t.id, t]))
      const usersMap = new Map((usersData.data || []).map(u => [u.id, u]))
      
      return data.map(sub => {
        const task = tasksMap.get(sub.task_id)
        const user = usersMap.get(sub.user_id)
        
        return {
          id: sub.id,
          taskId: sub.task_id,
          taskTitle: task?.title || '未知任務',
          userId: sub.user_id,
          userName: user?.name || '未知用戶',
          userAvatar: user?.avatar || '👤',
          timestamp: sub.created_at,
          status: sub.status,
          photo: sub.photo,
          points: task?.points || 10
        }
      })
    } catch (err) {
      console.error('getPendingSubmissions 完全失敗:', err)
      return getMockPendingSubmissions()
    }
  },
  
  // 核准任務
  approveSubmission: async (submissionId, adjustedPoints) => {
    console.log('🔍 Approving submission:', submissionId)
    
    // 查詢提交記錄
    const { data: submission, error: queryError } = await supabase
      .from('submissions')
      .select(`
        *,
        task:tasks(title, points),
        user:users(name, points)
      `)
      .eq('id', submissionId)
      .single()
    
    if (queryError) {
      console.error('❌ Query submission error:', queryError)
      throw new Error(`查詢提交記錄失敗: ${queryError.message}`)
    }
    
    if (!submission) {
      console.error('❌ Submission not found:', submissionId)
      throw new Error('找不到提交記錄')
    }
    
    console.log('✅ Found submission:', submission)
    
    const points = adjustedPoints || submission.task.points
    
    // 更新提交狀態
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        points: points,
        approved_at: new Date().toISOString()
      })
      .eq('id', submissionId)
    
    if (updateError) {
      console.error('Update submission status error:', updateError)
      throw new Error(`更新提交狀態失敗: ${updateError.message}`)
    }
    
    console.log(`✅ Submission ${submissionId} status updated to approved`)
    
    // 驗證更新
    const { data: verifyData } = await supabase
      .from('submissions')
      .select('status')
      .eq('id', submissionId)
      .single()
    
    console.log(`🔍 Verify submission ${submissionId} status:`, verifyData?.status)
    
    // 更新用戶點數
    const newPoints = (submission.user.points || 0) + points
    await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', submission.user_id)
    
    // 新增交易記錄
    await supabase
      .from('transactions')
      .insert({
        user_id: submission.user_id,
        type: 'earn',
        amount: points,
        source: 'task_completion',
        source_id: submissionId,
        description: `完成任務：${submission.task.title}`
      })
    
    return {
      id: submissionId,
      status: 'approved',
      points: points,
      taskTitle: submission.task.title
    }
  },
  
  // 退回任務
  rejectSubmission: async (submissionId, reason) => {
    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'rejected',
        reject_reason: reason
      })
      .eq('id', submissionId)
    
    if (error) {
      console.error('Reject submission error:', error)
      return null
    }
    
    return { id: submissionId, status: 'rejected' }
  },
  
  // 取得商品列表
  getProducts: async (includeInactive = false) => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('family_id', TEST_FAMILY_ID)
      .order('created_at', { ascending: true })
    
    if (!includeInactive) {
      query = query.eq('status', 'active')
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Get products error:', error)
      return []
    }
    
    return data.map(p => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      price: p.price,
      stock: p.stock,
      status: p.status,
      category: p.category,
      description: p.description
    }))
  },
  
  // 新增商品
  addProduct: async (name, price, icon = '🎁', stock = 999) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        family_id: TEST_FAMILY_ID,
        name: name,
        icon: icon,
        price: price,
        stock: stock,
        status: 'active'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Add product error:', error)
      throw error
    }
    
    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      price: data.price,
      stock: data.stock,
      status: data.status
    }
  },
  
  // 更新商品
  updateProduct: async (productId, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        icon: updates.icon,
        price: updates.price,
        stock: updates.stock
      })
      .eq('id', productId)
      .select()
      .single()
    
    if (error) {
      console.error('Update product error:', error)
      throw error
    }
    
    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      price: data.price,
      stock: data.stock,
      status: data.status
    }
  },
  
  // 切換商品狀態（啟用/停用）
  toggleProductStatus: async (productId) => {
    // 先查詢目前狀態
    const { data: product } = await supabase
      .from('products')
      .select('status')
      .eq('id', productId)
      .single()
    
    if (!product) {
      throw new Error('Product not found')
    }
    
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', productId)
    
    if (error) {
      console.error('Toggle product status error:', error)
      throw error
    }
    
    return newStatus
  },
  
  // 取得購買記錄
  getPurchases: async (userId = null) => {
    let query = supabase
      .from('purchases')
      .select(`
        *,
        users (name, avatar),
        products (name, icon)
      `)
      .order('created_at', { ascending: false })
    
    // 如果有 userId，查詢該用戶的所有購買記錄（包含已發放）
    // 如果沒有 userId（家長端），只查詢 pending（待發放）
    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('status', 'pending')
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Get purchases error:', error)
      return []
    }
    
    return data.map(p => ({
      id: p.id,
      userId: p.user_id,
      userName: p.users?.name || '未知用戶',
      userAvatar: p.users?.avatar || '👤',
      productName: p.products?.name || '未知商品',
      productIcon: p.products?.icon || '🎁',
      quantity: p.quantity,
      // ✨ 關鍵修正：優先用 price，沒有就用 total_price
      totalPrice: p.price || p.total_price || 0,
      status: p.status,
      createdAt: p.created_at
    }))
  },

  // 取得已發放的購買記錄
  getDeliveredPurchases: async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        users (name, avatar),
        products (name, icon)
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('Get delivered purchases error:', error)
      return []
    }
    
    return data.map(p => ({
      id: p.id,
      userId: p.user_id,
      userName: p.users?.name || '未知用戶',
      userAvatar: p.users?.avatar || '👤',
      productName: p.products?.name || '未知商品',
      productIcon: p.products?.icon || '🎁',
      quantity: p.quantity,
      totalPrice: p.price || p.total_price || 0,
      status: p.status,
      createdAt: p.created_at
    }))
  },
  
  // 購買商品
  purchaseProduct: async (userId, productId) => {
    // 查詢商品
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()
    
    if (!product) {
      throw new Error('商品不存在')
    }
    
    // 查詢用戶
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!user) {
      throw new Error('用戶不存在')
    }
    
    if (user.points < product.price) {
      throw new Error('點數不足')
    }
    
    // 扣除點數
    const newPoints = user.points - product.price
    await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId)
    
    // 建立購買記錄
    const { data: purchase, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: productId,
        price: product.price,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Purchase error:', error)
      throw error
    }
    
    // 新增交易記錄
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'spend',
        amount: product.price,
        source: 'purchase',
        source_id: purchase.id,
        description: `兌換商品：${product.name}`
      })
    
    return {
      id: purchase.id,
      userId: userId,
      userName: user.name,
      productId: productId,
      productName: product.name,
      icon: product.icon,
      price: product.price,
      status: purchase.status,
      createdAt: purchase.created_at
    }
  },
  
  // 取得願望清單
  getWishes: async (userId = null) => {
    let query = supabase
      .from('wishes')
      .select(`
        *,
        users!wishes_user_id_fkey (
          name
        )
      `)
      .order('created_at', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Get wishes error:', error)
      return []
    }
    
    // 展平資料結構
    return data.map(wish => ({
      ...wish,
      user_name: wish.users?.name || '未知用戶'
    }))
  },
  
  // 核准願望
  approveWish: async (wishId) => {
    const { error } = await supabase
      .from('wishes')
      .update({ status: 'approved' })
      .eq('id', wishId)
    
    if (error) {
      console.error('Approve wish error:', error)
      throw error
    }
    
    return true
  },
  
  // 拒絕願望
  rejectWish: async (wishId, reason) => {
    const { error } = await supabase
      .from('wishes')
      .update({ 
        status: 'rejected',
        reject_reason: reason 
      })
      .eq('id', wishId)
    
    if (error) {
      console.error('Reject wish error:', error)
      throw error
    }
    
    return true
  },
  
  // 標記購買為已發放
  deliverPurchase: async (purchaseId, deliveredBy) => {
    const { error } = await supabase
      .from('purchases')
      .update({
        status: 'completed'
      })
      .eq('id', purchaseId)
    
    if (error) {
      console.error('Deliver purchase error:', error)
      throw error
    }
    
    return true
  },
  
  // 取消購買
  cancelPurchase: async (purchaseId) => {
    const { error } = await supabase
      .from('purchases')
      .update({ status: 'cancelled' })
      .eq('id', purchaseId)
    
    if (error) {
      console.error('Cancel purchase error:', error)
      throw error
    }
    
    return true
  },
  
  // 新增願望
  addWish: async (userId, productName, description) => {
    const { data, error } = await supabase
      .from('wishes')
      .insert({
        user_id: userId,
        product_name: productName,
        description: description,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Add wish error:', error)
      throw error
    }
    
    return data
  },
  
  // 取得任務申請
  getTaskRequests: async (userId = null) => {
    let query = supabase
      .from('task_requests')
      .select(`
        *,
        user:users!task_requests_user_id_fkey(name, avatar)
      `)
      .order('created_at', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Get task requests error:', error)
      return []
    }
    
    return data.map(req => ({
      id: req.id,
      userId: req.user_id,
      userName: req.user?.name || '未知用戶',
      title: req.title,
      description: req.description,
      points: req.points,
      status: req.status,
      createdAt: req.created_at
    }))
  },
  
  // 新增任務申請
  addTaskRequest: async (userId, title, points, description) => {
    const { data, error } = await supabase
      .from('task_requests')
      .insert({
        user_id: userId,
        title: title,
        points: points,
        description: description,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Add task request error:', error)
      throw error
    }
    
    return data
  },
  
  // 取得公告
  getAnnouncements: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('family_id', TEST_FAMILY_ID)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Get announcements error:', error)
      return []
    }
    
    return data
  },
  
  // 新增公告
  addAnnouncement: async (title, content, createdBy) => {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        family_id: TEST_FAMILY_ID,
        title: title,
        content: content,
        created_by: createdBy
      })
      .select()
      .single()
    
    if (error) {
      console.error('Add announcement error:', error)
      throw error
    }
    
    return data
  },
  
  // 刪除公告
  deleteAnnouncement: async (announcementId) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId)
    
    if (error) {
      console.error('Delete announcement error:', error)
      throw error
    }
    
    return true
  },
  
  // 取得交易記錄
  getTransactions: async (userId = null) => {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        users (name, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    
    // 如果有 userId，只查詢該用戶的交易
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Get transactions error:', error)
      return []
    }
    
    return data.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      userName: t.users?.name || '未知用戶',
      userAvatar: t.users?.avatar || '👤',
      timestamp: t.created_at
    }))
  },
  
  // 取得用戶的提交歷史（所有狀態）
  // 獲取所有submissions（用於統計）
  getAllSubmissions: async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, task_id, user_id, created_at, status')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Get all submissions error:', error)
      return []
    }
    
    return data.map(sub => ({
      id: sub.id,
      taskId: sub.task_id,
      userId: sub.user_id,
      timestamp: sub.created_at,
      status: sub.status
    }))
  },

  getUserSubmissions: async (userId) => {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        task:tasks(title, points)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Get user submissions error:', error)
      return []
    }
    
    return data.map(sub => ({
      id: sub.id,
      taskId: sub.task_id,
      taskTitle: sub.task?.title || '未知任務',
      userId: sub.user_id,
      timestamp: sub.created_at,
      status: sub.status,
      photo: sub.photo,
      points: sub.points || sub.task?.points,
      rejectReason: sub.reject_reason
    }))
  },
  
  // 用戶管理 API
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('family_id', TEST_FAMILY_ID)
      .order('role', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Get all users error:', error)
      return []
    }
    
    return data
  },
  
  createUser: async (userData) => {
    // 檢查 PIN 是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name')
      .eq('family_id', TEST_FAMILY_ID)
      .eq('pin', userData.pin)
      .single()
    
    if (existingUser) {
      throw new Error(`PIN 碼 ${userData.pin} 已被「${existingUser.name}」使用，請更換其他 PIN 碼`)
    }
    
    const { error } = await supabase
      .from('users')
      .insert({
        family_id: TEST_FAMILY_ID,
        name: userData.name,
        role: userData.role,
        pin: userData.pin,
        avatar: userData.avatar,
        points: userData.points || 0,
        level: userData.level || 1
      })
    
    if (error) {
      console.error('Create user error:', error)
      throw new Error(`新增用戶失敗: ${error.message || '未知錯誤'}`)
    }
    
    return true
  },
  
  updateUser: async (userId, userData) => {
    // 檢查 PIN 是否被其他用戶使用
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name')
      .eq('family_id', TEST_FAMILY_ID)
      .eq('pin', userData.pin)
      .neq('id', userId)
      .single()
    
    if (existingUser) {
      throw new Error(`PIN 碼 ${userData.pin} 已被「${existingUser.name}」使用，請更換其他 PIN 碼`)
    }
    
    const updateData = {
      name: userData.name,
      role: userData.role,
      pin: userData.pin,
      avatar: userData.avatar
    }
    
    if (userData.role === 'child') {
      updateData.points = userData.points || 0
      updateData.level = userData.level || 1
    }
    
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
    
    if (error) {
      console.error('Update user error:', error)
      throw new Error(`更新用戶失敗: ${error.message || '未知錯誤'}`)
    }
    
    return true
  },
  
  deleteUser: async (userId) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) {
      console.error('Delete user error:', error)
      throw new Error(`刪除用戶失敗: ${error.message || '未知錯誤'}`)
    }
    
    return true
  }
}

// Mock 資料（保留給離線模式）
export const mockData = {
  users: [],
  tasks: [],
  submissions: [],
  transactions: [],
  products: [],
  purchases: []
}
