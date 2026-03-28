import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockAPI } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function Shop({ user }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [myPurchases, setMyPurchases] = useState([])
  const [activeTab, setActiveTab] = useState('shop') // shop / purchases / wish
  const [showWishForm, setShowWishForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPoints, setCurrentPoints] = useState(user.points)
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // 載入商品
    const allProducts = await mockAPI.getProducts()
    setProducts(allProducts)
    
    // 載入購買記錄
    const purchases = await mockAPI.getPurchases(user.id)
    setMyPurchases(purchases)
    
    setLoading(false)
  }

  const handlePurchase = async (product) => {
    if (currentPoints < product.price) {
      showToast(`點數不足！還需要 ${product.price - currentPoints} 點`, 'warning')
      return
    }

    if (confirm(`確定要兌換「${product.name}」嗎？\n將扣除 ${product.price} 點數`)) {
      try {
        await mockAPI.purchaseProduct(user.id, product.id)
        
        // 更新當前點數
        const newPoints = currentPoints - product.price
        setCurrentPoints(newPoints)
        
        // 更新 user 物件
        user.points = newPoints
        
        showToast('兌換成功！家長已收到通知', 'success')
        loadData()
      } catch (err) {
        showToast('兌換失敗，請稍後再試', 'error')
      }
    }
  }

  const handleWish = async (wishData) => {
    try {
      await mockAPI.addWish(
        user.id,
        wishData.name,
        wishData.description
      )

      showToast('許願成功！等待家長審核', 'success')
      setShowWishForm(false)
      setActiveTab('wish')
      loadData()
    } catch (error) {
      showToast('許願失敗，請稍後再試', 'error')
      console.error(error)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      paddingBottom: '100px'
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
            🎁 獎勵商店
          </h1>
          <button
            type="button"
            onClick={() => navigate('/child')}
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

        {/* 點數餘額卡片 */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          border: '2px solid #d8b4fe',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#9333ea', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              我的點數餘額
            </div>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#581c87' }}>
              {currentPoints} 💰
            </div>
          </div>
          <div style={{ fontSize: '80px', opacity: 0.2 }}>🎁</div>
        </div>

        {/* 分頁 */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          background: 'white',
          padding: '0.5rem',
          borderRadius: '1rem',
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
        }}>
          <TabButton
            active={activeTab === 'shop'}
            onClick={() => setActiveTab('shop')}
            icon="🛒"
            label="商店"
          />
          <TabButton
            active={activeTab === 'purchases'}
            onClick={() => setActiveTab('purchases')}
            icon="📦"
            label="兌換記錄"
          />
          <TabButton
            active={activeTab === 'wish'}
            onClick={() => setActiveTab('wish')}
            icon="✨"
            label="我的願望"
          />
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '5rem',
            color: '#7e22ce',
            fontSize: '20px'
          }}>
            載入中...
          </div>
        ) : (
          <>
            {/* 商店分頁 */}
            {activeTab === 'shop' && (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      userPoints={currentPoints}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setShowWishForm(true)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(to right, #ec4899, #d946ef)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)',
                    marginTop: '1rem'
                  }}
                >
                  ✨ 我想要許願
                </button>
              </div>
            )}

            {/* 兌換記錄分頁 */}
            {activeTab === 'purchases' && (
              <div>
                {myPurchases.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#9333ea',
                    fontSize: '18px'
                  }}>
                    還沒有兌換記錄
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {myPurchases.map(purchase => (
                      <PurchaseCard key={purchase.id} purchase={purchase} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 我的願望分頁 */}
            {activeTab === 'wish' && (
              <WishTab
                userId={user.id}
                onOpenWishForm={() => setShowWishForm(true)}
              />
            )}
          </>
        )}
      </div>

      {/* 許願表單 Modal */}
      {showWishForm && (
        <WishFormModal
          onSubmit={handleWish}
          onClose={() => setShowWishForm(false)}
        />
      )}

      {/* Toast 通知 */}
      <ToastContainer />
    </div>
  )
}

// 分頁按鈕
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active
          ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
          : 'transparent',
        color: active ? 'white' : '#9333ea',
        fontWeight: 'bold',
        fontSize: '16px',
        padding: '0.75rem',
        borderRadius: '0.75rem',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      {icon} {label}
    </button>
  )
}

// 商品卡片
function ProductCard({ product, userPoints, onPurchase }) {
  const canAfford = userPoints >= product.price

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      border: '2px solid #d8b4fe',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 類別標籤 */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        padding: '0.25rem 0.75rem',
        borderRadius: '0.5rem',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white'
      }}>
        {product.category}
      </div>

      {/* 圖示 */}
      <div style={{
        fontSize: '64px',
        textAlign: 'center',
        marginBottom: '1rem'
      }}>
        {product.icon}
      </div>

      {/* 名稱 */}
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#581c87',
        marginBottom: '0.5rem',
        textAlign: 'center'
      }}>
        {product.name}
      </h3>

      {/* 說明 */}
      {product.description && (
        <p style={{
          fontSize: '14px',
          color: '#7e22ce',
          marginBottom: '1rem',
          textAlign: 'center',
          minHeight: '40px'
        }}>
          {product.description}
        </p>
      )}

      {/* 價格 */}
      <div style={{
        fontSize: '24px',
        fontWeight: '900',
        color: '#9333ea',
        textAlign: 'center',
        marginBottom: '1rem'
      }}>
        {product.price} 💰
      </div>

      {/* 兌換按鈕 */}
      <button
        onClick={() => onPurchase(product)}
        disabled={!canAfford}
        style={{
          width: '100%',
          background: canAfford
            ? 'linear-gradient(to right, #10b981, #059669)'
            : 'linear-gradient(to right, #9ca3af, #6b7280)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          padding: '0.75rem',
          borderRadius: '0.75rem',
          border: 'none',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          opacity: canAfford ? 1 : 0.6
        }}
      >
        {canAfford ? '🎁 兌換' : '💰 點數不足'}
      </button>
    </div>
  )
}

// 兌換記錄卡片
function PurchaseCard({ purchase }) {
  const statusConfig = {
    pending: { label: '待發放', color: '#f59e0b', bg: '#fef3c7' },
    delivered: { label: '已發放', color: '#10b981', bg: '#d1fae5' }
  }

  const config = statusConfig[purchase.status] || statusConfig.pending

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
      border: '2px solid #e9d5ff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '48px' }}>{purchase.icon}</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#581c87', marginBottom: '0.25rem' }}>
            {purchase.productName}
          </h4>
          <div style={{ fontSize: '14px', color: '#7e22ce' }}>
            {new Date(purchase.createdAt).toLocaleDateString('zh-TW')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            background: config.bg,
            color: config.color,
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {config.label}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#9333ea' }}>
            -{purchase.price} 💰
          </div>
        </div>
      </div>
    </div>
  )
}

// 我的願望分頁
function WishTab({ userId, onOpenWishForm }) {
  const [wishes, setWishes] = useState([])
  const [filter, setFilter] = useState('pending') // pending / all

  useEffect(() => {
    loadWishes()
  }, [filter, userId])

  const loadWishes = async () => {
    const userWishes = await mockAPI.getWishes(userId)
    
    if (filter === 'pending') {
      setWishes(userWishes.filter(w => w.status === 'pending'))
    } else {
      setWishes(userWishes)
    }
  }

  const handleClearHistory = async () => {
    if (confirm('確定要清除所有許願記錄嗎？')) {
      // TODO: 實作 Supabase 刪除許願功能
      showToast('此功能開發中', 'info')
    }
  }

  const statusConfig = {
    pending: { label: '待審核', color: '#f59e0b', bg: '#fef3c7' },
    approved: { label: '已核准', color: '#10b981', bg: '#d1fae5' },
    rejected: { label: '已拒絕', color: '#ef4444', bg: '#fee2e2' }
  }

  return (
    <div>
      <div style={{
        background: 'rgba(236, 72, 153, 0.1)',
        borderRadius: '1rem',
        padding: '1rem',
        marginBottom: '1rem',
        border: '2px dashed #ec4899'
      }}>
        <div style={{ fontSize: '16px', color: '#be185d', fontWeight: '600' }}>
          💡 許願說明
        </div>
        <div style={{ fontSize: '14px', color: '#9d174d', marginTop: '0.5rem' }}>
          想要的獎勵不在商店裡？點下方許願按鈕，告訴家長你想要什麼！
        </div>
      </div>

      {/* 篩選器 */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        background: 'rgba(255, 255, 255, 0.7)',
        padding: '0.5rem',
        borderRadius: '0.75rem'
      }}>
        <button
          onClick={() => setFilter('pending')}
          style={{
            flex: 1,
            background: filter === 'pending'
              ? 'linear-gradient(to right, #ec4899, #d946ef)'
              : 'transparent',
            color: filter === 'pending' ? 'white' : '#ec4899',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ⏰ 待審核
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{
            flex: 1,
            background: filter === 'all'
              ? 'linear-gradient(to right, #ec4899, #d946ef)'
              : 'transparent',
            color: filter === 'all' ? 'white' : '#ec4899',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          📜 全部
        </button>
      </div>

      {/* 許願按鈕 */}
      <button
        onClick={onOpenWishForm}
        style={{
          width: '100%',
          background: 'linear-gradient(to right, #ec4899, #d946ef)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '18px',
          padding: '1.25rem',
          borderRadius: '1rem',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)',
          marginBottom: '1rem'
        }}
      >
        ✨ 許願
      </button>

      {/* 許願列表 */}
      {wishes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#ec4899',
          fontSize: '16px'
        }}>
          {filter === 'pending' ? '目前沒有待審核的許願' : '還沒有許願記錄'}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            {wishes.map(wish => {
              const config = statusConfig[wish.status] || statusConfig.pending
              return (
                <div
                  key={wish.id}
                  style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    border: '2px solid #fce7f3'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#881337', flex: 1 }}>
                      {wish.product_name || wish.name || '未命名許願'}
                    </h4>
                    <div style={{
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
                  <div style={{ fontSize: '14px', color: '#be185d', marginBottom: '0.5rem' }}>
                    
                  </div>
                  {wish.description && (
                    <div style={{
                      fontSize: '14px',
                      color: '#9d174d',
                      background: 'rgba(236, 72, 153, 0.05)',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      {wish.description}
                    </div>
                  )}
                  {wish.rejectReason && (
                    <div style={{
                      fontSize: '14px',
                      color: '#dc2626',
                      background: '#fee2e2',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      ❌ 拒絕原因：{wish.rejectReason}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#db2777' }}>
                    許願時間：{new Date(wish.created_at).toLocaleString('zh-TW')}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 清除按鈕 */}
          {filter === 'all' && wishes.length > 0 && (
            <button
              onClick={handleClearHistory}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #ef4444, #dc2626)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
              }}
            >
              🗑️ 清除所有許願記錄
            </button>
          )}
        </>
      )}
    </div>
  )
}

// 許願表單 Modal
function WishFormModal({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      alert('請填寫完整資訊')
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
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#581c87',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          ✨ 許願
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              我想要什麼？
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例：樂高積木、溜冰鞋..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #d8b4fe',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              需要多少點數？
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="例：100"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #d8b4fe',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7e22ce',
              marginBottom: '0.5rem'
            }}>
              補充說明（選填）
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="告訴家長更多細節..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid #d8b4fe',
                fontSize: '16px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: '#e9d5ff',
                color: '#7e22ce',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '0.75rem',
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
                background: 'linear-gradient(to right, #ec4899, #d946ef)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)'
              }}
            >
              ✨ 送出許願
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
