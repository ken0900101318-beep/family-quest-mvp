import { useState, useEffect } from 'react'
import { mockAPI } from '../lib/supabase'
import { useToast } from './Toast'

// 兒童端公告欄（只讀）
export function AnnouncementCard() {
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    const data = await mockAPI.getAnnouncements()
    // 只顯示最新 3 則
    setAnnouncements(data.slice(0, 3))
  }

  if (announcements.length === 0) {
    return null // 沒有公告就不顯示
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1.25rem',
      padding: '1.25rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      border: '2px solid rgba(255, 255, 255, 0.9)',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '24px' }}>📢</span>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#581c87',
          margin: 0
        }}>
          重要公告
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {announcements.map(announcement => (
          <div
            key={announcement.id}
            style={{
              background: 'rgba(168, 85, 247, 0.08)',
              borderRadius: '0.875rem',
              padding: '0.875rem',
              border: '1.5px solid #e9d5ff'
            }}
          >
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#7e22ce',
              marginBottom: '0.375rem'
            }}>
              {announcement.title}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#9333ea',
              lineHeight: '1.4'
            }}>
              {announcement.content}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#a78bfa',
              marginTop: '0.375rem'
            }}>
              {new Date(announcement.createdAt).toLocaleDateString('zh-TW')}
            </div>
          </div>
        ))}
      </div>

      {/* Toast 通知 */}
      <ToastContainer />
    </div>
  )
}

// 家長端公告管理
export function AnnouncementManager({ userId }) {
  const [announcements, setAnnouncements] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', content: '' })
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    const data = await mockAPI.getAnnouncements()
    setAnnouncements(data)
  }

  const handleAdd = async () => {
    if (!formData.title || !formData.content) {
      showToast('請填寫標題和內容', 'warning')
      return
    }

    try {
      await mockAPI.addAnnouncement(
        formData.title,
        formData.content,
        userId
      )
      setFormData({ title: '', content: '' })
      setShowForm(false)
      showToast('公告已發布！', 'success')
      loadAnnouncements()
    } catch (error) {
      showToast('發布失敗', 'error')
      console.error(error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除這則公告嗎？')) return

    try {
      await mockAPI.deleteAnnouncement(id)
      showToast('公告已刪除', 'success')
      loadAnnouncements()
    } catch (error) {
      showToast('刪除失敗', 'error')
      console.error(error)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#581c87' }}>
          📢 公告管理
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
          }}
        >
          {showForm ? '✕ 取消' : '✨ 新增公告'}
        </button>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <div style={{
          background: 'rgba(168, 85, 247, 0.05)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '2px solid #e9d5ff'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem' }}>
              公告標題
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例：本週任務獎勵加碼"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #e9d5ff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem' }}>
              公告內容
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="輸入公告內容..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #e9d5ff',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
          <button
            onClick={handleAdd}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '15px',
              padding: '0.875rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            ✅ 發布公告
          </button>
        </div>
      )}

      {/* 公告列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {announcements.length === 0 ? (
          <div style={{
            background: 'rgba(168, 85, 247, 0.05)',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            border: '2px dashed #d8b4fe'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '0.5rem' }}>📢</div>
            <div style={{ fontSize: '16px', color: '#7e22ce' }}>
              還沒有公告，點上方按鈕新增
            </div>
          </div>
        ) : (
          announcements.map(announcement => (
            <div
              key={announcement.id}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '2px solid #f3e8ff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#581c87', margin: 0 }}>
                  {announcement.title}
                </h4>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  🗑️ 刪除
                </button>
              </div>
              <div style={{ fontSize: '14px', color: '#7e22ce', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                {announcement.content}
              </div>
              <div style={{ fontSize: '12px', color: '#a78bfa' }}>
                發布時間：{new Date(announcement.createdAt).toLocaleString('zh-TW')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
