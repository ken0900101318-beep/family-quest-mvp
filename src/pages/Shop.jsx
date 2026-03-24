import { useState, useEffect } from 'react'
import { mockAPI } from '../lib/supabase'

export default function Shop({ user, onNavigate }) {
  const [products, setProducts] = useState([])
  const [myPurchases, setMyPurchases] = useState([])
  const [activeTab, setActiveTab] = useState('shop') // shop / purchases / wish
  const [showWishForm, setShowWishForm] = useState(false)
  const [loading, setLoading] = useState(true)

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
    if (user.points < product.price) {
      alert('❌ 點數不足！還需要 ' + (product.price - user.points) + ' 點')
      return
    }

    if (confirm(`確定要兌換「${product.name}」嗎？\n將扣除 ${product.price} 點數`)) {
      try {
        await mockAPI.purchaseProduct(user.id, product.id)
        alert('🎉 兌換成功！家長已收到通知')
        loadData()
        // 觸發用戶點數更新（需要父組件重新載入用戶資料）
        window.location.reload()
      } catch (err) {
        alert('❌ 兌換失敗，請稍後再試')
      }
    }
  }

  const handleWish = (wishData) => {
    // 提交許願
    const newWish = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      name: wishData.name,
      price: parseInt(wishData.price),
      description: wishData.description,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    // 儲存到 localStorage（許願清單）
    const wishes = JSON.parse(localStorage.getItem('wishes') || '[]')
    wishes.push(newWish)
    localStorage.setItem('wishes', JSON.stringify(wishes))

    alert('✨ 許願成功！等待家長審核')
    setShowWishForm(false)
    setActiveTab('wish')
    loadData()
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
              {user.points} 💰
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
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      userPoints={user.points}
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
                    boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)'
                  }}
                >
                  ✨ 許願
                </button>
              </div>
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
