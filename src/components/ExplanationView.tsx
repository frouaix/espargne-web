// Copyright (c) 2026 François Rouaix
import type { ExplanationResult } from '../lib/explanationGenerator';

interface ExplanationViewProps {
  explanation: ExplanationResult;
}

export function ExplanationView({ explanation }: ExplanationViewProps) {
  const downloadText = (): void => {
    // Build full text report
    const fullText = [
      'RETIREMENT SCENARIO ANALYSIS',
      '='.repeat(60),
      '',
      'SUMMARY',
      '-'.repeat(60),
      explanation.summary,
      '',
      'SUCCESS ANALYSIS',
      '-'.repeat(60),
      explanation.successAnalysis,
      '',
      'TAX ANALYSIS',
      '-'.repeat(60),
      explanation.taxAnalysis,
      '',
      'WITHDRAWAL ANALYSIS',
      '-'.repeat(60),
      explanation.withdrawalAnalysis,
      '',
      'KEY MILESTONES',
      '-'.repeat(60),
      ...explanation.keyMilestones.map((m, i) => `${i + 1}. ${m}`),
      '',
      'RECOMMENDATIONS',
      '-'.repeat(60),
      ...explanation.recommendations.map((r, i) => `${i + 1}. ${r}`),
    ].join('\n');

    const blob = new Blob([fullText], { type: 'text/plain' });
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
        <p className="explanation-summary-text">{explanation.summary}</p>
      </div>

      <div className="explanation-section explanation-success">
        <h4>✅ Success Probability</h4>
        <pre>{explanation.successAnalysis}</pre>
      </div>

      <div className="explanation-section explanation-tax">
        <h4>💰 Tax Efficiency</h4>
        <pre>{explanation.taxAnalysis}</pre>
      </div>

      <div className="explanation-section explanation-withdrawal">
        <h4>📤 Withdrawal Strategy</h4>
        <pre>{explanation.withdrawalAnalysis}</pre>
      </div>

      <div className="explanation-section explanation-milestones">
        <h4>🎯 Key Milestones</h4>
        <ul>
          {explanation.keyMilestones.map((milestone, idx) => (
            <li key={idx}>{milestone}</li>
          ))}
        </ul>
      </div>

      <div className="explanation-section explanation-recommendations">
        <h4>💡 Recommendations</h4>
        <ul>
          {explanation.recommendations.map((recommendation, idx) => (
            <li key={idx}>{recommendation}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
