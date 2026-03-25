import { createClient } from '@supabase/supabase-js'

// 測試環境配置（之後替換成真實的）
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

// Mock mode - 本地開發用
export const MOCK_MODE = true

export const supabase = MOCK_MODE 
  ? null 
  : createClient(supabaseUrl, supabaseKey)

// 初始化用戶數據（只在第一次使用時）
const initUsers = () => {
  const stored = localStorage.getItem('users')
  if (!stored) {
    const defaultUsers = [
      { id: 1, name: '媽媽', role: 'parent', pin: '1234' },
      { id: 2, name: '哥哥', role: 'child', pin: '1111', level: 8, points: 1250 },
      { id: 3, name: '妹妹', role: 'child', pin: '2222', level: 5, points: 850 },
    ]
    localStorage.setItem('users', JSON.stringify(defaultUsers))
    return defaultUsers
  }
  return JSON.parse(stored)
}

// Mock 資料
export const mockData = {
  users: initUsers(),
  tasks: [
    { 
      id: 1, 
      title: '勇者床鋪堡壘', 
      icon: '🛏️',
      points: 5, 
      type: 'daily',
      assignee: [2, 3],
      status: 'active'
    },
    { 
      id: 2, 
      title: '知識圖書館', 
      icon: '📚',
      points: 10, 
      type: 'daily',
      assignee: [2, 3],
      status: 'active',
      progress: 60
    },
    { 
      id: 3, 
      title: '彩虹牙刷挑戰', 
      icon: '🌈',
      points: 50, 
      type: 'longterm',
      assignee: [3],
      status: 'active',
      progress: 66,
      current: 14,
      target: 21
    },
  ],
  submissions: [
    {
      id: 1,
      taskId: 1,
      userId: 3,
      userName: '妹妹',
      userAvatar: '👧',
      timestamp: new Date().toISOString(),
      status: 'pending',
      photo: null
    },
    {
      id: 2,
      taskId: 2,
      userId: 2,
      userName: '哥哥',
      userAvatar: '👦',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'pending',
      photo: null
    },
    {
      id: 3,
      taskId: 3,
      userId: 3,
      userName: '妹妹',
      userAvatar: '👧',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'pending',
      photo: null
    },
  ],
  transactions: [],
  products: [
    { id: 1, name: '巧克力', icon: '🍫', price: 20, category: '零食', description: '美味的巧克力一片' },
    { id: 2, name: '冰淇淋', icon: '🍦', price: 30, category: '零食', description: '任選一球冰淇淋' },
    { id: 3, name: '玩具車', icon: '🚗', price: 100, category: '玩具', description: '迷你遙控車' },
    { id: 4, name: '晚睡半小時', icon: '🌙', price: 50, category: '特權', description: '今晚可以晚睡30分鐘' },
    { id: 5, name: '選電影', icon: '🎬', price: 40, category: '特權', description: '週末選一部電影' },
    { id: 6, name: '遊戲時間', icon: '🎮', price: 60, category: '特權', description: '額外30分鐘遊戲時間' }
  ],
  purchases: []
}

// Mock API
export const mockAPI = {
  login: (pin) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const user = users.find(u => u.pin === pin)
        resolve(user || null)
      }, 500)
    })
  },
  
  updateUserPoints: (userId, newPoints) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, points: newPoints } : u
        )
        localStorage.setItem('users', JSON.stringify(updatedUsers))
        mockData.users = updatedUsers
        resolve(updatedUsers.find(u => u.id === userId))
      }, 100)
    })
  },
  
  getTasks: (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 從 localStorage 讀取任務（如果有的話）
        const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
        const allTasks = storedTasks.length > 0 ? storedTasks : mockData.tasks
        
        const tasks = allTasks.filter(
          t => t.assignee && t.assignee.includes(userId) && t.status === 'active'
        )
        resolve(tasks)
      }, 300)
    })
  },
  
  getAllTasks: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
        const allTasks = storedTasks.length > 0 ? storedTasks : mockData.tasks
        resolve(allTasks)
      }, 300)
    })
  },
  
  saveTask: (taskData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
        const allTasks = storedTasks.length > 0 ? storedTasks : [...mockData.tasks]
        
        if (taskData.id) {
          // 更新現有任務
          const index = allTasks.findIndex(t => t.id === taskData.id)
          if (index !== -1) {
            allTasks[index] = taskData
          }
        } else {
          // 新增任務
          const newTask = {
            ...taskData,
            id: Date.now()
          }
          allTasks.push(newTask)
        }
        
        localStorage.setItem('tasks', JSON.stringify(allTasks))
        resolve(allTasks)
      }, 300)
    })
  },
  
  submitTask: (taskId, userId, photoData = null) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 從 localStorage 讀取最新任務列表
        const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
        const allTasks = storedTasks.length > 0 ? storedTasks : mockData.tasks
        const task = allTasks.find(t => t.id === taskId)
        
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const usersData = users.length > 0 ? users : mockData.users
        const user = usersData.find(u => u.id === userId)
        
        const submission = {
          id: Date.now(),
          taskId,
          taskTitle: task ? task.title : '未知任務',
          userId,
          userName: user ? user.name : '未知用戶',
          userAvatar: user && user.role === 'child' ? (user.name === '哥哥' ? '👦' : '👧') : '👤',
          timestamp: new Date().toISOString(),
          status: 'pending',
          photo: photoData
        }
        
        // 儲存到 localStorage
        const stored = JSON.parse(localStorage.getItem('submissions') || '[]')
        stored.push(submission)
        localStorage.setItem('submissions', JSON.stringify(stored))
        
        mockData.submissions.push(submission)
        resolve(submission)
      }, 500)
    })
  },
  
  getPendingSubmissions: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 從 localStorage 讀取
        const stored = JSON.parse(localStorage.getItem('submissions') || '[]')
        const pending = stored.filter(s => s.status === 'pending')
        resolve(pending)
      }, 300)
    })
  },
  
  approveSubmission: (submissionId, adjustedPoints) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 從 localStorage 更新狀態
        const stored = JSON.parse(localStorage.getItem('submissions') || '[]')
        const submission = stored.find(s => s.id === submissionId)
        
        if (submission) {
          const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
          const allTasks = storedTasks.length > 0 ? storedTasks : mockData.tasks
          const task = allTasks.find(t => t.id === submission.taskId)
          const points = adjustedPoints || (task ? task.points : 10)
          
          submission.status = 'approved'
          submission.approvedAt = new Date().toISOString()
          submission.points = points
          submission.taskTitle = task ? task.title : '任務'
          localStorage.setItem('submissions', JSON.stringify(stored))
          
          // 更新用戶點數
          const users = JSON.parse(localStorage.getItem('users') || '[]')
          const updatedUsers = users.map(u => 
            u.id === submission.userId ? { ...u, points: (u.points || 0) + points } : u
          )
          localStorage.setItem('users', JSON.stringify(updatedUsers))
          mockData.users = updatedUsers
          
          // 更新 currentUser 如果是同一個用戶
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
          if (currentUser.id === submission.userId) {
            currentUser.points = (currentUser.points || 0) + points
            localStorage.setItem('currentUser', JSON.stringify(currentUser))
          }
        }
        resolve(submission)
      }, 500)
    })
  },
  
  rejectSubmission: (submissionId, reason) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 從 localStorage 更新狀態
        const stored = JSON.parse(localStorage.getItem('submissions') || '[]')
        const submission = stored.find(s => s.id === submissionId)
        
        if (submission) {
          submission.status = 'rejected'
          submission.rejectReason = reason
          localStorage.setItem('submissions', JSON.stringify(stored))
        }
        resolve(submission)
      }, 500)
    })
  },

  // 商店相關
  getProducts: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData.products)
      }, 300)
    })
  },

  getPurchases: (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const purchases = JSON.parse(localStorage.getItem('purchases') || '[]')
        const userPurchases = purchases.filter(p => p.userId === userId)
        resolve(userPurchases)
      }, 300)
    })
  },

  purchaseProduct: (userId, productId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const product = mockData.products.find(p => p.id === productId)
        const user = mockData.users.find(u => u.id === userId)

        if (!product || !user) {
          reject(new Error('商品或用戶不存在'))
          return
        }

        if (user.points < product.price) {
          reject(new Error('點數不足'))
          return
        }

        // 扣點數
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, points: u.points - product.price } : u
        )
        localStorage.setItem('users', JSON.stringify(updatedUsers))
        mockData.users = updatedUsers
        
        // 更新 currentUser
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
        if (currentUser.id === userId) {
          currentUser.points -= product.price
          localStorage.setItem('currentUser', JSON.stringify(currentUser))
        }

        // 建立購買記錄
        const purchase = {
          id: Date.now(),
          userId,
          userName: user.name,
          productId: product.id,
          productName: product.name,
          icon: product.icon,
          price: product.price,
          status: 'pending', // pending / delivered
          createdAt: new Date().toISOString()
        }

        // 儲存到 localStorage
        const purchases = JSON.parse(localStorage.getItem('purchases') || '[]')
        purchases.push(purchase)
        localStorage.setItem('purchases', JSON.stringify(purchases))

        // 通知家長（儲存到待處理清單）
        const notifications = JSON.parse(localStorage.getItem('parentNotifications') || '[]')
        notifications.push({
          id: Date.now(),
          type: 'purchase',
          userId,
          userName: user.name,
          productName: product.name,
          icon: product.icon,
          price: product.price,
          timestamp: new Date().toISOString(),
          read: false
        })
        localStorage.setItem('parentNotifications', JSON.stringify(notifications))

        resolve(purchase)
      }, 500)
    })
  }
}
