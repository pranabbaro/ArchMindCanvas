import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import type { ValidationFinding } from '../types';

const iconMap = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

export default function ValidationPanel({ findings, score, onSelectNode }: { findings: ValidationFinding[]; score: number; onSelectNode: (id: string) => void }) {
  const warnings = findings.filter((f) => f.severity === 'warning' || f.severity === 'critical').length;
  return <aside className="validation-panel">
    <div className="sidebar-heading"><div><div className="panel-title">Architecture validation</div><div className="panel-subtitle">Design-time checks and guidance</div></div></div>
    <div className="score-card"><div className="score-ring"><strong>{score}</strong><span>/100</span></div><div><strong>Architecture score</strong><small>{warnings ? `${warnings} improvement${warnings === 1 ? '' : 's'} found` : 'No major issues detected'}</small></div></div>
    <div className="validation-list">
      {findings.map((finding) => {
        const Icon = iconMap[finding.severity];
        return <button key={finding.id} className={`validation-item ${finding.severity}`} onClick={() => finding.nodeId && onSelectNode(finding.nodeId)}>
          <Icon size={17}/><span><strong>{finding.title}</strong><small>{finding.message}</small></span>
        </button>;
      })}
    </div>
  </aside>;
}
