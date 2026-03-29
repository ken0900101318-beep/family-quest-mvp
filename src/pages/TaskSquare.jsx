import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockAPI } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function TaskSquare({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('ongoing')
  const [tasks, setTasks] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  
  // 拍照相關 state
  const [cameraOpen, setCameraOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  
  // Toast
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    try {
      // 並行載入所有數據（更快！）
      const [userTasks, taskRequests, submissions] = await Promise.all([
        mockAPI.getTasks(user.id),
        mockAPI.getTaskRequests(user.id),
        mockAPI.getUserSubmissions(user.id)
      ])
      
      setTasks(userTasks)
      setMyRequests(taskRequests)
      
      const historyRecords = submissions.map(sub => ({
        id: sub.id,
        title: sub.taskTitle,
        points: sub.points,
        status: sub.status === 'approved' ? 'completed' : sub.status,
        completedAt: sub.status === 'approved' ? sub.timestamp?.split('T')[0] : null,
        updatedAt: sub.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
        rejectReason: sub.rejectReason
      }))
      
      setHistory(historyRecords)
    } catch (error) {
      console.error('載入失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestTask = async (taskData) => {
    try {
      await mockAPI.addTaskRequest(
        user.id,
        taskData.title,
        parseInt(taskData.points),
        taskData.description
      )
      
      showToast('任務申請已送出！等待家長審核', 'success')
      setShowRequestForm(false)
      setActiveTab('myRequests')
      
      // 重新載入數據
      loadData()
    } catch (error) {
      showToast('申請失敗，請稍後再試', 'error')
      console.error(error)
    }
  }

  // 開啟拍照
  const openCamera = (task) => {
    console.log('📝 選擇任務:', task.title, '狀態:', task.todayStatus)
    
    // ✅ 檢查今日狀態 - 直接阻止
    if (task.todayStatus === 'pending') {
      showToast('⏰ 任務已提交，請等待家長審核！', 'warning')
      return
    }
    
    if (task.todayStatus === 'approved') {
      showToast('🎉 今日已完成，明天再來挑戰吧！', 'success')
      return
    }
    
    // 如果是 rejected，顯示退回原因後繼續
    if (task.todayStatus === 'rejected' && task.rejectReason) {
      const retry = confirm(`❌ 任務被退回\n原因：${task.rejectReason}\n\n要重新挑戰嗎？`)
      if (!retry) return
    }
    
    console.log('✅ 狀態檢查通過，開啟相機')
    setCurrentTask(task)
    setCapturedPhoto(null)
    setCameraOpen(true)
  }

  // 選擇照片
  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCapturedPhoto(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // 提交任務
  const submitTask = async () => {
    if (!capturedPhoto) {
      showToast('請先拍照', 'warning')
      return
    }
    
    try {
      await mockAPI.submitTask(currentTask.id, user.id, capturedPhoto)
      showToast('任務已提交！等待家長審核', 'success')
      setCameraOpen(false)
      setCurrentTask(null)
      setCapturedPhoto(null)
      loadData()
    } catch (err) {
      showToast('提交失敗，請稍後再試', 'error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'auto',
      paddingBottom: '100px'
    }}>
      {/* 背景 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/playground-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 0
      }} />
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom, rgba(216, 180, 254, 0.3), rgba(233, 213, 255, 0.2))',
        zIndex: 1
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10, padding: '1rem' }}>
        {/* 頂部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#581c87' }}>
            🏛️ 任務廣場
          </h1>
          <button 
            type="button"
            onClick={() => navigate('/child')} 
            style={{
              background: 'white',
              color: '#7e22ce',
              border: '2px solid #d8b4fe',
              borderRadius: '0.75rem',
              padding: '0.5rem 1rem',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
            ← 返回
          </button>
        </div>

        {/* 分頁 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <TabButton active={activeTab === 'ongoing'} onClick={() => setActiveTab('ongoing')} label="進行中" />
          <TabButton active={activeTab === 'myRequests'} onClick={() => setActiveTab('myRequests')} label="我的申請" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="歷史記錄" />
        </div>

        {/* 內容 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>載入中...</div>
        ) : (
          <>
            {activeTab === 'ongoing' && (
              <div>
                <button
                  onClick={() => setShowRequestForm(true)}
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                  {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onComplete={openCamera} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'myRequests' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {myRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>尚無申請記錄</div>
                ) : (
                  myRequests.map(request => <RequestCard key={request.id} request={request} />)
                )}
              </div>
            )}

            {activeTab === 'history' && <HistoryView history={history} />}
          </>
        )}
      </div>

      {/* 拍照界面 - 絕對簡單版 */}
      {cameraOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            width: '100%',
            maxWidth: '600px',
            borderRadius: '1.5rem 1.5rem 0 0',
            padding: '1.5rem',
            maxHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {/* 標題 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '32px' }}>{currentTask?.icon}</span>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', margin: 0 }}>
                  {currentTask?.title}
                </h3>
              </div>
              <button
                onClick={() => setCameraOpen(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            </div>

            {/* 照片預覽 */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
              borderRadius: '0.75rem',
              minHeight: '150px',
              overflow: 'hidden'
            }}>
              {capturedPhoto ? (
                <img src={capturedPhoto} alt="預覽" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '0.5rem' }}>📷</div>
                  <div style={{ fontSize: '14px' }}>點下方按鈕開啟相機</div>
                </div>
              )}
            </div>

            {/* 按鈕容器 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                style={{ display: 'none' }}
                id="camera-input-simple"
              />
              <label
                htmlFor="camera-input-simple"
                style={{
                  display: 'block',
                  minWidth: '180px',
                  background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {capturedPhoto ? '📷 重新拍照' : '📷 開啟相機'}
              </label>

              <button
                onClick={submitTask}
                disabled={!capturedPhoto}
                style={{
                  minWidth: '180px',
                  background: capturedPhoto ? 'linear-gradient(to right, #10b981, #059669)' : '#e5e7eb',
                  color: capturedPhoto ? 'white' : '#9ca3af',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: capturedPhoto ? 'pointer' : 'not-allowed',
                  boxSizing: 'border-box'
                }}
              >
                ✅ 提交任務
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 申請表單 */}
      {showRequestForm && (
        <RequestForm onSubmit={handleRequestTask} onClose={() => setShowRequestForm(false)} />
      )}

      {/* Toast 通知 */}
      <ToastContainer />

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)' : 'white',
        color: active ? 'white' : '#7e22ce',
        fontWeight: 'bold',
        fontSize: '14px',
        padding: '0.75rem',
        borderRadius: '0.75rem',
        border: active ? 'none' : '2px solid #e9d5ff',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  )
}

function TaskCard({ task, onComplete }) {
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
        onClick={() => onComplete(task)}
        disabled={task.todayStatus === 'pending' || task.todayStatus === 'approved'}
        style={{
          width: '100%',
          background: task.todayStatus === 'pending' 
            ? '#f59e0b'
            : task.todayStatus === 'approved'
            ? '#10b981'
            : 'linear-gradient(to right, #a78bfa, #8b5cf6)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          cursor: task.todayStatus === 'pending' || task.todayStatus === 'approved' ? 'not-allowed' : 'pointer',
          opacity: task.todayStatus === 'pending' || task.todayStatus === 'approved' ? 0.7 : 1
        }}
      >
        {task.todayStatus === 'pending' 
          ? '已提交，等待審核 ⏰'
          : task.todayStatus === 'approved'
          ? '今日已達成 🎉'
          : task.todayStatus === 'rejected'
          ? '重新挑戰（被退回）❌'
          : '我完成了！✨'}
      </button>
    </div>
  )
}

function RequestCard({ request }) {
  const statusConfig = {
    pending: { label: '待審核', color: '#f59e0b', bg: 'rgba(251, 191, 36, 0.2)' },
    approved: { label: '已核准', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
    rejected: { label: '已拒絕', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' }
  }
  const config = statusConfig[request.status]

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '1rem',
      padding: '1rem',
      border: '2px solid #e9d5ff'
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#581c87', marginBottom: '0.5rem' }}>
        {request.title}
      </h3>
      <div style={{ fontSize: '14px', color: '#7e22ce', marginBottom: '0.5rem' }}>
        {request.points} pts
      </div>
      <div style={{
        display: 'inline-block',
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
  )
}

function HistoryView({ history }) {
  const [timeRange, setTimeRange] = useState('week')
  
  const filtered = history.filter(h => {
    if (timeRange === 'all') return true
    const days = timeRange === 'week' ? 7 : 30
    const date = new Date(h.updatedAt)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return date >= cutoff
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['week', 'month', 'all'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              background: timeRange === range ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)' : 'white',
              color: timeRange === range ? 'white' : '#7e22ce',
              border: timeRange === range ? 'none' : '2px solid #e9d5ff',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {range === 'week' ? '近7天' : range === 'month' ? '近30天' : '全部'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7e22ce' }}>
          暫無歷史記錄
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(item => (
            <div key={item.id} style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '1rem',
              padding: '1rem',
              border: '2px solid #e9d5ff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#581c87', marginBottom: '0.25rem' }}>
                    {item.title}
                  </h4>
                  <div style={{ fontSize: '13px', color: '#7e22ce' }}>
                    {item.points} pts · {item.updatedAt}
                  </div>
                </div>
                <div style={{
                  background: item.status === 'completed' ? '#10b981' : item.status === 'pending' ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {item.status === 'completed' ? '已完成' : item.status === 'pending' ? '待審核' : '已拒絕'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RequestForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({ title: '', points: '', description: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.points) {
      alert('請填寫任務名稱和點數')
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
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#581c87', marginBottom: '1.5rem' }}>
          ✨ 申請新任務
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#7e22ce', marginBottom: '0.5rem' }}>
              任務名稱
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例：幫忙洗碗"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #e9d5ff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#7e22ce', marginBottom: '0.5rem' }}>
              希望獲得點數
            </label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              placeholder="10"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #e9d5ff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#7e22ce', marginBottom: '0.5rem' }}>
              說明（選填）
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述一下這個任務..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #e9d5ff',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: '#f3f4f6',
                color: '#6b7280',
                fontWeight: 'bold',
                fontSize: '15px',
                padding: '0.875rem',
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
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '15px',
                padding: '0.875rem',
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
