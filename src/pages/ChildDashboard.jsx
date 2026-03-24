import { useState, useEffect } from 'react'
import { mockAPI } from '../lib/supabase'

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
    setSelectedTask(task)
    setShowCamera(true)
  }

  const handlePhotoSubmit = async (photoData) => {
    console.log('開始提交任務...', { taskId: selectedTask?.id, userId: user?.id, hasPhoto: !!photoData })
    
    if (!photoData) {
      alert('⚠️ 請先選擇照片')
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

  // 按時段分類任務
  const getTasksByTime = () => {
    return {
      morning: tasks.filter(t => t.id === 1), // 床鋪
      afternoon: tasks.filter(t => t.id === 2), // 作業
      evening: tasks.filter(t => t.id === 3) // 牙刷挑戰
    }
  }

  const tasksByTime = getTasksByTime()
  const totalTasks = tasks.length
  const completedTasks = 0

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
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '0.75rem 1.5rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '2px solid #d8b4fe'
          }}>
            <div style={{ color: '#9333ea', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Point Bank</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#581c87', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.points}
              <span style={{ fontSize: '32px', animation: 'bounce 1s infinite' }}>💰</span>
            </div>
          </div>
        </div>

        {/* 中央進度環 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-block',
            background: 'white',
            borderRadius: '50%',
            padding: '1.5rem',
            boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
            border: '4px solid #d8b4fe'
          }}>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#581c87' }}>
              {completedTasks}/{totalTasks}
            </div>
            <div style={{ color: '#9333ea', fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
              今日完成
            </div>
          </div>
        </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '5rem' }}>
            {/* Morning Card */}
            {tasksByTime.morning.length > 0 && (
              <TaskCard
                title="Morning"
                subtitle="勇者床鋪堡壘"
                icon="🛏️"
                task={tasksByTime.morning[0]}
                onComplete={handleComplete}
              />
            )}

            {/* Afternoon Card */}
            {tasksByTime.afternoon.length > 0 && (
              <TaskCard
                title="Afternoon"
                subtitle="知識圖書館"
                icon="📚"
                task={tasksByTime.afternoon[0]}
                onComplete={handleComplete}
              />
            )}

            {/* Evening Challenge Card */}
            {tasksByTime.evening.length > 0 && (
              <TaskCard
                title="Challenge"
                subtitle="彩虹牙刷挑戰"
                icon="🌈"
                task={tasksByTime.evening[0]}
                onComplete={handleComplete}
              />
            )}
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
            <NavIcon icon="🎁" label="商店" />
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
function TaskCard({ title, subtitle, icon, task, onComplete }) {
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
        {icon}
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
          <div style={{ fontSize: '50px', flexShrink: 0 }}>{icon}</div>

          {/* 中間內容 */}
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#581c87', fontSize: '18px', fontWeight: '900', marginBottom: '0.5rem', lineHeight: '1.2' }}>
              {subtitle}
            </h3>
            
            {/* 進度條 */}
            {task.progress !== undefined && (
              <div style={{
                background: 'rgba(168, 85, 247, 0.2)',
                borderRadius: '0.5rem',
                height: '8px',
                marginBottom: '0.5rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'linear-gradient(to right, #a78bfa, #8b5cf6)',
                  height: '100%',
                  borderRadius: '0.5rem',
                  width: `${task.progress}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            )}

            {/* 進度文字 + 獎勵標籤 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {task.current && (
                <div style={{ color: '#7e22ce', fontSize: '12px', fontWeight: '600' }}>
                  {task.current}/{task.target}天
                </div>
              )}
              
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.75rem'
              }}>
                <span style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>
                  {task.points} pts 🎁
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 完成按鈕 */}
        <button
          onClick={() => onComplete(task.id)}
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
      alert('請先拍照或選擇照片')
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
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
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
        padding: '1rem',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '0.5rem' }}>{task.icon}</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{task.title}</div>
      </div>

      {/* 照片預覽區 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflow: 'hidden'
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
            <div>點擊下方按鈕選擇照片</div>
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* 選擇/重拍按鈕 */}
        <div style={{ display: 'flex', gap: '1rem' }}>
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
              flex: 1,
              background: 'linear-gradient(to right, #3b82f6, #2563eb)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '1rem',
              borderRadius: '1rem',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'block'
            }}
          >
            {photo ? '📷 重新拍照' : '📷 開啟相機'}
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="gallery-input"
          />
          <label
            htmlFor="gallery-input"
            style={{
              flex: 1,
              background: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '1rem',
              borderRadius: '1rem',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'block'
            }}
          >
            🖼️ 選擇照片
          </label>
        </div>

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
            fontSize: '18px',
            padding: '1rem',
            borderRadius: '1rem',
            border: 'none',
            cursor: photo ? 'pointer' : 'not-allowed',
            boxShadow: photo 
              ? '0 10px 30px rgba(16, 185, 129, 0.4)' 
              : 'none',
            opacity: photo ? 1 : 0.6
          }}
        >
          ✅ 提交任務
        </button>
      </div>
    </div>
  )
}
