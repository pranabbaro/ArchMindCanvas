import { Building2, FolderKanban, Layers3, Network, Variable, X } from 'lucide-react';

type ScopeItem={id:string;name:string};
type Props={
  organization:ScopeItem;
  project:ScopeItem;
  environment:ScopeItem;
  architecture:ScopeItem;
  onGoOrganization:()=>void;
  onGoProject:()=>void;
  onGoEnvironment:()=>void;
  onGoArchitecture:()=>void;
  onOpenGlobalVariables:()=>void;
  onOpenArchitectureVariables:()=>void;
  onClose:()=>void;
};

export default function WorkspaceScopeManager(p:Props){
  return <div className="workspace-scope-overlay" onMouseDown={p.onClose}>
    <div className="workspace-scope-dialog workspace-navigation-dialog" onMouseDown={e=>e.stopPropagation()}>
      <div className="workspace-scope-head">
        <div>
          <strong>Architecture Workspace</strong>
          <small>Navigate your Organization → Project → Environment → Architecture</small>
        </div>
        <button onClick={p.onClose} aria-label="Close"><X size={16}/></button>
      </div>

      <div className="scope-breadcrumb scope-navigation-cards">
        <button onClick={p.onGoOrganization}><Building2 size={15}/><span>{p.organization.name}</span><small>Organization</small></button>
        <span>›</span>
        <button onClick={p.onGoProject}><FolderKanban size={15}/><span>{p.project.name}</span><small>Project · Back to workspace</small></button>
        <span>›</span>
        <button onClick={p.onGoEnvironment}><Layers3 size={15}/><span>{p.environment.name}</span><small>Environment · View in project</small></button>
        <span>›</span>
        <button className="active" onClick={p.onGoArchitecture}><Network size={15}/><span>{p.architecture.name}</span><small>Current architecture</small></button>
      </div>

      <div className="workspace-navigation-body">
        <div className="workspace-navigation-copy">
          <strong>Current architecture</strong>
          <h2>{p.architecture.name}</h2>
          <p>This window is for workspace navigation only. Variable management remains intentionally simple: one global scope and one current-architecture scope.</p>
        </div>
        <div className="workspace-variable-shortcuts">
          <button onClick={p.onOpenGlobalVariables}><Variable size={17}/><span><strong>Global Variables</strong><small>Reusable across architectures</small></span></button>
          <button onClick={p.onOpenArchitectureVariables}><Network size={17}/><span><strong>Architecture Variables</strong><small>Only for {p.architecture.name}</small></span></button>
        </div>
      </div>
    </div>
  </div>;
}
