// 商品管理相關組件
import { useState } from 'react'

// 商品卡片
export function ProductCard({ product, onEdit, onToggleStatus }) {
  const isActive = product.status === 'active'
  
  return (
    <div style={{
      background: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(200, 200, 200, 0.5)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: '1.5rem',
      border: `2px solid ${isActive ? '#e9d5ff' : '#d1d5db'}`,
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
      opacity: isActive ? 1 : 0.7
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '48px' }}>{product.icon || '🎁'}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#581c87', marginBottom: '0.25rem' }}>
            {product.name}
          </h3>
          <div style={{ fontSize: '16px', color: '#7e22ce', fontWeight: 'bold' }}>
            💰 {product.price} 點
          </div>
          {product.stock !== undefined && (
            <div style={{ fontSize: '12px', color: '#9333ea', marginTop: '0.25rem' }}>
              庫存：{product.stock === 999 ? '無限' : `${product.stock} 個`}
            </div>
          )}
          {!isActive && (
            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '0.25rem', fontWeight: 'bold' }}>
              ⚠️ 已停用
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onEdit(product)}
          style={{
            flex: 1,
            background: 'linear-gradient(to right, #3b82f6, #2563eb)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ✏️ 編輯
        </button>
        <button
          onClick={() => onToggleStatus(product.id, product.status)}
          style={{
            flex: 1,
            background: isActive 
              ? 'linear-gradient(to right, #f59e0b, #d97706)'
              : 'linear-gradient(to right, #10b981, #059669)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {isActive ? '🔒 停用' : '✅ 啟用'}
        </button>
      </div>
    </div>
  )
}

// 商品表單 Modal
export function ProductFormModal({ product, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    icon: product?.icon || '🎁',
    price: product?.price || 0,
    stock: product?.stock || 999
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || formData.price <= 0) {
      alert('請填寫完整資訊')
      return
    }
    onSubmit(formData)
  }

  const iconOptions = ['🎁', '🍦', '🎮', '🎬', '📚', '🎨', '🏀', '🎸', '🍕', '🍰', '🎪', '🎯']

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#581c87',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          {product ? '✏️ 編輯商品' : '➕ 新增商品'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* 圖示選擇 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem', display: 'block' }}>
              選擇圖示
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  style={{
                    fontSize: '32px',
                    padding: '0.5rem',
                    border: formData.icon === icon ? '3px solid #a78bfa' : '2px solid #e9d5ff',
                    borderRadius: '0.75rem',
                    background: formData.icon === icon ? '#f3e8ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 品名 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem', display: 'block' }}>
              品名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：冰淇淋券"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #e9d5ff',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 點數 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem', display: 'block' }}>
              需要點數
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              min="1"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #e9d5ff',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 庫存 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#7e22ce', marginBottom: '0.5rem', display: 'block' }}>
              庫存數量（999 = 無限）
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              min="0"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid #e9d5ff',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 按鈕 */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: '#f3f4f6',
                color: '#6b7280',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '1rem',
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
                background: 'linear-gradient(to right, #a78bfa, #8b5cf6)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
              }}
            >
              {product ? '✅ 儲存' : '✨ 新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
