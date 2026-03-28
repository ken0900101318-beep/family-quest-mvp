import { useState, useEffect } from 'react'
// ✨ 1. 在這裡引入 useNavigate
import { useNavigate } from 'react-router-dom'
import { mockAPI } from '../lib/supabase'
import { AnnouncementCard } from '../components/Announcements'
import { useToast } from '../components/Toast'

// ✨ 2. 移除原本的 onNavigate 參數
export default function ChildDashboard({ user, onLogout }) {
  // ✨ 3. 呼叫導航鉤子
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCamera, setShowCamera] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    const userTasks = await mockAPI.getTasks(user.id)
    setTasks(userTasks)
    setLoading(false)
  }

  const handleComplete = async (task) => {
    console.log('選擇任務:', task)
    if (!task || !task.id) {
      alert('❌ 任務資料錯誤')
      return
    }
    setSelectedTask(task)
    setShowCamera(true)
  }

  const handlePhotoSubmit = async (photoData) => {
    console.log('開始提交任務...', { 
      selectedTask,
      taskId: selectedTask?.id, 
      userId: user?.id, 
      hasPhoto: !!photoData 
    })
    
    if (!photoData) {
      alert('⚠️ 請先拍照')
      return
    }
    
    if (!selectedTask || !selectedTask.id) {
      alert('❌ 任務資料錯誤，請重新選擇')
      setShowCamera(false)
      return
    }
    
    try {
      setShowCamera(false)
      
      const result = await mockAPI.submitTask(selectedTask.id, user.id, photoData)
      console.log('提交成功:', result)
      
      setTimeout(() => {
        alert('✅ 任務已提交成功！\n等待家長審核中...')
      }, 300)
      
      setSelectedTask(null)
      loadTasks() 
    } catch (err) {
      console.error('提交失敗:', err)
      alert('❌ 提交失敗：' + (err.message || '請稍後再試'))
      setShowCamera(false)
      setSelectedTask(null)
    }
  }

  const totalTasks = tasks.length
  const [completedTasks, setCompletedTasks] = useState(0)
  const [taskStatuses, setTaskStatuses] = useState({})
  
  // 載入今日完成數量和任務狀態
  useEffect(() => {
    const loadTodayStats = async () => {
      const submissions = await mockAPI.getUserSubmissions(user.id)
      const today = new Date().toISOString().split('T')[0]
      
      const todayCompleted = submissions.filter(s => 
        s.status === 'approved' &&
        s.timestamp.startsWith(today)
      ).length
      setCompletedTasks(todayCompleted)
      
      const statuses = {}
      for (const task of tasks) {
        const todaySubmission = submissions.find(s => 
          s.taskId === task.id &&
          s.timestamp.startsWith(today)
        )
        
        if (!todaySubmission) {
          statuses[task.id] = 'notStarted'
        } else if (todaySubmission.status === 'approved') {
          statuses[task.id] = 'completed'
        } else if (todaySubmission.status === 'pending') {
          statuses[task.id] = 'pending'
        } else {
          statuses[task.id] = 'notStarted'
        }
      }
      setTaskStatuses(statuses)
    }
    
    if (tasks.length > 0) {
      loadTodayStats()
    }
  }, [tasks, user.id])
  
  const getTaskStatus = (taskId) => {
    return taskStatuses[taskId] || 'notStarted'
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      padding: '1rem'
    }}>
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
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom, rgba(216, 180, 254, 0.3), rgba(233, 213, 255, 0.2))',
        zIndex: 1
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10, paddingBottom: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f472b6, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '50px',
              border: '4px solid white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              {user.name === '哥哥' ? '👦' : '👧'}
            </div>
            <div>
              <div style={{ color: '#581c87', fontWeight: 'bold', fontSize: '18px' }}>{user.name}</div>
              <div style={{ color: '#7e22ce', fontSize: '14px' }}>Lv.{user.level} 冒險家</div>
            </div>
          </div>

          <div
            // ✨ 4. 直接使用 navigate 導向存摺頁面
            onClick={() => navigate('/child/passbook')}
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '0.75rem 1.5rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              border: '2px solid #d8b4fe',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.2)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)'
            }}
          >
            <div style={{ color: '#9333ea', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Point Bank</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#581c87', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.points}
              <span style={{ fontSize: '32px', animation: 'bounce 1s infinite' }}>💰</span>
            </div>
            <div style={{ fontSize: '10px', color: '#9333ea', marginTop: '4px', textAlign: 'center' }}>點擊查看存摺</div>
          </div>
        </div>

        {/* 火箭進度條 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
            border: '3px solid #d8b4fe',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#581c87' }}>
                🚀 今日任務進度
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#8b5cf6', marginTop: '0.5rem' }}>
                {completedTasks}/{totalTasks}
              </div>
            </div>
            
            <div style={{
              position: 'relative',
              height: '60px',
              background: 'linear-gradient(to right, #f3e8ff, #e9d5ff)',
              borderRadius: '30px',
              overflow: 'visible',
              border: '3px solid #d8b4fe'
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%',
                background: 'linear-gradient(to right, #a78bfa, #8b5cf6)',
                borderRadius: '30px',
                transition: 'width 0.5s ease',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
              }} />
              
              <div style={{
                position: 'absolute',
                left: totalTasks > 0 ? `calc(${(completedTasks / totalTasks) * 100}% - 30px)` : '-30px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '40px',
                transition: 'left 0.5s ease',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                zIndex: 10
              }}>
                🚀
              </div>
              
              <div style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '30px',
                animation: completedTasks === totalTasks && totalTasks > 0 ? 'bounce 0.5s infinite' : 'none'
              }}>
                ⭐
              </div>
            </div>
            
            {completedTasks === totalTasks && totalTasks > 0 && (
              <div style={{
                marginTop: '1rem',
                color: '#10b981',
                fontWeight: 'bold',
                fontSize: '18px',
                animation: 'bounce 1s infinite'
              }}>
                🎉 全部完成！太棒了！
              </div>
            )}
          </div>
        </div>

        <AnnouncementCard />

        <h2 style={{
          fontSize: '32px',
          fontWeight: '900',
          color: '#581c87',
          marginBottom: '1.5rem',
          textAlign: 'center',
          textShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          🌟 我的今日冒險
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#7e22ce', fontSize: '20px' }}>載入中...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '5rem' }}>
            {tasks.map(task => (
              <HomeTaskCard
                key={task.id}
                task={task}
                status={getTaskStatus(task.id)}
              />
            ))}
          </div>
        )}

        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderTop: '4px solid #d8b4fe',
          boxShadow: '0 -5px 30px rgba(0,0,0,0.15)',
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '1rem'
          }}>
            {/* ✨ 5. 直接使用 navigate 導向各個頁面 */}
            <NavIcon icon="🏠" label="首頁" active />
            <NavIcon icon="🏛️" label="廣場" onClick={() => navigate('/child/square')} />
            <NavIcon icon="🎁" label="商店" onClick={() => navigate('/child/shop')} />
            <button onClick={onLogout} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: 0.7
            }}>
              <div style={{ fontSize: '32px' }}>🚪</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>登出</div>
            </button>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraModal
          task={selectedTask}
          onSubmit={handlePhotoSubmit}
          onClose={() => { setShowCamera(false); setSelectedTask(null); }}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      <ToastContainer />
    </div>
  )
}

function HomeTaskCard({ task, status }) {
  const statusConfig = {
    notStarted: { label: '未完成', color: '#9ca3af' },
    pending: { label: '待審核', color: '#f59e0b' },
    completed: { label: '已完成', color: '#10b981' }
  }
  const config = statusConfig[status] || statusConfig.notStarted
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '0.75rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      border: '2px solid rgba(255, 255, 255, 0.9)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <div style={{ fontSize: '32px' }}>{task.icon}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#581c87', fontSize: '14px', fontWeight: '900', marginBottom: '0.25rem' }}>
              {task.title}
            </h3>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              padding: '0.15rem 0.5rem',
              borderRadius: '0.5rem'
            }}>
              <span style={{ color: 'white', fontWeight: '900', fontSize: '11px' }}>
                {task.points} pts 🎁
              </span>
            </div>
          </div>
        </div>
        <div style={{
          background: config.color,
          color: 'white',
          fontWeight: '600',
          fontSize: '11px',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {config.label}
        </div>
      </div>
    </div>
  )
}

function NavIcon({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      opacity: active ? 1 : 0.5,
      transition: 'opacity 0.3s ease'
    }}>
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{label}</div>
    </button>
  )
}

function CameraModal({ task, onSubmit, onClose }) {
  const [photo, setPhoto] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (!photo) {
      alert('請先拍照')
      return
    }
    onSubmit(photo)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#1f2937',
        borderRadius: '1.5rem',
        maxWidth: '400px',
        width: '100%',
        maxHeight: '40vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            📸 拍攝任務成果
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          background: 'rgba(168, 85, 247, 0.3)',
          padding: '0.75rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '0.25rem' }}>{task.icon}</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{task.title}</div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflow: 'hidden',
          maxHeight: '50vh'
        }}>
          {photo ? (
            <img
              src={photo}
              alt="預覽"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '1rem',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '18px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '80px', marginBottom: '1rem' }}>📷</div>
              <div>點擊下方按鈕開啟相機</div>
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="camera-input"
          />
          <label
            htmlFor="camera-input"
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #3b82f6, #2563eb)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'block',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'
            }}
          >
            {photo ? '📷 重新拍照' : '📷 開啟相機'}
          </label>

          <button
            onClick={handleSubmit}
            disabled={!photo}
            style={{
              width: '100%',
              background: photo 
                ? 'linear-gradient(to right, #10b981, #059669)' 
                : 'linear-gradient(to right, #9ca3af, #6b7280)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: photo ? 'pointer' : 'not-allowed',
              boxShadow: photo 
                ? '0 6px 20px rgba(16, 185, 129, 0.4)' 
                : 'none',
              opacity: photo ? 1 : 0.6
            }}
          >
            ✅ 提交任務
          </button>
        </div>
      </div>
    </div>
  )
}
