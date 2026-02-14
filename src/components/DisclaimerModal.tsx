import React from 'react';
import './DisclaimerModal.css';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  return (
    <div className="disclaimer-overlay">
      <div className="disclaimer-modal">
        <h2>⚠️ DISCLAIMER</h2>
        
        <div className="disclaimer-content">
          <p><strong>THIS SOFTWARE IS PROVIDED FOR EDUCATIONAL AND INFORMATIONAL PURPOSES ONLY.</strong></p>
          
          <ul>
            <li><strong>NOT FINANCIAL ADVICE</strong>: This application does NOT provide financial, investment, tax, or legal advice.</li>
            <li><strong>NO WARRANTIES</strong>: The software is provided "AS IS" without any warranties or guarantees of accuracy.</li>
            <li><strong>USE AT YOUR OWN RISK</strong>: Any decisions you make based on this tool are entirely your own responsibility.</li>
            <li><strong>CONSULT PROFESSIONALS</strong>: Always consult with qualified financial advisors, tax professionals, and legal counsel before making retirement planning decisions.</li>
            <li><strong>NO LIABILITY</strong>: The authors and contributors accept NO LIABILITY for any financial losses, damages, or consequences arising from the use of this software.</li>
          </ul>
          
          <p>Tax laws, retirement regulations, and financial markets are complex and constantly changing. This tool uses simplified models that may not accurately represent your specific situation.</p>
          
          <p className="disclaimer-acknowledge">By clicking "I Understand and Accept", you acknowledge that you understand these limitations and accept full responsibility for your financial decisions.</p>
        </div>
        
        <button className="btn-accept" onClick={onAccept}>
          I Understand and Accept
        </button>
      </div>
    </div>
  );
};
