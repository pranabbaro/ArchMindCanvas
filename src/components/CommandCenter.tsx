import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Boxes, Building2, ChevronLeft, ChevronRight, CircleCheck, Cloud,
  FolderKanban, Gauge, GitBranch, LayoutDashboard, Layers3, MoreHorizontal,
  Network, Plus, Rocket, Search, Settings, ShieldCheck, Sparkles, X
} from 'lucide-react';

type EnvironmentRecord={
  id:string;
  name:string;
  type:string;
  description?:string;
  createdAt:string;
};

type ArchitectureRecord={
  id:string;
  name:string;
  environmentId:string;
  cloud:'Azure';
  resources:number;
  connections:number;
  score:number;
  updatedAt:string;
};

type ProjectRecord={
  id:string;
  name:string;
  description:string;
  environments:EnvironmentRecord[];
  architectures:ArchitectureRecord[];
  createdAt:string;
};

type OpenArchitectureArgs={
  projectId:string;
  projectName:string;
  environmentId:string;
  environmentName:string;
  architectureId:string;
  architectureName:string;
};

type Props={
  organizationName:string;
  projectName:string;
  environmentName:string;
  currentDesignName:string;
  resourceCount:number;
  connectionCount:number;
  score:number;
  onOpenEditor:()=>void;
  onCreateArchitecture:()=>void;
  onOpenScopeManager:()=>void;
  onOpenArchitecture:(args:OpenArchitectureArgs)=>void;
};

const PROJECTS_KEY='archmindcanvas-project-workspace-v1';
const uid=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

const defaultProjects:ProjectRecord[]=[
  {
    id:'project-cloud-platform',
    name:'Cloud Platform',
    description:'Shared cloud platform and landing-zone architectures.',
    createdAt:new Date().toISOString(),
    environments:[
      {id:'env-dev',name:'Development',type:'DEV',createdAt:new Date().toISOString()},
      {id:'env-test',name:'Test',type:'TEST',createdAt:new Date().toISOString()},
      {id:'env-prod',name:'Production',type:'PROD',createdAt:new Date().toISOString()},
    ],
    architectures:[
      {id:'arch-current',name:'My Azure Architecture',environmentId:'env-prod',cloud:'Azure',resources:5,connections:0,score:100,updatedAt:new Date().toISOString()},
    ]
  }
];

export default function CommandCenter(p:Props){
  const[view,setView]=useState<'home'|'projects'|'project'>('home');
  const[projects,setProjects]=useState<ProjectRecord[]>(()=>{
    try{
      const raw=localStorage.getItem(PROJECTS_KEY);
      return raw?JSON.parse(raw):defaultProjects;
    }catch{return defaultProjects}
  });
  const[selectedProjectId,setSelectedProjectId]=useState<string>(projects[0]?.id||'');
  const[createMenuOpen,setCreateMenuOpen]=useState(false);
  const[modal,setModal]=useState<'project'|'environment'|'architecture'|null>(null);

  const[newProjectName,setNewProjectName]=useState('');
  const[newProjectDescription,setNewProjectDescription]=useState('');
  const[newEnvironmentName,setNewEnvironmentName]=useState('');
  const[newEnvironmentType,setNewEnvironmentType]=useState('DEV');
  const[newArchitectureName,setNewArchitectureName]=useState('');
  const[newArchitectureEnvironment,setNewArchitectureEnvironment]=useState('');

  useEffect(()=>{localStorage.setItem(PROJECTS_KEY,JSON.stringify(projects));},[projects]);

  const selectedProject=useMemo(()=>projects.find(x=>x.id===selectedProjectId)||projects[0],[projects,selectedProjectId]);

  const openProjects=()=>setView('projects');
  const openProject=(id:string)=>{setSelectedProjectId(id);setView('project');};

  const createProject=()=>{
    const name=newProjectName.trim();
    if(!name)return;
    const project:ProjectRecord={
      id:uid('project'),
      name,
      description:newProjectDescription.trim()||'Cloud architecture project',
      createdAt:new Date().toISOString(),
      environments:[],
      architectures:[]
    };
    setProjects(v=>[...v,project]);
    setSelectedProjectId(project.id);
    setNewProjectName('');
    setNewProjectDescription('');
    setModal(null);
    setView('project');
  };

  const createEnvironment=()=>{
    if(!selectedProject)return;
    const name=newEnvironmentName.trim();
    if(!name)return;
    const environment:EnvironmentRecord={
      id:uid('env'),
      name,
      type:newEnvironmentType,
      createdAt:new Date().toISOString()
    };
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?{...pr,environments:[...pr.environments,environment]}:pr));
    setNewEnvironmentName('');
    setNewEnvironmentType('DEV');
    setModal(null);
  };

  const createArchitecture=()=>{
    if(!selectedProject)return;
    const name=newArchitectureName.trim();
    if(!name||!newArchitectureEnvironment)return;
    const arch:ArchitectureRecord={
      id:uid('arch'),
      name,
      environmentId:newArchitectureEnvironment,
      cloud:'Azure',
      resources:0,
      connections:0,
      score:100,
      updatedAt:new Date().toISOString()
    };
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?{...pr,architectures:[...pr.architectures,arch]}:pr));
    const env=selectedProject.environments.find(e=>e.id===newArchitectureEnvironment);
    setNewArchitectureName('');
    setNewArchitectureEnvironment('');
    setModal(null);
    if(env)p.onOpenArchitecture({
      projectId:selectedProject.id,
      projectName:selectedProject.name,
      environmentId:env.id,
      environmentName:env.name,
      architectureId:arch.id,
      architectureName:arch.name
    });
  };

  const openArchitecture=(project:ProjectRecord,arch:ArchitectureRecord)=>{
    const env=project.environments.find(e=>e.id===arch.environmentId);
    if(!env)return;
    p.onOpenArchitecture({
      projectId:project.id,
      projectName:project.name,
      environmentId:env.id,
      environmentName:env.name,
      architectureId:arch.id,
      architectureName:arch.name
    });
  };

  const requestEnvironment=()=>{
    if(!selectedProject){setView('projects');return}
    setModal('environment');
  };
  const requestArchitecture=()=>{
    if(!selectedProject){setView('projects');return}
    if(!selectedProject.environments.length){
      setModal('environment');
      return;
    }
    setNewArchitectureEnvironment(selectedProject.environments[0].id);
    setModal('architecture');
  };

  return <div className="command-center-shell">
    <aside className="command-sidebar">
      <div className="command-brand">
        <div className="command-brand-mark"><Sparkles size={19}/></div>
        <div><strong>ArchMindCanvas</strong><small>Cloud Architecture Platform</small></div>
      </div>

      <div className="command-org">
        <small>ORGANIZATION</small>
        <button onClick={p.onOpenScopeManager}><Building2 size={15}/><span>{p.organizationName}</span><ChevronRight size={13}/></button>
      </div>

      <nav className="command-nav">
        <button className={view==='home'?'active':''} onClick={()=>setView('home')}><LayoutDashboard size={16}/><span>Home</span></button>
        <button className={view==='projects'||view==='project'?'active':''} onClick={openProjects}><FolderKanban size={16}/><span>Projects</span><em>{projects.length}</em></button>
        <button><Boxes size={16}/><span>Templates</span></button>
        <button><Activity size={16}/><span>Activity</span></button>
        <div className="nav-divider"/>
        <button><Settings size={16}/><span>Settings</span></button>
      </nav>

      <div className="command-sidebar-footer">
        <div className="org-health"><span className="health-dot"/><div><strong>Platform healthy</strong><small>All systems operational</small></div></div>
        <button className="profile-button"><span>PB</span><div><strong>Pranab Baro</strong><small>Organization Admin</small></div></button>
      </div>
    </aside>

    <main className="command-main">
      <header className="command-header">
        <div className="command-search"><Search size={16}/><input placeholder="Search projects, environments, architectures..."/><kbd>⌘ K</kbd></div>
        <div className="create-menu-wrap">
          <button className="command-create" onClick={()=>setCreateMenuOpen(v=>!v)}><Plus size={16}/> Create</button>
          {createMenuOpen&&<div className="command-create-menu">
            <button onClick={()=>{setCreateMenuOpen(false);setModal('project')}}><FolderKanban size={15}/><span><b>New Project</b><small>Create a project workspace</small></span></button>
            <button onClick={()=>{setCreateMenuOpen(false);requestEnvironment()}}><Layers3 size={15}/><span><b>New Environment</b><small>Add DEV, TEST, QA or PROD</small></span></button>
            <button onClick={()=>{setCreateMenuOpen(false);requestArchitecture()}}><Network size={15}/><span><b>New Architecture</b><small>Create inside the current project</small></span></button>
          </div>}
        </div>
      </header>

      {view==='home'&&<Home
        {...p}
        projects={projects}
        onProjects={openProjects}
        onOpenProject={openProject}
        onNewProject={()=>setModal('project')}
      />}

      {view==='projects'&&<ProjectsPage
        projects={projects}
        onOpenProject={openProject}
        onNewProject={()=>setModal('project')}
      />}

      {view==='project'&&selectedProject&&<ProjectWorkspace
        project={selectedProject}
        onBack={openProjects}
        onNewEnvironment={requestEnvironment}
        onNewArchitecture={requestArchitecture}
        onOpenArchitecture={arch=>openArchitecture(selectedProject,arch)}
      />}

      {modal&&<div className="workspace-modal-overlay" onMouseDown={()=>setModal(null)}>
        <div className="workspace-modal" onMouseDown={e=>e.stopPropagation()}>
          <div className="workspace-modal-head">
            <div>
              <strong>{modal==='project'?'Create Project':modal==='environment'?'Create Environment':'Create Architecture'}</strong>
              <small>{modal==='project'?p.organizationName:selectedProject?.name||'Project'}</small>
            </div>
            <button onClick={()=>setModal(null)}><X size={16}/></button>
          </div>

          {modal==='project'&&<div className="workspace-modal-body">
            <label>Project name<input autoFocus value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} placeholder="Cloud Platform"/></label>
            <label>Description<textarea rows={3} value={newProjectDescription} onChange={e=>setNewProjectDescription(e.target.value)} placeholder="Describe the purpose of this project..."/></label>
            <div className="workspace-modal-actions"><button onClick={()=>setModal(null)}>Cancel</button><button className="primary" onClick={createProject}>Create Project</button></div>
          </div>}

          {modal==='environment'&&<div className="workspace-modal-body">
            <label>Environment name<input autoFocus value={newEnvironmentName} onChange={e=>setNewEnvironmentName(e.target.value)} placeholder="Production"/></label>
            <label>Environment type<select value={newEnvironmentType} onChange={e=>setNewEnvironmentType(e.target.value)}><option>DEV</option><option>TEST</option><option>QA</option><option>STAGE</option><option>PROD</option><option>DR</option></select></label>
            <div className="workspace-modal-actions"><button onClick={()=>setModal(null)}>Cancel</button><button className="primary" onClick={createEnvironment}>Create Environment</button></div>
          </div>}

          {modal==='architecture'&&selectedProject&&<div className="workspace-modal-body">
            <label>Architecture name<input autoFocus value={newArchitectureName} onChange={e=>setNewArchitectureName(e.target.value)} placeholder="AVD Enterprise Platform"/></label>
            <label>Environment<select value={newArchitectureEnvironment} onChange={e=>setNewArchitectureEnvironment(e.target.value)}>
              <option value="">Select environment...</option>
              {selectedProject.environments.map(e=><option value={e.id} key={e.id}>{e.name} ({e.type})</option>)}
            </select></label>
            <div className="workspace-modal-actions"><button onClick={()=>setModal(null)}>Cancel</button><button className="primary" onClick={createArchitecture}>Create & Open</button></div>
          </div>}
        </div>
      </div>}
    </main>
  </div>;
}

function Home(p:Props&{projects:ProjectRecord[];onProjects:()=>void;onOpenProject:(id:string)=>void;onNewProject:()=>void}){
  const totalArchitectures=p.projects.reduce((n,x)=>n+x.architectures.length,0);
  const totalEnvironments=p.projects.reduce((n,x)=>n+x.environments.length,0);
  return <div className="command-content">
    <section className="command-hero">
      <div><span className="eyebrow">CLOUD ARCHITECTURE WORKSPACE</span><h1>Good afternoon, Pranab.</h1><p>Organize cloud architecture by project, environment and design.</p></div>
      <button className="continue-button" onClick={p.onOpenEditor}><Sparkles size={16}/> Continue designing <ChevronRight size={15}/></button>
    </section>

    <section className="metric-grid">
      <Metric icon={<FolderKanban size={17}/>} label="Projects" value={String(p.projects.length)} hint={`Across ${p.organizationName}`}/>
      <Metric icon={<Layers3 size={17}/>} label="Environments" value={String(totalEnvironments)} hint="DEV · TEST · PROD · DR"/>
      <Metric icon={<Network size={17}/>} label="Architectures" value={String(totalArchitectures)} hint="Managed designs"/>
      <Metric icon={<Gauge size={17}/>} label="Current score" value={String(p.score)} hint="Architecture health"/>
    </section>

    <section className="command-section">
      <div className="section-head"><div><span className="section-kicker">WORKSPACES</span><h2>Projects</h2></div><div className="section-actions"><button onClick={p.onNewProject}><Plus size={14}/> New Project</button><button onClick={p.onProjects}>View all <ChevronRight size={14}/></button></div></div>
      <div className="project-card-grid">
        {p.projects.slice(0,3).map(project=><ProjectCard project={project} key={project.id} onClick={()=>p.onOpenProject(project.id)}/>)}
        {!p.projects.length&&<button className="empty-project-card" onClick={p.onNewProject}><Plus size={22}/><strong>Create your first project</strong><span>Projects contain environments and architectures.</span></button>}
      </div>
    </section>

    <section className="lower-grid">
      <div className="command-panel">
        <div className="panel-heading"><div><span className="section-kicker">CURRENT CONTEXT</span><h2>{p.currentDesignName}</h2></div></div>
        <div className="context-path"><span>{p.organizationName}</span><b>›</b><span>{p.projectName}</span><b>›</b><span>{p.environmentName}</span><b>›</b><strong>{p.currentDesignName}</strong></div>
        <div className="current-context-stats"><span><Cloud size={13}/> Azure</span><span><Boxes size={13}/> {p.resourceCount} resources</span><span><GitBranch size={13}/> {p.connectionCount} connections</span><span><CircleCheck size={13}/> Score {p.score}</span></div>
      </div>
      <div className="command-panel">
        <div className="panel-heading"><div><span className="section-kicker">DELIVERY</span><h2>Recent deployment status</h2></div></div>
        <div className="deployment-list">
          <div><span className="deploy-dot passed"/><div><strong>Production</strong><small>Terraform apply</small></div><b>PASSED</b></div>
          <div><span className="deploy-dot running"/><div><strong>QA</strong><small>Terraform plan</small></div><b>RUNNING</b></div>
        </div>
      </div>
    </section>
  </div>;
}

function ProjectsPage({projects,onOpenProject,onNewProject}:{projects:ProjectRecord[];onOpenProject:(id:string)=>void;onNewProject:()=>void}){
  return <div className="command-content">
    <section className="page-title-row">
      <div><span className="eyebrow">ORGANIZATION WORKSPACE</span><h1>Projects</h1><p>Group environments, architectures and delivery workflows by project.</p></div>
      <button className="command-create" onClick={onNewProject}><Plus size={15}/> New Project</button>
    </section>
    <div className="project-card-grid large">
      {projects.map(project=><ProjectCard project={project} key={project.id} onClick={()=>onOpenProject(project.id)}/>)}
      <button className="empty-project-card" onClick={onNewProject}><Plus size={22}/><strong>Create Project</strong><span>Start a new architecture workspace.</span></button>
    </div>
  </div>;
}

function ProjectWorkspace({project,onBack,onNewEnvironment,onNewArchitecture,onOpenArchitecture}:{project:ProjectRecord;onBack:()=>void;onNewEnvironment:()=>void;onNewArchitecture:()=>void;onOpenArchitecture:(a:ArchitectureRecord)=>void}){
  const[tab,setTab]=useState<'overview'|'architectures'|'environments'>('overview');
  return <div className="command-content project-workspace">
    <button className="workspace-back" onClick={onBack}><ChevronLeft size={14}/> Projects</button>

    <section className="project-hero">
      <div className="project-hero-icon"><FolderKanban size={24}/></div>
      <div><span className="eyebrow">PROJECT</span><h1>{project.name}</h1><p>{project.description}</p></div>
      <div className="project-hero-actions"><button onClick={onNewEnvironment}><Layers3 size={14}/> New Environment</button><button className="primary" onClick={onNewArchitecture}><Plus size={14}/> New Architecture</button></div>
    </section>

    <div className="project-tabs">
      <button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Overview</button>
      <button className={tab==='architectures'?'active':''} onClick={()=>setTab('architectures')}>Architectures <span>{project.architectures.length}</span></button>
      <button className={tab==='environments'?'active':''} onClick={()=>setTab('environments')}>Environments <span>{project.environments.length}</span></button>
    </div>

    {tab==='overview'&&<>
      <section className="metric-grid project-metrics">
        <Metric icon={<Network size={17}/>} label="Architectures" value={String(project.architectures.length)} hint="Cloud designs"/>
        <Metric icon={<Layers3 size={17}/>} label="Environments" value={String(project.environments.length)} hint="Deployment boundaries"/>
        <Metric icon={<CircleCheck size={17}/>} label="Healthy" value={String(project.architectures.filter(x=>x.score>=90).length)} hint="Score ≥ 90"/>
        <Metric icon={<Rocket size={17}/>} label="Deployments" value="0" hint="Connect CI/CD later"/>
      </section>

      <section className="command-section">
        <div className="section-head"><div><span className="section-kicker">ENVIRONMENTS</span><h2>Environment landscape</h2></div><button onClick={()=>setTab('environments')}>View all <ChevronRight size={14}/></button></div>
        <div className="environment-grid">
          {project.environments.map(env=><EnvironmentCard env={env} architectures={project.architectures.filter(a=>a.environmentId===env.id).length} key={env.id}/>)}
          {!project.environments.length&&<button className="empty-project-card" onClick={onNewEnvironment}><Plus size={20}/><strong>Create Environment</strong><span>Create DEV, TEST, PROD or DR.</span></button>}
        </div>
      </section>

      <section className="command-section">
        <div className="section-head"><div><span className="section-kicker">ARCHITECTURES</span><h2>Recent designs</h2></div><button onClick={()=>setTab('architectures')}>View all <ChevronRight size={14}/></button></div>
        <div className="architecture-simple-grid">
          {project.architectures.slice(0,3).map(a=><ArchitectureProjectCard key={a.id} arch={a} env={project.environments.find(e=>e.id===a.environmentId)} onOpen={()=>onOpenArchitecture(a)}/>)}
        </div>
      </section>
    </>}

    {tab==='environments'&&<section className="command-section">
      <div className="section-head"><div><span className="section-kicker">PROJECT ENVIRONMENTS</span><h2>Environments</h2></div><button onClick={onNewEnvironment}><Plus size={14}/> New Environment</button></div>
      <div className="environment-grid large">
        {project.environments.map(env=><EnvironmentCard env={env} architectures={project.architectures.filter(a=>a.environmentId===env.id).length} key={env.id}/>)}
        <button className="empty-project-card" onClick={onNewEnvironment}><Plus size={20}/><strong>Create Environment</strong><span>Add another deployment boundary.</span></button>
      </div>
    </section>}

    {tab==='architectures'&&<section className="command-section">
      <div className="section-head"><div><span className="section-kicker">PROJECT ARCHITECTURES</span><h2>Architectures</h2></div><button onClick={onNewArchitecture}><Plus size={14}/> New Architecture</button></div>
      <div className="architecture-simple-grid">
        {project.architectures.map(a=><ArchitectureProjectCard key={a.id} arch={a} env={project.environments.find(e=>e.id===a.environmentId)} onOpen={()=>onOpenArchitecture(a)}/>)}
        {!project.architectures.length&&<button className="empty-project-card" onClick={onNewArchitecture}><Plus size={20}/><strong>Create Architecture</strong><span>Choose an environment and start designing.</span></button>}
      </div>
    </section>}
  </div>;
}

function ProjectCard({project,onClick}:{project:ProjectRecord;onClick:()=>void}){
  return <button className="project-card" onClick={onClick}>
    <div className="project-card-top"><div className="project-card-icon"><FolderKanban size={18}/></div><MoreHorizontal size={16}/></div>
    <h3>{project.name}</h3><p>{project.description}</p>
    <div className="project-card-metrics"><span><Network size={12}/><b>{project.architectures.length}</b> architectures</span><span><Layers3 size={12}/><b>{project.environments.length}</b> environments</span></div>
    <div className="project-card-envs">{project.environments.slice(0,4).map(e=><em key={e.id}>{e.type}</em>)}</div>
    <div className="project-card-foot"><span>Open project</span><ChevronRight size={14}/></div>
  </button>;
}

function EnvironmentCard({env,architectures}:{env:EnvironmentRecord;architectures:number}){
  return <article className="environment-card">
    <div className={`environment-type type-${env.type.toLowerCase()}`}>{env.type}</div>
    <div><h3>{env.name}</h3><p>Deployment environment</p></div>
    <div className="environment-card-meta"><span><Network size={12}/>{architectures} architectures</span><span><ShieldCheck size={12}/> Isolated scope</span></div>
  </article>;
}

function ArchitectureProjectCard({arch,env,onOpen}:{arch:ArchitectureRecord;env?:EnvironmentRecord;onOpen:()=>void}){
  return <article className="architecture-project-card">
    <div className="architecture-project-preview"><div/><div/><div/><svg viewBox="0 0 260 100"><path d="M35 50H92V27H155V72H225" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div>
    <div className="architecture-project-body">
      <div><h3>{arch.name}</h3><p>{env?.name||'No environment'} · Azure</p></div>
      <div className="architecture-project-stats"><span>{arch.resources} resources</span><span>{arch.connections} connections</span><span>Score {arch.score}</span></div>
      <button onClick={onOpen}>Open Architecture <ChevronRight size={13}/></button>
    </div>
  </article>;
}

function Metric({icon,label,value,hint}:{icon:any;label:string;value:string;hint:string}){
  return <div className="metric-card"><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></div>
}
