import type { ExplanationResponse } from '../services/api';
import './ExplanationView.css';

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
    <div>
      <div className="explanation-header">
        <h3>Retirement Scenario Analysis</h3>
        <button 
          onClick={downloadText}
          className="button-secondary"
        >
          💾 Download Report
        </button>
      </div>

      <div className="explanation-section explanation-summary">
        <h4>📋 Summary</h4>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{sections.summary}</p>
      </div>

      <div className="explanation-section explanation-success">
        <h4>✅ Success Probability</h4>
        <pre>{sections.success_analysis}</pre>
      </div>

      <div className="explanation-section explanation-tax">
        <h4>💰 Tax Efficiency</h4>
        <pre>{sections.tax_analysis}</pre>
      </div>

      <div className="explanation-section explanation-withdrawal">
        <h4>📤 Withdrawal Strategy</h4>
        <pre>{sections.withdrawal_analysis}</pre>
      </div>

      <div className="explanation-section explanation-milestones">
        <h4>🎯 Key Milestones</h4>
        <pre>{sections.key_milestones}</pre>
      </div>

      <div className="explanation-section explanation-recommendations">
        <h4>💡 Recommendations</h4>
        <pre>{sections.recommendations}</pre>
      </div>

      <details className="explanation-details">
        <summary>
          📄 View Full Text Report
        </summary>
        <pre>{text}</pre>
      </details>
    </div>
  );
}
