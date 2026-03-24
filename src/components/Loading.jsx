export default function Loading({ fullScreen = false, message = '載入中...' }) {
  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem'
  }

  return (
    <div style={containerStyle}>
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* 旋轉動畫 */}
        <div style={{
          width: '60px',
          height: '60px',
          border: '6px solid #e9d5ff',
          borderTop: '6px solid #a78bfa',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#7e22ce'
        }}>
          {message}
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

// 簡化版加載指示器
export function LoadingSpinner({ size = 24, color = '#a78bfa' }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `3px solid rgba(168, 85, 247, 0.2)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
