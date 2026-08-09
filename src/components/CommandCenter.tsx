import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Archive, Boxes, LayoutTemplate, Building2, ChevronLeft, ChevronRight, CircleCheck, Cloud,
  Copy, Edit3, FolderKanban, Gauge, GitBranch, LayoutDashboard, Layers3, MoreHorizontal,
  MoveRight, Network, Plus, Rocket, Search, Settings, ShieldCheck, Sparkles, Trash2, X
} from 'lucide-react';

type EnvironmentRecord={
  id:string;
  name:string;
  type:string;
  description?:string;
  createdAt:string;
  updatedAt:string;
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
  archived?:boolean;
  templateId?:string;
};

type ProjectRecord={
  id:string;
  name:string;
  description:string;
  environments:EnvironmentRecord[];
  architectures:ArchitectureRecord[];
  createdAt:string;
  updatedAt:string;
  archived?:boolean;
};

type TemplateRecord={
  id:string;
  name:string;
  description:string;
  sourceProject?:string;
  environmentType?:string;
  cloud:'Azure';
  resources:number;
  connections:number;
  score:number;
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

const PROJECTS_KEY='archmindcanvas-project-workspace-v2';
const TEMPLATES_KEY='archmindcanvas-template-library-v1';
const uid=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const now=()=>new Date().toISOString();

const defaultProjects:ProjectRecord[]=[{
  id:'project-cloud-platform',
  name:'Cloud Platform',
  description:'Shared cloud platform and landing-zone architectures.',
  createdAt:now(),
  updatedAt:now(),
  environments:[
    {id:'env-dev',name:'Development',type:'DEV',createdAt:now(),updatedAt:now()},
    {id:'env-test',name:'Test',type:'TEST',createdAt:now(),updatedAt:now()},
    {id:'env-prod',name:'Production',type:'PROD',createdAt:now(),updatedAt:now()},
  ],
  architectures:[
    {id:'arch-current',name:'My Azure Architecture',environmentId:'env-prod',cloud:'Azure',resources:5,connections:0,score:100,updatedAt:now()}
  ]
}];

const defaultTemplates:TemplateRecord[]=[
  {id:'tpl-secure-web',name:'Secure Web Application',description:'App Gateway, application tier, data tier, Key Vault and private networking.',cloud:'Azure',resources:8,connections:7,score:96,environmentType:'PROD',createdAt:now()},
  {id:'tpl-hub-spoke',name:'Hub-Spoke Landing Zone',description:'Hub-spoke networking foundation with shared connectivity and security.',cloud:'Azure',resources:11,connections:10,score:95,environmentType:'PROD',createdAt:now()}
];

export default function CommandCenter(p:Props){
  const initialTarget=sessionStorage.getItem('archmind-dashboard-target');
  const[view,setView]=useState<'home'|'projects'|'project'|'environment'|'templates'>(initialTarget?.startsWith('project:')?'project':'home');
  const[projects,setProjects]=useState<ProjectRecord[]>(()=>{
    try{
      const raw=localStorage.getItem(PROJECTS_KEY)||localStorage.getItem('archmindcanvas-project-workspace-v1');
      return raw?JSON.parse(raw):defaultProjects;
    }catch{return defaultProjects}
  });
  const[templates,setTemplates]=useState<TemplateRecord[]>(()=>{
    try{const raw=localStorage.getItem(TEMPLATES_KEY);return raw?JSON.parse(raw):defaultTemplates}catch{return defaultTemplates}
  });
  const[selectedProjectId,setSelectedProjectId]=useState<string>(initialTarget?.startsWith('project:')?initialTarget.slice('project:'.length):(projects[0]?.id||''));
  const[selectedEnvironmentId,setSelectedEnvironmentId]=useState<string>('');
  const[createMenuOpen,setCreateMenuOpen]=useState(false);
  const[menuKey,setMenuKey]=useState<string>('');

  const[modal,setModal]=useState<
    'project-create'|'project-rename'|'environment-create'|'environment-rename'|
    'architecture-create'|'architecture-rename'|'architecture-move'|'template-save'|'template-create'
    |null
  >(null);
  const[targetId,setTargetId]=useState('');
  const[nameInput,setNameInput]=useState('');
  const[descriptionInput,setDescriptionInput]=useState('');
  const[environmentType,setEnvironmentType]=useState('DEV');
  const[environmentSelect,setEnvironmentSelect]=useState('');
  const[templateSelect,setTemplateSelect]=useState('');

  useEffect(()=>{localStorage.setItem(PROJECTS_KEY,JSON.stringify(projects));},[projects]);
  useEffect(()=>{localStorage.setItem(TEMPLATES_KEY,JSON.stringify(templates));},[templates]);
  useEffect(()=>{sessionStorage.removeItem('archmind-dashboard-target');},[]);

  const selectedProject=useMemo(()=>projects.find(x=>x.id===selectedProjectId)||projects.find(x=>!x.archived)||projects[0],[projects,selectedProjectId]);
  const selectedEnvironment=useMemo(()=>selectedProject?.environments.find(x=>x.id===selectedEnvironmentId),[selectedProject,selectedEnvironmentId]);

  const touchProject=(project:ProjectRecord)=>({...project,updatedAt:now()});
  const resetModal=()=>{setModal(null);setTargetId('');setNameInput('');setDescriptionInput('');setEnvironmentType('DEV');setEnvironmentSelect('');setTemplateSelect('');};

  const goProject=(id:string)=>{setSelectedProjectId(id);setSelectedEnvironmentId('');setView('project');setMenuKey('')};
  const goEnvironment=(envId:string)=>{setSelectedEnvironmentId(envId);setView('environment');setMenuKey('')};

  const createProject=()=>{
    const name=nameInput.trim(); if(!name)return;
    const project:ProjectRecord={id:uid('project'),name,description:descriptionInput.trim()||'Cloud architecture project',createdAt:now(),updatedAt:now(),environments:[],architectures:[]};
    setProjects(v=>[...v,project]);setSelectedProjectId(project.id);resetModal();setView('project');
  };

  const renameProject=()=>{
    const name=nameInput.trim();if(!name)return;
    setProjects(v=>v.map(pr=>pr.id===targetId?{...pr,name,description:descriptionInput.trim()||pr.description,updatedAt:now()}:pr));resetModal();
  };

  const archiveProject=(id:string)=>setProjects(v=>v.map(pr=>pr.id===id?{...pr,archived:true,updatedAt:now()}:pr));
  const deleteProject=(id:string)=>{
    if(!confirm('Delete this project and all of its environment/architecture metadata?'))return;
    setProjects(v=>v.filter(pr=>pr.id!==id));setView('projects');setMenuKey('');
  };

  const createEnvironment=()=>{
    if(!selectedProject)return;
    const name=nameInput.trim();if(!name)return;
    const env:EnvironmentRecord={id:uid('env'),name,type:environmentType,description:descriptionInput.trim(),createdAt:now(),updatedAt:now()};
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?touchProject({...pr,environments:[...pr.environments,env]}):pr));resetModal();
  };

  const renameEnvironment=()=>{
    if(!selectedProject)return;
    const name=nameInput.trim();if(!name)return;
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?touchProject({...pr,environments:pr.environments.map(e=>e.id===targetId?{...e,name,type:environmentType,description:descriptionInput.trim(),updatedAt:now()}:e)}):pr));resetModal();
  };

  const deleteEnvironment=(envId:string)=>{
    if(!selectedProject)return;
    const used=selectedProject.architectures.some(a=>a.environmentId===envId&&!a.archived);
    if(used){alert('Move or delete the architectures in this environment before deleting it.');return}
    if(!confirm('Delete this environment?'))return;
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?touchProject({...pr,environments:pr.environments.filter(e=>e.id!==envId)}):pr));
    setView('project');setSelectedEnvironmentId('');setMenuKey('');
  };

  const createArchitecture=()=>{
    if(!selectedProject)return;
    const name=nameInput.trim();if(!name||!environmentSelect)return;
    const template=templates.find(t=>t.id===templateSelect);
    const arch:ArchitectureRecord={
      id:uid('arch'),name,environmentId:environmentSelect,cloud:'Azure',
      resources:template?.resources||0,connections:template?.connections||0,score:template?.score||100,
      templateId:template?.id,updatedAt:now()
    };
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?touchProject({...pr,architectures:[...pr.architectures,arch]}):pr));
    const env=selectedProject.environments.find(e=>e.id===environmentSelect);
    resetModal();
    if(env)p.onOpenArchitecture({projectId:selectedProject.id,projectName:selectedProject.name,environmentId:env.id,environmentName:env.name,architectureId:arch.id,architectureName:arch.name});
  };

  const renameArchitecture=()=>{
    if(!selectedProject)return;
    const name=nameInput.trim();if(!name)return;
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?touchProject({...pr,architectures:pr.architectures.map(a=>a.id===targetId?{...a,name,updatedAt:now()}:a)}):pr));resetModal();
  };

  const duplicateArchitecture=(arch:ArchitectureRecord)=>{
    if(!selectedProject)return;
    const copy:ArchitectureRecord={...arch,id:uid('arch'),name:`${arch.name} - Copy`,updatedAt:now(),archived:false};
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?touchProject({...pr,architectures:[...pr.architectures,copy]}):pr));setMenuKey('');
  };

  const moveArchitecture=()=>{
    if(!selectedProject||!environmentSelect)return;
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?touchProject({...pr,architectures:pr.architectures.map(a=>a.id===targetId?{...a,environmentId:environmentSelect,updatedAt:now()}:a)}):pr));resetModal();
  };

  const archiveArchitecture=(archId:string)=>{
    if(!selectedProject)return;
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?touchProject({...pr,architectures:pr.architectures.map(a=>a.id===archId?{...a,archived:true,updatedAt:now()}:a)}):pr));setMenuKey('');
  };

  const deleteArchitecture=(archId:string)=>{
    if(!selectedProject||!confirm('Delete this architecture metadata?'))return;
    setProjects(v=>v.map(pr=>pr.id===selectedProject.id?touchProject({...pr,architectures:pr.architectures.filter(a=>a.id!==archId)}):pr));setMenuKey('');
  };

  const saveTemplate=()=>{
    if(!selectedProject)return;
    const arch=selectedProject.architectures.find(a=>a.id===targetId);if(!arch)return;
    const env=selectedProject.environments.find(e=>e.id===arch.environmentId);
    const name=nameInput.trim()||arch.name;
    const tpl:TemplateRecord={id:uid('tpl'),name,description:descriptionInput.trim()||`Template created from ${arch.name}`,sourceProject:selectedProject.name,environmentType:env?.type,cloud:'Azure',resources:arch.resources,connections:arch.connections,score:arch.score,createdAt:now()};
    setTemplates(v=>[...v,tpl]);resetModal();
  };

  const deleteTemplate=(id:string)=>{if(confirm('Delete this template?'))setTemplates(v=>v.filter(t=>t.id!==id))};

  const openArchitecture=(project:ProjectRecord,arch:ArchitectureRecord)=>{
    const env=project.environments.find(e=>e.id===arch.environmentId);if(!env)return;
    p.onOpenArchitecture({projectId:project.id,projectName:project.name,environmentId:env.id,environmentName:env.name,architectureId:arch.id,architectureName:arch.name});
  };

  const requestArchitecture=(envId?:string,templateId?:string)=>{
    if(!selectedProject){setView('projects');return}
    if(!selectedProject.environments.length){setModal('environment-create');return}
    setEnvironmentSelect(envId||selectedProject.environments[0].id);
    setTemplateSelect(templateId||'');
    if(templateId){const t=templates.find(x=>x.id===templateId);setNameInput(t?.name||'')}
    setModal('architecture-create');
  };

  const editProject=(pr:ProjectRecord)=>{setTargetId(pr.id);setNameInput(pr.name);setDescriptionInput(pr.description);setModal('project-rename');setMenuKey('')};
  const editEnvironment=(env:EnvironmentRecord)=>{setTargetId(env.id);setNameInput(env.name);setDescriptionInput(env.description||'');setEnvironmentType(env.type);setModal('environment-rename');setMenuKey('')};
  const editArchitecture=(a:ArchitectureRecord)=>{setTargetId(a.id);setNameInput(a.name);setModal('architecture-rename');setMenuKey('')};
  const requestMove=(a:ArchitectureRecord)=>{setTargetId(a.id);setEnvironmentSelect(a.environmentId);setModal('architecture-move');setMenuKey('')};
  const requestTemplate=(a:ArchitectureRecord)=>{setTargetId(a.id);setNameInput(a.name);setDescriptionInput(`Reusable template from ${a.name}`);setModal('template-save');setMenuKey('')};

  const activeProjects=projects.filter(p=>!p.archived);

  return <div className="command-center-shell">
    <aside className="command-sidebar">
      <div className="command-brand"><div className="command-brand-mark"><Sparkles size={19}/></div><div><strong>ArchMindCanvas</strong><small>Cloud Architecture Platform</small></div></div>
      <div className="command-org"><small>ORGANIZATION</small><button onClick={p.onOpenScopeManager}><Building2 size={15}/><span>{p.organizationName}</span><ChevronRight size={13}/></button></div>
      <nav className="command-nav">
        <button className={view==='home'?'active':''} onClick={()=>setView('home')}><LayoutDashboard size={16}/><span>Home</span></button>
        <button className={view==='projects'||view==='project'||view==='environment'?'active':''} onClick={()=>setView('projects')}><FolderKanban size={16}/><span>Projects</span><em>{activeProjects.length}</em></button>
        <button className={view==='templates'?'active':''} onClick={()=>setView('templates')}><LayoutTemplate size={16}/><span>Templates</span><em>{templates.length}</em></button>
        <button><Activity size={16}/><span>Activity</span></button>
        <div className="nav-divider"/><button><Settings size={16}/><span>Settings</span></button>
      </nav>
      <div className="command-sidebar-footer"><div className="org-health"><span className="health-dot"/><div><strong>Platform healthy</strong><small>All systems operational</small></div></div><button className="profile-button"><span>PB</span><div><strong>Pranab Baro</strong><small>Organization Admin</small></div></button></div>
    </aside>

    <main className="command-main">
      <header className="command-header">
        <div className="command-search"><Search size={16}/><input placeholder="Search projects, environments, architectures, templates..."/><kbd>⌘ K</kbd></div>
        <div className="create-menu-wrap">
          <button className="command-create" onClick={()=>setCreateMenuOpen(v=>!v)}><Plus size={16}/> Create</button>
          {createMenuOpen&&<div className="command-create-menu">
            <button onClick={()=>{setCreateMenuOpen(false);setModal('project-create')}}><FolderKanban size={15}/><span><b>New Project</b><small>Create a project workspace</small></span></button>
            <button onClick={()=>{setCreateMenuOpen(false);selectedProject?setModal('environment-create'):setView('projects')}}><Layers3 size={15}/><span><b>New Environment</b><small>Inside the current project</small></span></button>
            <button onClick={()=>{setCreateMenuOpen(false);requestArchitecture()}}><Network size={15}/><span><b>New Architecture</b><small>Choose project environment</small></span></button>
          </div>}
        </div>
      </header>

      {view==='home'&&<Home {...p} projects={activeProjects} templates={templates} onProject={goProject} onProjects={()=>setView('projects')} onTemplates={()=>setView('templates')} onNewProject={()=>setModal('project-create')}/>}
      {view==='projects'&&<Projects projects={activeProjects} onOpen={goProject} onNew={()=>setModal('project-create')} onEdit={editProject} onArchive={archiveProject} onDelete={deleteProject} menuKey={menuKey} setMenuKey={setMenuKey}/>}
      {view==='project'&&selectedProject&&<ProjectWorkspace project={selectedProject} onProjects={()=>setView('projects')} onEnvironment={goEnvironment} onNewEnvironment={()=>setModal('environment-create')} onNewArchitecture={()=>requestArchitecture()} onArchitecture={(a:ArchitectureRecord)=>openArchitecture(selectedProject,a)} onEditEnvironment={editEnvironment} onDeleteEnvironment={deleteEnvironment} onEditArchitecture={editArchitecture} onDuplicateArchitecture={duplicateArchitecture} onMoveArchitecture={requestMove} onTemplateArchitecture={requestTemplate} onArchiveArchitecture={archiveArchitecture} onDeleteArchitecture={deleteArchitecture} menuKey={menuKey} setMenuKey={setMenuKey}/>}
      {view==='environment'&&selectedProject&&selectedEnvironment&&<EnvironmentWorkspace project={selectedProject} env={selectedEnvironment} onProject={()=>setView('project')} onNewArchitecture={()=>requestArchitecture(selectedEnvironment.id)} onOpen={(a:ArchitectureRecord)=>openArchitecture(selectedProject,a)} onEditArchitecture={editArchitecture} onDuplicateArchitecture={duplicateArchitecture} onMoveArchitecture={requestMove} onTemplateArchitecture={requestTemplate} onArchiveArchitecture={archiveArchitecture} onDeleteArchitecture={deleteArchitecture} menuKey={menuKey} setMenuKey={setMenuKey}/>}
      {view==='templates'&&<TemplatesPage templates={templates} projects={activeProjects} selectedProject={selectedProject} onCreateFromTemplate={(tpl:TemplateRecord)=>{if(!selectedProject){setView('projects');return}requestArchitecture(undefined,tpl.id)}} onDelete={deleteTemplate}/>}

      {modal&&<Modal title={modalTitle(modal)} subtitle={selectedProject?.name||p.organizationName} onClose={resetModal}>
        {(modal==='project-create'||modal==='project-rename')&&<>
          <Field label="Project name"><input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Cloud Platform"/></Field>
          <Field label="Description"><textarea rows={3} value={descriptionInput} onChange={e=>setDescriptionInput(e.target.value)} placeholder="Purpose of this project..."/></Field>
          <Actions onCancel={resetModal} onConfirm={modal==='project-create'?createProject:renameProject} label={modal==='project-create'?'Create Project':'Save Changes'}/>
        </>}
        {(modal==='environment-create'||modal==='environment-rename')&&<>
          <Field label="Environment name"><input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Production"/></Field>
          <Field label="Environment type"><select value={environmentType} onChange={e=>setEnvironmentType(e.target.value)}><option>DEV</option><option>TEST</option><option>QA</option><option>STAGE</option><option>PROD</option><option>DR</option></select></Field>
          <Field label="Description"><textarea rows={2} value={descriptionInput} onChange={e=>setDescriptionInput(e.target.value)}/></Field>
          <Actions onCancel={resetModal} onConfirm={modal==='environment-create'?createEnvironment:renameEnvironment} label={modal==='environment-create'?'Create Environment':'Save Changes'}/>
        </>}
        {modal==='architecture-create'&&selectedProject&&<>
          <Field label="Architecture name"><input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="AVD Enterprise Platform"/></Field>
          <Field label="Environment"><select value={environmentSelect} onChange={e=>setEnvironmentSelect(e.target.value)}><option value="">Select environment...</option>{selectedProject.environments.map(e=><option value={e.id} key={e.id}>{e.name} ({e.type})</option>)}</select></Field>
          <Field label="Start from"><select value={templateSelect} onChange={e=>setTemplateSelect(e.target.value)}><option value="">Blank architecture</option>{templates.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></Field>
          <Actions onCancel={resetModal} onConfirm={createArchitecture} label="Create & Open"/>
        </>}
        {modal==='architecture-rename'&&<><Field label="Architecture name"><input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)}/></Field><Actions onCancel={resetModal} onConfirm={renameArchitecture} label="Rename"/></>}
        {modal==='architecture-move'&&selectedProject&&<><Field label="Move to environment"><select value={environmentSelect} onChange={e=>setEnvironmentSelect(e.target.value)}>{selectedProject.environments.map(e=><option value={e.id} key={e.id}>{e.name} ({e.type})</option>)}</select></Field><Actions onCancel={resetModal} onConfirm={moveArchitecture} label="Move Architecture"/></>}
        {modal==='template-save'&&<><Field label="Template name"><input value={nameInput} onChange={e=>setNameInput(e.target.value)}/></Field><Field label="Description"><textarea rows={3} value={descriptionInput} onChange={e=>setDescriptionInput(e.target.value)}/></Field><Actions onCancel={resetModal} onConfirm={saveTemplate} label="Save Template"/></>}
      </Modal>}
    </main>
  </div>;
}

function Home(p:Props&{projects:ProjectRecord[];templates:TemplateRecord[];onProject:(id:string)=>void;onProjects:()=>void;onTemplates:()=>void;onNewProject:()=>void}){
  const envs=p.projects.reduce((n,x)=>n+x.environments.length,0), archs=p.projects.reduce((n,x)=>n+x.architectures.filter(a=>!a.archived).length,0);
  return <div className="command-content">
    <section className="command-hero"><div><span className="eyebrow">CLOUD ARCHITECTURE WORKSPACE</span><h1>Good afternoon, Pranab.</h1><p>Organize, design and govern cloud architecture from one workspace.</p></div><button className="continue-button" onClick={p.onOpenEditor}><Sparkles size={16}/> Continue designing <ChevronRight size={15}/></button></section>
    <section className="metric-grid"><Metric icon={<FolderKanban size={17}/>} label="Projects" value={String(p.projects.length)} hint={`Across ${p.organizationName}`}/><Metric icon={<Layers3 size={17}/>} label="Environments" value={String(envs)} hint="DEV · TEST · PROD · DR"/><Metric icon={<Network size={17}/>} label="Architectures" value={String(archs)} hint="Active designs"/><Metric icon={<LayoutTemplate size={17}/>} label="Templates" value={String(p.templates.length)} hint="Reusable patterns"/></section>
    <section className="command-section"><div className="section-head"><div><span className="section-kicker">WORKSPACES</span><h2>Projects</h2></div><div className="section-actions"><button onClick={p.onNewProject}><Plus size={14}/> New Project</button><button onClick={p.onProjects}>View all <ChevronRight size={14}/></button></div></div><div className="project-card-grid">{p.projects.slice(0,3).map(pr=><ProjectCard project={pr} key={pr.id} onClick={()=>p.onProject(pr.id)}/>)}</div></section>
    <section className="lower-grid"><div className="command-panel"><div className="panel-heading"><div><span className="section-kicker">CURRENT CONTEXT</span><h2>{p.currentDesignName}</h2></div></div><div className="context-path"><span>{p.organizationName}</span><b>›</b><span>{p.projectName}</span><b>›</b><span>{p.environmentName}</span><b>›</b><strong>{p.currentDesignName}</strong></div><div className="current-context-stats"><span><Cloud size={13}/> Azure</span><span><Boxes size={13}/> {p.resourceCount} resources</span><span><GitBranch size={13}/> {p.connectionCount} connections</span><span><CircleCheck size={13}/> Score {p.score}</span></div></div><div className="command-panel template-summary-card"><div className="panel-heading"><div><span className="section-kicker">TEMPLATES</span><h2>Reusable architecture patterns</h2></div><button onClick={p.onTemplates}>Open library</button></div><p>{p.templates.length} templates are available to accelerate new architecture creation.</p></div></section>
  </div>
}

function Projects({projects,onOpen,onNew,onEdit,onArchive,onDelete,menuKey,setMenuKey}:{projects:ProjectRecord[];onOpen:(id:string)=>void;onNew:()=>void;onEdit:(p:ProjectRecord)=>void;onArchive:(id:string)=>void;onDelete:(id:string)=>void;menuKey:string;setMenuKey:(x:string)=>void}){
  return <div className="command-content"><section className="page-title-row"><div><span className="eyebrow">ORGANIZATION WORKSPACE</span><h1>Projects</h1><p>Projects group environments, architectures and governance context.</p></div><button className="command-create" onClick={onNew}><Plus size={15}/> New Project</button></section><div className="project-card-grid large">{projects.map(pr=><div className="entity-card-wrap" key={pr.id}><ProjectCard project={pr} onClick={()=>onOpen(pr.id)}/><EntityMenu open={menuKey===`project:${pr.id}`} onToggle={()=>setMenuKey(menuKey===`project:${pr.id}`?'':`project:${pr.id}`)} items={[['Rename',()=>onEdit(pr),<Edit3 size={13}/>],['Archive',()=>onArchive(pr.id),<Archive size={13}/>],['Delete',()=>onDelete(pr.id),<Trash2 size={13}/>]]}/></div>)}<button className="empty-project-card" onClick={onNew}><Plus size={22}/><strong>Create Project</strong><span>Start a new architecture workspace.</span></button></div></div>
}

function ProjectWorkspace(props:any){
  const {project,onProjects,onEnvironment,onNewEnvironment,onNewArchitecture,onArchitecture,onEditEnvironment,onDeleteEnvironment,onEditArchitecture,onDuplicateArchitecture,onMoveArchitecture,onTemplateArchitecture,onArchiveArchitecture,onDeleteArchitecture,menuKey,setMenuKey}=props;
  const[tab,setTab]=useState<'overview'|'architectures'|'environments'>('overview');
  const activeArch=project.architectures.filter((a:ArchitectureRecord)=>!a.archived);
  return <div className="command-content project-workspace">
    <div className="workspace-nav-path"><button onClick={onProjects}><Building2 size={12}/> Projects</button><b>›</b><strong>{project.name}</strong></div>
    <section className="project-hero"><div className="project-hero-icon"><FolderKanban size={24}/></div><div><span className="eyebrow">PROJECT</span><h1>{project.name}</h1><p>{project.description}</p></div><div className="project-hero-actions"><button onClick={onNewEnvironment}><Layers3 size={14}/> New Environment</button><button className="primary" onClick={onNewArchitecture}><Plus size={14}/> New Architecture</button></div></section>
    <div className="project-tabs"><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Overview</button><button className={tab==='architectures'?'active':''} onClick={()=>setTab('architectures')}>Architectures <span>{activeArch.length}</span></button><button className={tab==='environments'?'active':''} onClick={()=>setTab('environments')}>Environments <span>{project.environments.length}</span></button></div>
    {tab==='overview'&&<><section className="metric-grid project-metrics"><Metric icon={<Network size={17}/>} label="Architectures" value={String(activeArch.length)} hint="Active designs"/><Metric icon={<Layers3 size={17}/>} label="Environments" value={String(project.environments.length)} hint="Deployment boundaries"/><Metric icon={<CircleCheck size={17}/>} label="Healthy" value={String(activeArch.filter((x:ArchitectureRecord)=>x.score>=90).length)} hint="Score ≥ 90"/><Metric icon={<Rocket size={17}/>} label="Deployments" value="0" hint="CI/CD later"/></section><EnvironmentSection project={project} onEnvironment={onEnvironment} onNew={onNewEnvironment} onEdit={onEditEnvironment} onDelete={onDeleteEnvironment} menuKey={menuKey} setMenuKey={setMenuKey}/><ArchitectureSection project={project} architectures={activeArch.slice(0,3)} onOpen={onArchitecture} onNew={onNewArchitecture} actions={{onEditArchitecture,onDuplicateArchitecture,onMoveArchitecture,onTemplateArchitecture,onArchiveArchitecture,onDeleteArchitecture}} menuKey={menuKey} setMenuKey={setMenuKey}/></>}
    {tab==='environments'&&<EnvironmentSection project={project} onEnvironment={onEnvironment} onNew={onNewEnvironment} onEdit={onEditEnvironment} onDelete={onDeleteEnvironment} menuKey={menuKey} setMenuKey={setMenuKey} all/>}
    {tab==='architectures'&&<ArchitectureSection project={project} architectures={activeArch} onOpen={onArchitecture} onNew={onNewArchitecture} actions={{onEditArchitecture,onDuplicateArchitecture,onMoveArchitecture,onTemplateArchitecture,onArchiveArchitecture,onDeleteArchitecture}} menuKey={menuKey} setMenuKey={setMenuKey} all/>}
  </div>
}

function EnvironmentWorkspace({project,env,onProject,onNewArchitecture,onOpen,onEditArchitecture,onDuplicateArchitecture,onMoveArchitecture,onTemplateArchitecture,onArchiveArchitecture,onDeleteArchitecture,menuKey,setMenuKey}:any){
  const arch=project.architectures.filter((a:ArchitectureRecord)=>a.environmentId===env.id&&!a.archived);
  return <div className="command-content">
    <div className="workspace-nav-path"><button onClick={onProject}><FolderKanban size={12}/>{project.name}</button><b>›</b><strong>{env.name}</strong></div>
    <section className="project-hero environment-hero"><div className="project-hero-icon"><Layers3 size={24}/></div><div><span className="eyebrow">{env.type} ENVIRONMENT</span><h1>{env.name}</h1><p>{env.description||`Architecture workspace for ${env.name}.`}</p></div><div className="project-hero-actions"><button className="primary" onClick={onNewArchitecture}><Plus size={14}/> New Architecture</button></div></section>
    <ArchitectureSection project={project} architectures={arch} onOpen={onOpen} onNew={onNewArchitecture} actions={{onEditArchitecture,onDuplicateArchitecture,onMoveArchitecture,onTemplateArchitecture,onArchiveArchitecture,onDeleteArchitecture}} menuKey={menuKey} setMenuKey={setMenuKey} all/>
  </div>
}

function EnvironmentSection({project,onEnvironment,onNew,onEdit,onDelete,menuKey,setMenuKey,all}:any){
  return <section className="command-section"><div className="section-head"><div><span className="section-kicker">ENVIRONMENTS</span><h2>{all?'Project environments':'Environment landscape'}</h2></div><button onClick={onNew}><Plus size={14}/> New Environment</button></div><div className={`environment-grid ${all?'large':''}`}>{project.environments.map((env:EnvironmentRecord)=><div className="entity-card-wrap" key={env.id}><EnvironmentCard env={env} architectures={project.architectures.filter((a:ArchitectureRecord)=>a.environmentId===env.id&&!a.archived).length} onClick={()=>onEnvironment(env.id)}/><EntityMenu open={menuKey===`env:${env.id}`} onToggle={()=>setMenuKey(menuKey===`env:${env.id}`?'':`env:${env.id}`)} items={[['Rename',()=>onEdit(env),<Edit3 size={13}/>],['Delete',()=>onDelete(env.id),<Trash2 size={13}/>]]}/></div>)}</div></section>
}

function ArchitectureSection({project,architectures,onOpen,onNew,actions,menuKey,setMenuKey,all}:any){
  return <section className="command-section"><div className="section-head"><div><span className="section-kicker">ARCHITECTURES</span><h2>{all?'Architecture library':'Recent designs'}</h2></div><button onClick={onNew}><Plus size={14}/> New Architecture</button></div><div className="architecture-simple-grid">{architectures.map((a:ArchitectureRecord)=><ArchitectureProjectCard key={a.id} arch={a} env={project.environments.find((e:EnvironmentRecord)=>e.id===a.environmentId)} onOpen={()=>onOpen(a)} menuOpen={menuKey===`arch:${a.id}`} onMenu={()=>setMenuKey(menuKey===`arch:${a.id}`?'':`arch:${a.id}`)} menuItems={[['Rename',()=>actions.onEditArchitecture(a),<Edit3 size={13}/>],['Duplicate',()=>actions.onDuplicateArchitecture(a),<Copy size={13}/>],['Move',()=>actions.onMoveArchitecture(a),<MoveRight size={13}/>],['Save as Template',()=>actions.onTemplateArchitecture(a),<LayoutTemplate size={13}/>],['Archive',()=>actions.onArchiveArchitecture(a.id),<Archive size={13}/>],['Delete',()=>actions.onDeleteArchitecture(a.id),<Trash2 size={13}/>]]}/>)}</div></section>
}

function TemplatesPage({templates,projects,selectedProject,onCreateFromTemplate,onDelete}:any){
  return <div className="command-content"><section className="page-title-row"><div><span className="eyebrow">REUSABLE ARCHITECTURE PATTERNS</span><h1>Templates</h1><p>Create consistent architectures faster using approved reusable patterns.</p></div></section><div className="template-grid">{templates.map((t:TemplateRecord)=><article className="template-card" key={t.id}><div className="template-preview"><LayoutTemplate size={25}/></div><div className="template-body"><div><h3>{t.name}</h3><p>{t.description}</p></div><div className="template-meta"><span><Cloud size={12}/> Azure</span><span>{t.resources} resources</span><span>Score {t.score}</span></div><div className="template-actions"><button onClick={()=>onCreateFromTemplate(t)}><Plus size={13}/> Create Architecture</button><button className="danger-ghost" onClick={()=>onDelete(t.id)}><Trash2 size={13}/></button></div></div></article>)}</div></div>
}

function ProjectCard({project,onClick}:{project:ProjectRecord;onClick:()=>void}){
  const active=project.architectures.filter(a=>!a.archived).length;
  return <button className="project-card" onClick={onClick}><div className="project-card-top"><div className="project-card-icon"><FolderKanban size={18}/></div><span className="last-updated">Updated {relative(project.updatedAt)}</span></div><h3>{project.name}</h3><p>{project.description}</p><div className="project-card-metrics"><span><Network size={12}/><b>{active}</b> architectures</span><span><Layers3 size={12}/><b>{project.environments.length}</b> environments</span></div><div className="project-card-envs">{project.environments.slice(0,5).map(e=><em key={e.id}>{e.type}</em>)}</div><div className="project-card-foot"><span>Open project</span><ChevronRight size={14}/></div></button>
}

function EnvironmentCard({env,architectures,onClick}:{env:EnvironmentRecord;architectures:number;onClick:()=>void}){
  return <button className="environment-card clickable" onClick={onClick}><div className={`environment-type type-${env.type.toLowerCase()}`}>{env.type}</div><div><h3>{env.name}</h3><p>{env.description||'Deployment environment'}</p></div><div className="environment-card-meta"><span><Network size={12}/>{architectures} architectures</span><span><ShieldCheck size={12}/> Isolated scope</span></div><div className="environment-open">Open environment <ChevronRight size={12}/></div></button>
}

function ArchitectureProjectCard({arch,env,onOpen,menuOpen,onMenu,menuItems}:any){
  return <article className="architecture-project-card"><div className="architecture-project-preview"><div/><div/><div/><svg viewBox="0 0 260 100"><path d="M35 50H92V27H155V72H225" fill="none" stroke="currentColor" strokeWidth="2"/></svg><button className="card-more" onClick={e=>{e.stopPropagation();onMenu()}}><MoreHorizontal size={15}/></button>{menuOpen&&<EntityMenuPanel items={menuItems}/>}</div><div className="architecture-project-body"><div><h3>{arch.name}</h3><p>{env?.name||'No environment'} · Azure</p></div><div className="architecture-project-stats"><span>{arch.resources} resources</span><span>{arch.connections} connections</span><span>Score {arch.score}</span></div><div className="architecture-card-bottom"><span>Updated {relative(arch.updatedAt)}</span><button onClick={onOpen}>Open <ChevronRight size={13}/></button></div></div></article>
}

function EntityMenu({open,onToggle,items}:any){return <div className="entity-menu-anchor"><button className="entity-menu-trigger" onClick={e=>{e.stopPropagation();onToggle()}}><MoreHorizontal size={15}/></button>{open&&<EntityMenuPanel items={items}/>}</div>}
function EntityMenuPanel({items}:any){return <div className="entity-menu-panel">{items.map((it:any,i:number)=><button key={i} onClick={e=>{e.stopPropagation();it[1]()}}>{it[2]}<span>{it[0]}</span></button>)}</div>}

function Modal({title,subtitle,onClose,children}:any){return <div className="workspace-modal-overlay" onMouseDown={onClose}><div className="workspace-modal" onMouseDown={e=>e.stopPropagation()}><div className="workspace-modal-head"><div><strong>{title}</strong><small>{subtitle}</small></div><button onClick={onClose}><X size={16}/></button></div><div className="workspace-modal-body">{children}</div></div></div>}
function Field({label,children}:any){return <label>{label}{children}</label>}
function Actions({onCancel,onConfirm,label}:any){return <div className="workspace-modal-actions"><button onClick={onCancel}>Cancel</button><button className="primary" onClick={onConfirm}>{label}</button></div>}
function Metric({icon,label,value,hint}:{icon:any;label:string;value:string;hint:string}){return <div className="metric-card"><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></div>}
function modalTitle(x:string){return x.includes('project')?(x.includes('create')?'Create Project':'Edit Project'):x.includes('environment')?(x.includes('create')?'Create Environment':'Edit Environment'):x==='architecture-create'?'Create Architecture':x==='architecture-rename'?'Rename Architecture':x==='architecture-move'?'Move Architecture':'Save as Template'}
function relative(iso:string){const ms=Date.now()-new Date(iso).getTime(),min=Math.floor(ms/60000);if(min<1)return'just now';if(min<60)return`${min}m ago`;const h=Math.floor(min/60);if(h<24)return`${h}h ago`;const d=Math.floor(h/24);return`${d}d ago`}
