import { useState } from 'react'
import { mockAPI } from '../lib/supabase'

export default function ReviewHistory({ history, onLoadMore, hasMore, loading }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [loadingPhoto, setLoadingPhoto] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedMember, setSelectedMember] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  
  // ✅ 載入照片
  const handleViewPhoto = async (item) => {
    setLoadingPhoto(true)
    try {
      const photo = await mockAPI.getSubmissionPhoto(item.id)
      setSelectedItem({ ...item, photo })
    } catch (err) {
      console.error('載入照片失敗:', err)
      alert('載入照片失敗，請稍後再試')
    } finally {
      setLoadingPhoto(false)
    }
  }
  
  // 取得所有成員列表
  const members = [...new Set(history.map(item => item.userName))].sort()
  
  // 篩選邏輯
  const filteredHistory = history.filter(item => {
    const matchSearch = searchText === '' || 
      item.taskTitle.toLowerCase().includes(searchText.toLowerCase()) ||
      item.userName.toLowerCase().includes(searchText.toLowerCase())
    
    const matchMember = selectedMember === 'all' || item.userName === selectedMember
    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus
    
    return matchSearch && matchMember && matchStatus
  })
  
  if (history.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "5rem", color: "#7e22ce", fontSize: "18px" }}>
        📋 目前沒有審核歷史記錄
      </div>
    )
  }
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* ✅ 搜尋和篩選區 */}
      <div style={{
        background: "white",
        borderRadius: "1rem",
        padding: "1.5rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 搜尋任務或成員名稱..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              border: "2px solid #e5e7eb",
              borderRadius: "0.75rem",
              fontSize: "14px",
              outline: "none"
            }}
          />
          
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              border: "2px solid #e5e7eb",
              borderRadius: "0.75rem",
              fontSize: "14px",
              fontWeight: "600",
              color: "#374151",
              background: "white",
              cursor: "pointer"
            }}
          >
            <option value="all">👥 所有成員</option>
            {members.map(member => (
              <option key={member} value={member}>{member}</option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              border: "2px solid #e5e7eb",
              borderRadius: "0.75rem",
              fontSize: "14px",
              fontWeight: "600",
              color: "#374151",
              background: "white",
              cursor: "pointer"
            }}
          >
            <option value="all">📊 所有狀態</option>
            <option value="approved">✅ 已核准</option>
            <option value="rejected">❌ 已退回</option>
          </select>
        </div>
        
        <div style={{ marginTop: "0.75rem", fontSize: "13px", color: "#6b7280", display: "flex", justifyContent: "space-between" }}>
          <div>
            顯示 <strong style={{ color: "#8b5cf6" }}>{filteredHistory.length}</strong> / {history.length} 筆記錄
          </div>
          {(searchText || selectedMember !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchText('')
                setSelectedMember('all')
                setSelectedStatus('all')
              }}
              style={{
                background: "#f3f4f6",
                color: "#6b7280",
                padding: "0.25rem 0.75rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              清除篩選
            </button>
          )}
        </div>
      </div>
      
      {/* ✅ 文字型高效列表 */}
      {filteredHistory.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "16px" }}>
          😕 沒有符合條件的記錄
        </div>
      ) : (
        <div style={{ 
          background: "white", 
          borderRadius: "1rem", 
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
        }}>
          {filteredHistory.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleViewPhoto(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                padding: "1rem 1.5rem",
                borderBottom: index < filteredHistory.length - 1 ? "1px solid #f3f4f6" : "none",
                cursor: "pointer",
                transition: "background 0.15s",
                background: "transparent"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {/* ✅ 時間 */}
              <div style={{ 
                width: "100px", 
                flexShrink: 0, 
                fontSize: "13px", 
                color: "#6b7280",
                fontFamily: "monospace"
              }}>
                {new Date(item.timestamp).toLocaleString("zh-TW", { 
                  month: "2-digit", 
                  day: "2-digit", 
                  hour: "2-digit", 
                  minute: "2-digit",
                  hour12: false
                }).replace(/\//g, '/')}
              </div>
              
              {/* ✅ 執行人 */}
              <div style={{ 
                width: "70px", 
                flexShrink: 0, 
                fontSize: "14px", 
                fontWeight: "bold", 
                color: "#111" 
              }}>
                {item.userName}
              </div>
              
              {/* ✅ 任務名稱 */}
              <div style={{ 
                flex: 1, 
                fontSize: "14px", 
                color: "#374151",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {item.taskTitle}
              </div>
              
              {/* ✅ 點數 */}
              <div style={{ 
                width: "80px", 
                flexShrink: 0, 
                fontSize: "14px", 
                fontWeight: "bold", 
                color: item.status === "approved" ? "#f59e0b" : "#9ca3af",
                textAlign: "right"
              }}>
                {item.status === "approved" ? `+${item.points} 💰` : "—"}
              </div>
              
              {/* ✅ 狀態標籤 */}
              <div style={{ 
                width: "85px", 
                flexShrink: 0, 
                textAlign: "right" 
              }}>
                <span style={{
                  display: "inline-block",
                  background: item.status === "approved" ? "#d1fae5" : "#fee2e2",
                  color: item.status === "approved" ? "#059669" : "#dc2626",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "1rem",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {item.status === "approved" ? "✓ 已核准" : "✗ 已退回"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* ✅ 載入更多按鈕 */}
      {hasMore && filteredHistory.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            onClick={onLoadMore}
            disabled={loading}
            style={{
              padding: "0.75rem 2rem",
              background: loading ? "#d1d5db" : "linear-gradient(to right, #8b5cf6, #7c3aed)",
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
              borderRadius: "0.75rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 15px rgba(139, 92, 246, 0.4)"
            }}
          >
            {loading ? "⏳ 載入中..." : "📋 載入更多"}
          </button>
        </div>
      )}
      
      {!hasMore && filteredHistory.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "1.5rem", color: "#9ca3af", fontSize: "14px" }}>
          ✓ 已載入所有記錄
        </div>
      )}
      
      {/* ✅ 照片彈窗 */}
      {selectedItem?.photo && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            cursor: "pointer"
          }}
        >
          <div style={{ maxWidth: "90%", maxHeight: "90%", position: "relative" }}>
            <img
              src={selectedItem.photo}
              alt="任務照片"
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "1rem"
              }}
            />
            <div style={{
              position: "absolute",
              top: "-3rem",
              right: 0,
              color: "white",
              fontSize: "14px",
              background: "rgba(0,0,0,0.5)",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem"
            }}>
              點擊任意處關閉
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
