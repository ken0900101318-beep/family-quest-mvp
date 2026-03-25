import { useState, useEffect } from 'react'

export default function Passbook({ user, onNavigate }) {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all') // all / earn / spend

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = () => {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]')
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]')
    
    const allTransactions = []
    
    // 獲得點數（已核准的任務）
    submissions
      .filter(s => s.status === 'approved' && s.userId === user.id)
      .forEach(s => {
        allTransactions.push({
          id: `earn-${s.id}`,
          type: 'earn',
          amount: s.points || 10,
          description: s.taskTitle || '完成任務',
          timestamp: s.approvedAt || s.timestamp
        })
      })
    
    // 消費點數
    purchases
      .filter(p => p.userId === user.id)
      .forEach(p => {
        allTransactions.push({
          id: `spend-${p.id}`,
          type: 'spend',
          amount: p.price,
          description: p.productName,
          timestamp: p.createdAt
        })
      })
    
    allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    setTransactions(allTransactions)
  }

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true
    return t.type === filter
  })

  const totalEarned = transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0)
  const totalSpent = transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0)

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      paddingBottom: '100px'
    }}>
      {/* 樂園背景 */}
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

      {/* 半透明遮罩 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom, rgba(216, 180, 254, 0.3), rgba(233, 213, 255, 0.2))',
        zIndex: 1
      }} />

      <div style={{ position: 'relative', zIndex: 10, padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 頂部標題 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '900',
            color: '#581c87',
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            💰 我的存摺
          </h1>
          <button
            onClick={() => onNavigate('home')}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid #d8b4fe',
              borderRadius: '0.75rem',
              padding: '0.5rem 1rem',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#7e22ce',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
          >
            ← 返回
          </button>
        </div>

        {/* 總覽卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
            borderRadius: '1rem',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>目前餘額</div>
            <div style={{ fontSize: '48px', fontWeight: '900' }}>{user.points} 💰</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '1rem',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>總獲得</div>
            <div style={{ fontSize: '36px', fontWeight: '900' }}>+{totalEarned}</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            borderRadius: '1rem',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '0.5rem' }}>總消費</div>
            <div style={{ fontSize: '36px', fontWeight: '900' }}>-{totalSpent}</div>
          </div>
        </div>

        {/* 篩選器 */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          background: 'rgba(255, 255, 255, 0.7)',
          padding: '0.5rem',
          borderRadius: '0.75rem'
        }}>
          {[
            { value: 'all', label: '全部', icon: '📝' },
            { value: 'earn', label: '獲得', icon: '💰' },
            { value: 'spend', label: '消費', icon: '🛒' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              style={{
                flex: 1,
                background: filter === option.value
                  ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
                  : 'transparent',
                color: filter === option.value ? 'white' : '#9333ea',
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>

        {/* 交易列表 */}
        {filteredTransactions.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            color: '#7e22ce',
            fontSize: '18px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
          }}>
            還沒有交易記錄
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1rem',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
          }}>
            {filteredTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: index < filteredTransactions.length - 1 ? '1px solid #e9d5ff' : 'none'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: transaction.type === 'earn'
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginRight: '1rem',
                  flexShrink: 0
                }}>
                  {transaction.type === 'earn' ? '💰' : '🛒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#581c87',
                    marginBottom: '0.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {transaction.description}
                  </div>
                  <div style={{ fontSize: '14px', color: '#9333ea' }}>
                    {new Date(transaction.timestamp).toLocaleString('zh-TW', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '900',
                  color: transaction.type === 'earn' ? '#10b981' : '#ef4444',
                  marginLeft: '1rem',
                  flexShrink: 0
                }}>
                  {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
