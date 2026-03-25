import { useState, useEffect } from 'react'
import { mockAPI } from '../lib/supabase'
import { AnnouncementCard } from '../components/Announcements'

export default function ChildDashboard({ user, onLogout, onNavigate }) {
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
      // 先關閉相機界面
      setShowCamera(false)
      
      const result = await mockAPI.submitTask(selectedTask.id, user.id, photoData)
      console.log('提交成功:', result)
      
      // 延遲顯示成功訊息
      setTimeout(() => {
        alert('✅ 任務已提交成功！\n等待家長審核中...')
      }, 300)
      
      setSelectedTask(null)
      loadTasks() // 重新載入任務列表
    } catch (err) {
      console.error('提交失敗:', err)
      alert('❌ 提交失敗：' + (err.message || '請稍後再試'))
      setShowCamera(false)
      setSelectedTask(null)
    }
  }

  const totalTasks = tasks.length
  
  // 計算今日完成數量（從 localStorage.submissions 讀取）
  const getCompletedToday = () => {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]')
    const today = new Date().toISOString().split('T')[0]
    return submissions.filter(s => 
      s.userId === user.id && 
      s.status === 'approved' &&
      s.timestamp.startsWith(today)
    ).length
  }
  
  const completedTasks = getCompletedToday()
  
  // 檢查任務狀態（今日）
  const getTaskStatus = (taskId) => {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]')
    const today = new Date().toISOString().split('T')[0]
    const todaySubmission = submissions.find(s => 
      s.userId === user.id && 
      s.taskId === taskId &&
      s.timestamp.startsWith(today)
    )
    
    if (!todaySubmission) return 'notStarted' // 未完成
    if (todaySubmission.status === 'approved') return 'completed' // 已完成
    if (todaySubmission.status === 'pending') return 'pending' // 待審核
    return 'notStarted'
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      padding: '1rem'
    }}>
      {/* 樂園背景圖片 */}
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
      
      {/* 半透明遮罩（讓文字更清楚） */}
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
        {/* 頂部資訊欄 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          {/* 左側：頭像+等級 */}
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

          {/* 右側：Point Bank */}
          <div
            onClick={() => onNavigate && onNavigate('passbook')}
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
            {/* 進度文字 */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#581c87' }}>
                🚀 今日任務進度
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#8b5cf6', marginTop: '0.5rem' }}>
                {completedTasks}/{totalTasks}
              </div>
            </div>
            
            {/* 火箭進度條軌道 */}
            <div style={{
              position: 'relative',
              height: '60px',
              background: 'linear-gradient(to right, #f3e8ff, #e9d5ff)',
              borderRadius: '30px',
              overflow: 'visible',
              border: '3px solid #d8b4fe'
            }}>
              {/* 進度填充 */}
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
              
              {/* 火箭 */}
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
              
              {/* 終點星星 */}
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
            
            {/* 完成提示 */}
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

        {/* 公告欄 */}
        <AnnouncementCard />

        {/* 標題 */}
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

        {/* 底部導覽 */}
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
            <NavIcon icon="🏠" label="首頁" active />
            <NavIcon icon="🏛️" label="廣場" onClick={() => onNavigate && onNavigate('square')} />
            <NavIcon icon="🎁" label="商店" onClick={() => onNavigate && onNavigate('shop')} />
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

      {/* 拍照界面 */}
      {showCamera && (
        <CameraModal
          task={selectedTask}
          onSubmit={handlePhotoSubmit}
          onClose={() => { setShowCamera(false); setSelectedTask(null); }}
        />
      )}

      {/* CSS 動畫 */}
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
    </div>
  )
}

// 任務卡片組件
// 首頁任務卡片（簡化版：只顯示狀態，無按鈕）
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
      {/* 主要內容 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
        {/* 左側：圖示 + 內容 */}
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

        {/* 右側：狀態小標籤 */}
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

function TaskCard({ title, task, onComplete }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '1rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      border: '2px solid rgba(255, 255, 255, 0.9)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 裝飾性圖示背景 */}
      <div style={{
        position: 'absolute',
        right: '-20px',
        bottom: '-20px',
        fontSize: '80px',
        opacity: 0.08
      }}>
        {task.icon}
      </div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* 頂部標籤 */}
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
          padding: '0.15rem 0.75rem',
          borderRadius: '0.75rem',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '0.5rem'
        }}>
          {title}
        </div>

        {/* 主要內容 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* 左側圖示 */}
          <div style={{ fontSize: '50px', flexShrink: 0 }}>{task.icon}</div>

          {/* 中間內容 */}
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#581c87', fontSize: '18px', fontWeight: '900', marginBottom: '0.5rem', lineHeight: '1.2' }}>
              {task.title}
            </h3>
            
            {/* 獎勵標籤 */}
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>
                {task.points} pts 🎁
              </span>
            </div>
          </div>
        </div>

        {/* 完成按鈕 */}
        <button
          onClick={() => onComplete(task)}
          style={{
            width: '100%',
            marginTop: '0.75rem',
            background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
            color: 'white',
            fontWeight: '900',
            fontSize: '16px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: '2px solid #fcd34d',
            boxShadow: '0 6px 20px rgba(251, 191, 36, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.02)'
            e.target.style.boxShadow = '0 8px 25px rgba(251, 191, 36, 0.6)'
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)'
            e.target.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.4)'
          }}
        >
          我完成了！✨
        </button>
      </div>
    </div>
  )
}

// 導覽圖示組件
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

// 相機模態框組件
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
      {/* 頂部標題 */}
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

      {/* 任務資訊 */}
      <div style={{
        background: 'rgba(168, 85, 247, 0.3)',
        padding: '0.75rem',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '0.25rem' }}>{task.icon}</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{task.title}</div>
      </div>

      {/* 照片預覽區 */}
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

      {/* 底部操作 */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {/* 拍照按鈕（單一） */}
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

        {/* 提交按鈕 */}
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
