export default function ConfirmDialog({ 
  title, 
  message, 
  confirmText = '確定', 
  cancelText = '取消',
  onConfirm, 
  onCancel,
  type = 'warning' // warning / danger / info
}) {
  const typeConfig = {
    warning: {
      color: '#f59e0b',
      bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      icon: '⚠️'
    },
    danger: {
      color: '#ef4444',
      bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
      icon: '🚨'
    },
    info: {
      color: '#3b82f6',
      bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      icon: 'ℹ️'
    }
  }

  const config = typeConfig[type] || typeConfig.warning

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'scaleIn 0.3s ease-out'
      }}>
        {/* 圖示 */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 1.5rem',
          borderRadius: '50%',
          background: config.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px'
        }}>
          {config.icon}
        </div>

        {/* 標題 */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#581c87',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {title}
        </h3>

        {/* 訊息 */}
        <p style={{
          fontSize: '16px',
          color: '#7e22ce',
          marginBottom: '2rem',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {/* 按鈕 */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: '#e9d5ff',
              color: '#7e22ce',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: config.bg,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 4px 15px ${config.color}66`
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
