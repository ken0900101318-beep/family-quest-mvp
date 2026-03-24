export default function SuccessAnimation({ message, onClose }) {
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
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '2rem',
        padding: '3rem',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'bounceIn 0.5s ease-out'
      }}>
        {/* 打勾動畫 */}
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 1.5rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'scaleCheckmark 0.5s ease-out 0.2s both'
        }}>
          <div style={{
            fontSize: '72px',
            animation: 'checkmark 0.5s ease-out 0.4s both'
          }}>
            ✓
          </div>
        </div>

        {/* 訊息 */}
        <h3 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#10b981',
          marginBottom: '1rem',
          animation: 'fadeInUp 0.5s ease-out 0.6s both'
        }}>
          成功！
        </h3>
        
        <p style={{
          fontSize: '16px',
          color: '#7e22ce',
          marginBottom: '2rem',
          animation: 'fadeInUp 0.5s ease-out 0.7s both'
        }}>
          {message}
        </p>

        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            padding: '1rem 2rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            animation: 'fadeInUp 0.5s ease-out 0.8s both'
          }}
        >
          繼續
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounceIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes scaleCheckmark {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        @keyframes checkmark {
          from {
            opacity: 0;
            transform: scale(0) rotate(-45deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
