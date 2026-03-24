import { createClient } from '@supabase/supabase-js'

// 測試環境配置（之後替換成真實的）
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

// Mock mode - 本地開發用
export const MOCK_MODE = true

export const supabase = MOCK_MODE 
  ? null 
  : createClient(supabaseUrl, supabaseKey)

// Mock 資料
export const mockData = {
  users: [
    { id: 1, name: '媽媽', role: 'parent', pin: '1234' },
    { id: 2, name: '哥哥', role: 'child', pin: '1111', level: 8, points: 1250 },
    { id: 3, name: '妹妹', role: 'child', pin: '2222', level: 5, points: 850 },
  ],
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
        const user = mockData.users.find(u => u.pin === pin)
        resolve(user || null)
      }, 500)
    })
  },
  
  getTasks: (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = mockData.tasks.filter(
          t => t.assignee.includes(userId)
        )
        resolve(tasks)
      }, 300)
    })
  },
  
  submitTask: (taskId, userId, photoData = null) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const task = mockData.tasks.find(t => t.id === taskId)
        const user = mockData.users.find(u => u.id === userId)
        
        const submission = {
          id: Date.now(),
          taskId,
          userId,
          userName: user.name,
          userAvatar: user.role === 'child' ? (user.name === '哥哥' ? '👦' : '👧') : '👤',
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
          submission.status = 'approved'
          localStorage.setItem('submissions', JSON.stringify(stored))
          
          const task = mockData.tasks.find(t => t.id === submission.taskId)
          const points = adjustedPoints || task.points
          
          const user = mockData.users.find(u => u.id === submission.userId)
          user.points += points
          
          mockData.transactions.push({
            id: mockData.transactions.length + 1,
            userId: submission.userId,
            amount: points,
            type: 'earn',
            taskId: submission.taskId,
            timestamp: new Date().toISOString()
          })
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
        user.points -= product.price
        
        // 更新 localStorage 的用戶資料
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
        if (currentUser.id === userId) {
          currentUser.points = user.points
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
