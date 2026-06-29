import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import KanbanBoard from './KanbanBoard';
import TaskModal from './TaskModal';

const ProjectDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const orgLocal = JSON.parse(localStorage.getItem('org') || 'null');
  const [projectData, setProjectData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({ type: 'Task', title: '', description: '', priority: 'Medium', status: 'To Do', assignee: '', storyPoints: 0, sprintId: '' });
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [showAddToSprint, setShowAddToSprint] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', startDate: '', targetEndDate: '', status: 'Active' });
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    if (!orgLocal) {
      navigate('/login');
      return;
    }
    fetchProject();
  }, [id, navigate]);

  const fetchProject = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${id}`);
      setProjectData(res.data);
    } catch (err) {
      console.error(err);
      navigate('/organization');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        ...newTask,
        sprintId: newTask.sprintId || undefined,
        storyPoints: newTask.storyPoints || 0
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/projects/${id}/tasks`, taskData);
      setIsCreatingTask(false);
      setNewTask({ type: 'Task', title: '', description: '', priority: 'Medium', status: 'To Do', assignee: '', storyPoints: 0, sprintId: '' });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMembers = async (memberName: string) => {
    let updatedMembers = [...(projectData.assignedMembers || [])];
    if (updatedMembers.includes(memberName)) {
      updatedMembers = updatedMembers.filter(m => m !== memberName);
    } else {
      updatedMembers.push(memberName);
    }
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, { assignedMembers: updatedMembers });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/projects/${id}/tasks/${taskId}`);
      fetchProject();
    } catch (err) { console.error(err); }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/projects/${id}/tasks/${taskId}`, { status });
      fetchProject();
    } catch (err) { console.error(err); }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/projects/${id}/sprints`, newSprint);
      setIsCreatingSprint(false);
      setNewSprint({ name: '', goal: '', startDate: '', endDate: '' });
      fetchProject();
    } catch (err) { console.error(err); }
  };

  const handleUpdateSprint = async (sprintId: string, data: any) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/projects/${id}/sprints/${sprintId}`, data);
      fetchProject();
    } catch (err) { console.error(err); }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!window.confirm('Delete this sprint?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/projects/${id}/sprints/${sprintId}`);
      fetchProject();
    } catch (err) { console.error(err); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, settingsForm);
      setEditingSettings(false);
      fetchProject();
    } catch (err) { console.error(err); }
  };

  const openSettings = () => {
    setSettingsForm({
      name: projectData.name || '',
      description: projectData.description || '',
      startDate: projectData.startDate ? projectData.startDate.slice(0, 10) : '',
      targetEndDate: projectData.targetEndDate ? projectData.targetEndDate.slice(0, 10) : '',
      status: projectData.status || 'Active',
    });
    setEditingSettings(true);
    setActiveTab('settings');
  };

  if (!projectData) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-2)' }}>Loading project…</div>;

  const totalTasks = projectData.tasks?.length || 0;
  const completedTasks = projectData.tasks?.filter((t: any) => t.status === 'Done').length || 0;

  const navItems = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'backlog',   icon: '📋', label: 'Backlog'   },
    { id: 'sprints',   icon: '🏃', label: 'Sprints'   },
    { id: 'members',   icon: '👥', label: 'Members'   },
    { id: 'reports',   icon: '📊', label: 'Reports'   },
    { id: 'settings',  icon: '⚙️', label: 'Settings'  },
  ];

  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-name" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectData.name}</span>
        </div>

        <span className="sidebar-section-label">Project</span>

        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={{ outline: 'none' }}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="sidebar-item" onClick={fetchProject} style={{ outline: 'none' }}>
            <span>🔄</span> Refresh
          </button>
          <button className="sidebar-item" onClick={() => navigate('/organization')} style={{ outline: 'none' }}>
            <span>←</span> Back to Org
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-area-container">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="topbar-title">
              {navItems.find(n => n.id === activeTab)?.label}
            </span>
            <span className="badge badge-blue">{projectData.status || 'Active'}</span>
          </div>
          {activeTab === 'backlog' && (
            <button className="btn-primary" style={{ margin: 0, width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setIsCreatingTask(!isCreatingTask)}>
              {isCreatingTask ? '✕ Cancel' : '+ Create Issue'}
            </button>
          )}
          {activeTab === 'sprints' && (
            <button
              onClick={() => { setIsCreatingSprint(v => !v); setSelectedSprintId(null); }}
              className="btn-primary"
              style={{ margin: 0, width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {isCreatingSprint ? '✕ Cancel' : '+ New Sprint'}
            </button>
          )}
        </div>

        <div className="main-area">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="stat-grid" style={{ marginBottom: '40px' }}>
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div>
                    <p className="stat-label">Total Tasks</p>
                    <p className="stat-value" style={{ color: 'var(--primary-light)' }}>{totalTasks}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✨</div>
                  <div>
                    <p className="stat-label">Completed</p>
                    <p className="stat-value" style={{ color: 'var(--success)' }}>{completedTasks}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div>
                    <p className="stat-label">Team Members</p>
                    <p className="stat-value" style={{ color: 'var(--accent)' }}>{projectData.assignedMembers?.length || 0}</p>
                  </div>
                </div>
              </div>

              <h3 style={{ marginBottom: '20px' }}>Kanban Board</h3>
              <KanbanBoard
                tasks={projectData.tasks || []}
                members={projectData.assignedMembers || []}
                onUpdateStatus={handleUpdateTaskStatus}
                onTaskClick={task => setSelectedTask({ ...task, _projectId: id })}
              />

              <h3 style={{ margin: '36px 0 20px' }}>Recent Activity</h3>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '20px', border: '1px solid var(--surface-border)' }}>
                {projectData.tasks?.slice(-5).map((t: any, i: number) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: i !== 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ color: 'var(--primary-color)', marginRight: '10px' }}>[{t.type}]</span>
                    {t.title} <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '10px' }}>({t.status})</span>
                  </div>
                ))}
                {!projectData.tasks?.length && <p style={{ color: 'var(--text-secondary)' }}>No recent activity.</p>}
              </div>
            </div>
          )}

          {/* Backlog Tab */}
          {activeTab === 'backlog' && (
            <div style={{ paddingTop: '8px' }}>

              {isCreatingTask && (
                <form onSubmit={handleCreateTask} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <select className="input-field" style={{ width: '150px' }} value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})}>
                      <option value="Epic">Epic</option>
                      <option value="Story">Story</option>
                      <option value="Task">Task</option>
                      <option value="Bug">Bug</option>
                    </select>
                    <input className="input-field" style={{ flex: 1 }} placeholder="Issue Title *" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                  </div>
                  <textarea className="input-field" placeholder="Description..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} style={{ minHeight: '80px', resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <select className="input-field" style={{ flex: 1 }} value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <select className="input-field" style={{ flex: 1 }} value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})}>
                      <option value="">Unassigned</option>
                      {projectData.assignedMembers?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input className="input-field" type="number" placeholder="Story Points" style={{ flex: 1 }} value={newTask.storyPoints || ''} onChange={e => setNewTask({...newTask, storyPoints: parseInt(e.target.value) || 0})} />
                    <select className="input-field" style={{ flex: 1 }} value={(newTask as any).sprintId} onChange={e => setNewTask({...newTask, sprintId: e.target.value} as any)}>
                      <option value="">No Sprint (Backlog)</option>
                      {projectData.sprints?.filter((s: any) => s.status !== 'Completed').map((s: any) => (
                        <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: 'auto', alignSelf: 'flex-start' }}>Save Issue</button>
                </form>
              )}

              <div style={{ display: 'grid', gap: '10px' }}>
                {projectData.tasks?.map((t: any) => (
                  <div key={t._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--surface-border)', gap: '10px', cursor: 'pointer' }} onClick={() => setSelectedTask({ ...t, _projectId: id })}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: 0 }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', background: t.type === 'Epic' ? '#8b5cf6' : t.type === 'Story' ? '#10b981' : t.type === 'Bug' ? '#ef4444' : '#60a5fa' }}>{t.type}</span>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '1rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</strong>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '3px', alignItems: 'center' }}>
                          {t.description && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.description}</span>}
                          {t.sprintId && (() => { const sp = projectData.sprints?.find((s: any) => s._id === t.sprintId || s._id?.toString() === t.sprintId?.toString()); return sp ? <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '1px 7px', borderRadius: '4px' }}>🏃 {sp.name}</span> : null; })()}
                          {t.comments?.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>💬 {t.comments.length}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '8px', background: t.priority === 'Critical' ? 'rgba(239,68,68,0.2)' : t.priority === 'High' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)' }}>{t.priority}</span>
                      <select
                        value={t.status}
                        onChange={e => handleUpdateTaskStatus(t._id, e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white', padding: '4px 8px', fontSize: '0.85rem', cursor: 'pointer', colorScheme: 'dark' }}
                      >
                        <option>Backlog</option>
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Testing</option>
                        <option>Done</option>
                      </select>
                      {t.assignee && <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>{t.assignee.charAt(0).toUpperCase()}</span>}
                      <button onClick={() => handleDeleteTask(t._id)} style={{ background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
                    </div>
                  </div>
                ))}
                {!projectData.tasks?.length && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Backlog is empty. Create an issue to get started.</p>}
              </div>
            </div>
          )}

          {/* Sprints Tab */}
          {activeTab === 'sprints' && (() => {
            const API = import.meta.env.VITE_API_URL;
            const allSprints = projectData.sprints || [];
            const backlogTasks = (projectData.tasks || []).filter((t: any) => {
              const sid = t.sprintId?.toString ? t.sprintId.toString() : t.sprintId;
              return !sid || sid === '' || sid === 'null' || sid === 'undefined';
            });
            const statusColor = (s: any) => s.status === 'Active' ? '#10b981' : s.status === 'Completed' ? '#60a5fa' : '#f59e0b';
            const assignToSprint = async (taskId: string, sprintId: string) => {
              await axios.put(`${API}/api/projects/${id}/tasks/${taskId}`, { sprintId });
              fetchProject();
            };
            const removeFromSprint = async (taskId: string) => {
              await axios.put(`${API}/api/projects/${id}/tasks/${taskId}`, { sprintId: null });
              fetchProject();
            };

            return (
              <div style={{ paddingTop: '8px' }}>
                {/* ── Page header ── */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {allSprints.length} sprint{allSprints.length !== 1 ? 's' : ''} · {backlogTasks.length} unassigned task{backlogTasks.length !== 1 ? 's' : ''} in backlog
                  </p>
                </div>

                {/* ── Inline create form ── */}
                {isCreatingSprint && (
                  <div style={{ background: 'rgba(99,102,241,0.05)', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.2)', padding: '24px', marginBottom: '24px' }}>
                    <form onSubmit={async e => { e.preventDefault(); await handleCreateSprint(e); setIsCreatingSprint(false); }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 160px', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Sprint Name *</label>
                          <input className="input-field" placeholder="e.g. Sprint 1" value={newSprint.name} onChange={e => setNewSprint({ ...newSprint, name: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Sprint Goal</label>
                          <input className="input-field" placeholder="What will be achieved?" value={newSprint.goal} onChange={e => setNewSprint({ ...newSprint, goal: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Start Date</label>
                          <input className="input-field" type="date" value={newSprint.startDate} onChange={e => setNewSprint({ ...newSprint, startDate: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>End Date</label>
                          <input className="input-field" type="date" value={newSprint.endDate} onChange={e => setNewSprint({ ...newSprint, endDate: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn-primary" style={{ margin: 0, width: 'auto', padding: '9px 28px' }}>Create Sprint</button>
                        <button type="button" onClick={() => setIsCreatingSprint(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '9px 18px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── Empty state ── */}
                {allSprints.length === 0 && !isCreatingSprint && (
                  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)', padding: '60px 40px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🏁</div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>No sprints yet</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>Create a sprint above, then add tasks to it from the backlog.</p>
                    <button onClick={() => setIsCreatingSprint(true)} className="btn-primary" style={{ margin: '0 auto', width: 'auto', padding: '12px 24px' }}>+ Create First Sprint</button>
                  </div>
                )}

                {/* ── Sprint cards (full-width, collapsible) ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {allSprints.map((s: any) => {
                    const sId = s._id?.toString ? s._id.toString() : s._id;
                    const isOpen = selectedSprintId === sId;
                    const sprintTasks = (projectData.tasks || []).filter((t: any) => {
                      const tSid = t.sprintId?.toString ? t.sprintId.toString() : t.sprintId;
                      return tSid === sId;
                    });
                    const doneTasks = sprintTasks.filter((t: any) => t.status === 'Done').length;
                    const progress = sprintTasks.length ? Math.round(doneTasks / sprintTasks.length * 100) : 0;
                    const sc = statusColor(s);

                    return (
                      <div key={s._id} style={{ borderRadius: '14px', border: `1px solid ${isOpen && s.status === 'Active' ? 'rgba(16,185,129,0.3)' : isOpen ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`, background: 'rgba(255,255,255,0.02)', overflow: 'hidden', transition: 'border-color 0.2s' }}>

                        {/* Sprint row header — click to expand/collapse */}
                        <div
                          onClick={() => { setSelectedSprintId(isOpen ? null : sId); setShowAddToSprint(false); }}
                          style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
                          onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                        >
                          {/* Chevron */}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>▶</span>

                          {/* Sprint name */}
                          <span style={{ fontWeight: 700, fontSize: '1rem', flex: 1 }}>{s.name}</span>

                          {/* Status badge */}
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '8px', background: `${sc}18`, color: sc, border: `1px solid ${sc}35`, flexShrink: 0 }}>{s.status}</span>

                          {/* Date range */}
                          {(s.startDate || s.endDate) && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                              📅 {s.startDate ? new Date(s.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '?'} → {s.endDate ? new Date(s.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '?'}
                            </span>
                          )}

                          {/* Task count */}
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{sprintTasks.length} task{sprintTasks.length !== 1 ? 's' : ''}</span>

                          {/* Mini progress bar */}
                          <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', flexShrink: 0 }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#10b981' : '#6366f1', transition: 'width 0.3s', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0, minWidth: '36px', textAlign: 'right' }}>{progress}%</span>

                          {/* Action buttons — stopPropagation so they don't toggle collapse */}
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                            {s.status === 'Planned' && <button className="btn-primary" style={{ margin: 0, width: 'auto', padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => handleUpdateSprint(s._id, { status: 'Active' })}>▶ Start</button>}
                            {s.status === 'Active' && <button className="btn-primary" style={{ margin: 0, width: 'auto', padding: '5px 12px', fontSize: '0.8rem', background: '#10b981' }} onClick={() => handleUpdateSprint(s._id, { status: 'Completed' })}>✓ Complete</button>}
                            <button onClick={() => { if (window.confirm('Delete this sprint?')) { handleDeleteSprint(s._id); if (selectedSprintId === sId) setSelectedSprintId(null); } }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Delete</button>
                          </div>
                        </div>

                        {/* Expanded body */}
                        {isOpen && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

                            {/* Big progress bar */}
                            <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.01)' }}>
                              {s.goal && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flex: 1 }}>{s.goal}</span>}
                              <div style={{ flex: s.goal ? undefined : 1, width: s.goal ? '240px' : undefined, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #a78bfa)', transition: 'width 0.4s', borderRadius: '4px' }} />
                              </div>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{doneTasks} / {sprintTasks.length} done · {progress}%</span>
                            </div>

                            {/* Add from Backlog button + picker */}
                            <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tasks in Sprint</span>
                                <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1px 8px', fontSize: '0.78rem', fontWeight: 600 }}>{sprintTasks.length}</span>
                              </div>
                              <button
                                onClick={() => setShowAddToSprint(v => !v)}
                                style={{ background: showAddToSprint ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.15)', border: `1px solid ${showAddToSprint ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`, color: showAddToSprint ? '#f87171' : '#818cf8', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                              >
                                {showAddToSprint ? '✕ Close Backlog' : '+ Add Tasks from Backlog'}
                              </button>
                            </div>

                            {/* Backlog picker */}
                            {showAddToSprint && (
                              <div style={{ background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ padding: '10px 22px 6px', fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Backlog · click a task to add it to this sprint</div>
                                <div style={{ padding: '4px 22px 14px', display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '220px', overflowY: 'auto' }}>
                                  {backlogTasks.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '10px 0', margin: 0 }}>All tasks are in sprints already 🎉</p>}
                                  {backlogTasks.map((t: any) => (
                                    <div
                                      key={t._id}
                                      onClick={() => assignToSprint(t._id, s._id)}
                                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.1)', cursor: 'pointer' }}
                                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'}
                                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                                    >
                                      <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>＋</span>
                                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, background: t.type === 'Bug' ? '#ef4444' : t.type === 'Epic' ? '#8b5cf6' : t.type === 'Story' ? '#10b981' : '#60a5fa', flexShrink: 0 }}>{t.type}</span>
                                      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{t.title}</span>
                                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>{t.priority}</span>
                                      {t.assignee && <span title={t.assignee} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{t.assignee.charAt(0).toUpperCase()}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sprint task list */}
                            <div style={{ padding: sprintTasks.length ? '10px 22px 16px' : '0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {sprintTasks.map((t: any) => (
                                <div
                                  key={t._id}
                                  onClick={() => setSelectedTask({ ...t, _projectId: id })}
                                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                                >
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: t.status === 'Done' ? '#10b981' : t.status === 'In Progress' ? '#f59e0b' : t.status === 'Testing' ? '#8b5cf6' : '#6366f1' }} />
                                  <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, background: t.type === 'Bug' ? '#ef4444' : t.type === 'Epic' ? '#8b5cf6' : t.type === 'Story' ? '#10b981' : '#60a5fa', flexShrink: 0 }}>{t.type}</span>
                                  <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{t.title}</span>
                                  {t.assignee && <span title={t.assignee} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{t.assignee.charAt(0).toUpperCase()}</span>}
                                  <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: t.status === 'Done' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: t.status === 'Done' ? '#10b981' : 'var(--text-secondary)', flexShrink: 0 }}>{t.status}</span>
                                  <button
                                    title="Remove from sprint"
                                    onClick={async e => { e.stopPropagation(); await removeFromSprint(t._id); }}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.45, padding: '0 2px', flexShrink: 0 }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.45'}
                                  >✕</button>
                                </div>
                              ))}
                              {sprintTasks.length === 0 && (
                                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                  No tasks yet — click <strong style={{ color: '#818cf8' }}>+ Add Tasks from Backlog</strong> above to add some.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}







          {/* Members Tab */}

          {activeTab === 'members' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                  <h3 style={{ marginBottom: '5px' }}>Project Members</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Manage the team working on this specific project.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                
                {/* Currently Assigned Table */}
                <div style={{ flex: 2, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ margin: 0 }}>Assigned Members ({projectData.assignedMembers?.length || 0})</h4>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <tbody>
                      {projectData.orgMembers?.filter((m: any) => projectData.assignedMembers?.includes(m.name)).map((m: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '4px' }}>{m.name}</strong>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{m.email}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.85rem' }}>{m.role}</span>
                          </td>
                          <td style={{ padding: '15px', textAlign: 'right' }}>
                            <button className="btn-secondary" style={{ color: 'var(--error-color)', margin: 0, padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleUpdateMembers(m.name)}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!projectData.assignedMembers || projectData.assignedMembers.length === 0) && (
                        <tr>
                          <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No members assigned to this project yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Member Panel */}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)', padding: '20px' }}>
                  <h4 style={{ marginBottom: '20px' }}>Assign New Members</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                    {projectData.orgMembers?.filter((m: any) => !projectData.assignedMembers?.includes(m.name)).map((m: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>{m.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.role}</span>
                        </div>
                        <button className="btn-primary" style={{ margin: 0, padding: '4px 12px', fontSize: '0.85rem', width: 'auto' }} onClick={() => handleUpdateMembers(m.name)}>
                          Add
                        </button>
                      </div>
                    ))}
                    {projectData.orgMembers?.filter((m: any) => !projectData.assignedMembers?.includes(m.name)).length === 0 && (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>All organization members are already in this project.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3>Project Settings</h3>
                {!editingSettings && <button className="btn-primary" style={{ margin: 0, width: 'auto' }} onClick={openSettings}>Edit Settings</button>}
              </div>

              {editingSettings ? (
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                    <h4 style={{ marginBottom: '20px' }}>General</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Project Name *</label>
                        <input className="input-field" value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} required />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</label>
                        <select className="input-field" value={settingsForm.status} onChange={e => setSettingsForm({...settingsForm, status: e.target.value})}>
                          <option>Active</option>
                          <option>Completed</option>
                          <option>Archived</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Start Date</label>
                        <input className="input-field" type="date" value={settingsForm.startDate} onChange={e => setSettingsForm({...settingsForm, startDate: e.target.value})} style={{ colorScheme: 'dark' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target End Date</label>
                        <input className="input-field" type="date" value={settingsForm.targetEndDate} onChange={e => setSettingsForm({...settingsForm, targetEndDate: e.target.value})} style={{ colorScheme: 'dark' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description</label>
                        <textarea className="input-field" value={settingsForm.description} onChange={e => setSettingsForm({...settingsForm, description: e.target.value})} style={{ minHeight: '80px', resize: 'vertical' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn-primary" style={{ width: 'auto', margin: 0 }}>Save Changes</button>
                    <button type="button" className="btn-secondary" style={{ width: 'auto', margin: 0 }} onClick={() => setEditingSettings(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                  {[['Project Name', projectData.name], ['Status', projectData.status || 'Active'], ['Start Date', projectData.startDate ? new Date(projectData.startDate).toLocaleDateString() : '—'], ['Target End Date', projectData.targetEndDate ? new Date(projectData.targetEndDate).toLocaleDateString() : '—'], ['Description', projectData.description || '—', true]].map(([label, value, full]: any) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--surface-border)', gridColumn: full ? '1 / -1' : undefined }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                      <p style={{ fontWeight: 500, fontSize: '1.05rem' }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (() => {
            const tasks = projectData.tasks || [];
            const total = tasks.length;
            const done  = tasks.filter((t: any) => t.status === 'Done').length;
            const inProg = tasks.filter((t: any) => t.status === 'In Progress').length;
            const todo   = tasks.filter((t: any) => t.status === 'To Do').length;
            const byType = ['Epic','Story','Task','Bug'].map(type => ({ type, count: tasks.filter((t: any) => t.type === type).length }));
            const byPriority = ['Critical','High','Medium','Low'].map(p => ({ p, count: tasks.filter((t: any) => t.priority === p).length }));
            const typeColors: Record<string,string> = { Epic: '#8b5cf6', Story: '#10b981', Bug: '#ef4444', Task: '#60a5fa' };
            const priColors:  Record<string,string> = { Critical: '#ef4444', High: '#f59e0b', Medium: '#60a5fa', Low: '#64748b' };
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                  {[{ label: 'Total Issues', value: total, color: 'var(--primary-color)' }, { label: 'Done', value: done, color: '#10b981' }, { label: 'In Progress', value: inProg, color: '#f59e0b' }, { label: 'To Do', value: todo, color: '#6366f1' }].map(s => (
                    <div key={s.label} style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{s.label}</p>
                      <p style={{ fontSize: '2.2rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {total > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid var(--surface-border)' }}>
                    <p style={{ fontWeight: 600, marginBottom: '14px' }}>Overall Progress</p>
                    <div style={{ height: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(done / total * 100)}%`, background: 'linear-gradient(90deg, var(--primary-color), #10b981)', transition: 'width 0.5s', borderRadius: '6px' }} />
                    </div>
                    <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{Math.round(done / total * 100)}% complete — {done} of {total} tasks done</p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid var(--surface-border)' }}>
                    <p style={{ fontWeight: 600, marginBottom: '16px' }}>Issues by Type</p>
                    {byType.map(({ type, count }) => (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: typeColors[type], flexShrink: 0 }} />
                        <span style={{ fontSize: '0.9rem', width: '55px' }}>{type}</span>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: total ? `${count/total*100}%` : '0%', background: typeColors[type] }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', width: '20px', textAlign: 'right' }}>{count}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid var(--surface-border)' }}>
                    <p style={{ fontWeight: 600, marginBottom: '16px' }}>Issues by Priority</p>
                    {byPriority.map(({ p, count }) => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: priColors[p], flexShrink: 0 }} />
                        <span style={{ fontSize: '0.9rem', width: '65px' }}>{p}</span>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: total ? `${count/total*100}%` : '0%', background: priColors[p] }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', width: '20px', textAlign: 'right' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {projectData.sprints?.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', border: '1px solid var(--surface-border)' }}>
                    <p style={{ fontWeight: 600, marginBottom: '16px' }}>Sprint Overview</p>
                    {projectData.sprints.map((s: any) => {
                      const sColor = s.status === 'Active' ? '#10b981' : s.status === 'Completed' ? '#60a5fa' : '#f59e0b';
                      return (
                        <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <span style={{ fontWeight: 500 }}>{s.name}</span>
                            {s.goal && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '12px' }}>— {s.goal}</span>}
                          </div>
                          <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, background: `${sColor}22`, color: sColor }}>{s.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </main>

      {/* ── Task Modal ── */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          projectId={id!}
          sprints={projectData.sprints || []}
          members={projectData.assignedMembers || []}
          isAdmin={true}
          currentUser={orgLocal?.username || 'Admin'}
          onClose={() => setSelectedTask(null)}
          onUpdate={updatedTask => {
            setProjectData((prev: any) => ({
              ...prev,
              tasks: prev.tasks.map((t: any) => t._id === updatedTask._id ? updatedTask : t),
            }));
          }}
        />
      )}
    </div>
  );
};

export default ProjectDashboard;
