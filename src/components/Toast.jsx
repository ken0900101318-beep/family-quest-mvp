import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  const config = {
    success: {
      bg: 'linear-gradient(135deg, #10b981, #059669)',
      icon: '✅'
    },
    error: {
      bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
      icon: '❌'
    },
    info: {
      bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      icon: 'ℹ️'
    },
    warning: {
      bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      icon: '⚠️'
    }
  }

  const style = config[type] || config.success

  return (
    <div
      style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        background: style.bg,
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div style={{ fontSize: '24px' }}>{style.icon}</div>
      <div style={{ flex: 1, fontSize: '16px', fontWeight: '600' }}>
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0
        }}
      >
        ×
      </button>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  )

  return { showToast, ToastContainer }
}
