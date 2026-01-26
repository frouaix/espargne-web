import type { ExplanationResponse } from '../services/api';

interface ExplanationViewProps {
  explanation: ExplanationResponse;
}

export function ExplanationView({ explanation }: ExplanationViewProps) {
  const { explanation: sections, text } = explanation;

  const downloadText = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `retirement_analysis_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0 }}>Retirement Scenario Analysis</h3>
        <button 
          onClick={downloadText}
          className="button-secondary"
          style={{ fontSize: '14px' }}
        >
          💾 Download Report
        </button>
      </div>

      <div style={{ 
        background: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ marginTop: 0, color: '#2196F3' }}>📋 Summary</h4>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{sections.summary}</p>
      </div>

      <div style={{ 
        background: '#e8f5e9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '2px solid #4CAF50'
      }}>
        <h4 style={{ marginTop: 0, color: '#2e7d32' }}>✅ Success Probability</h4>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'inherit',
          lineHeight: '1.6',
          margin: 0
        }}>{sections.success_analysis}</pre>
      </div>

      <div style={{ 
        background: '#fff3e0',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ marginTop: 0, color: '#e65100' }}>💰 Tax Efficiency</h4>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'inherit',
          lineHeight: '1.6',
          margin: 0
        }}>{sections.tax_analysis}</pre>
      </div>

      <div style={{ 
        background: '#e3f2fd',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ marginTop: 0, color: '#0277bd' }}>📤 Withdrawal Strategy</h4>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'inherit',
          lineHeight: '1.6',
          margin: 0
        }}>{sections.withdrawal_analysis}</pre>
      </div>

      <div style={{ 
        background: '#f3e5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ marginTop: 0, color: '#6a1b9a' }}>🎯 Key Milestones</h4>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'inherit',
          lineHeight: '1.6',
          margin: 0
        }}>{sections.key_milestones}</pre>
      </div>

      <div style={{ 
        background: '#fff9c4',
        padding: '20px',
        borderRadius: '8px',
        border: '2px solid #f9a825'
      }}>
        <h4 style={{ marginTop: 0, color: '#f57f17' }}>💡 Recommendations</h4>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'inherit',
          lineHeight: '1.6',
          margin: 0
        }}>{sections.recommendations}</pre>
      </div>

      <details style={{ marginTop: '30px' }}>
        <summary style={{ 
          cursor: 'pointer',
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>
          📄 View Full Text Report
        </summary>
        <pre style={{ 
          marginTop: '15px',
          padding: '20px',
          background: '#fafafa',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '13px',
          lineHeight: '1.5',
          border: '1px solid #ddd'
        }}>{text}</pre>
      </details>
    </div>
  );
}
