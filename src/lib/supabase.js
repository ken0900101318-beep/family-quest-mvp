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
  transactions: []
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
  }
}
