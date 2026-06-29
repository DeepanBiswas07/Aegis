import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import KanbanBoard from './KanbanBoard';
import TaskModal from './TaskModal';

const statusColor: Record<string, string> = {
  'To Do':       'badge-gray',
  'In Progress': 'badge-blue',
  'Review':      'badge-amber',
  'Testing':     'badge-purple',
  'Done':        'badge-green',
  'Active':      'badge-blue',
  'Completed':   'badge-green',
  'Archived':    'badge-gray'
};

const MemberDashboard = () => {
  const navigate = useNavigate();
  const memberLocal = JSON.parse(localStorage.getItem('member') || 'null');
  
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('my-work');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const dragTaskId = useRef<string | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);

  const fetchDashboard = () => {
    if (!memberLocal) return;
    axios.get(`${import.meta.env.VITE_API_URL}/api/member/dashboard/${memberLocal.id}`)
      .then(res => {
        setData(res.data);
        setIsRefreshing(false);
      })
      .catch(err => {
        console.error(err);
        setIsRefreshing(false);
        if (err.response?.status === 404 || err.response?.status === 401) {
          localStorage.removeItem('member');
          navigate('/member/login');
        } else {
          setData({ error: true });
        }
      });
  };

  useEffect(() => {
    if (!memberLocal) { navigate('/member/login'); return; }
    fetchDashboard();
  }, [navigate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  const handleLogout = () => {
    localStorage.removeItem('member');
    navigate('/member/login');
  };

  const updateTaskStatus = async (projectId: string, taskId: string, newStatus: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update task status');
    }
  };

  if (!data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
      Loading workspace…
    </div>
  );

  if (data.error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
      <h2>Failed to load member workspace.</h2>
      <button className="btn-secondary" onClick={handleLogout} style={{ marginTop: '20px' }}>Return to Login</button>
    </div>
  );

  const { member, projects, tasks } = data;
  const initial = member.name?.charAt(0).toUpperCase() || '?';

  const navItems = [
    { id: 'my-work',  icon: '⚡', label: 'My Work'  },
    { id: 'sprints',  icon: '🏃', label: 'Sprints'  },
    { id: 'projects', icon: '🗂', label: 'Projects' },
  ];

  return (
    <div className="dashboard-root">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">{member.organizationName?.charAt(0).toUpperCase() || 'A'}</div>
          <span className="sidebar-logo-name" style={{ fontSize: '.9rem' }}>{member.organizationName}</span>
        </div>

        <span className="sidebar-section-label">Workspace</span>

        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div style={{ marginTop: '24px' }}>
          <span className="sidebar-section-label">Assigned Projects</span>
          {projects?.map((p: any) => {
            const projectTasks = tasks.filter((t: any) => t.projectId === p._id);
            return (
              <button
                key={`project-${p._id}`}
                className={`sidebar-item ${activeTab === `project-${p._id}` ? 'active' : ''}`}
                onClick={() => setActiveTab(`project-${p._id}`)}
              >
                <span className="icon">📁</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                {projectTasks.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '.7rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-2)', padding: '2px 6px', borderRadius: '4px' }}>
                    {projectTasks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '0 8px 8px' }}>
            <div className="flex-center gap-2" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="avatar avatar-sm">{initial}</div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{member.name}</p>
                <p style={{ fontSize: '.72rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{member.role}</p>
              </div>
            </div>
          </div>
          <button className="sidebar-item" onClick={handleRefresh} disabled={isRefreshing} style={{ outline: 'none' }}>
            <span>🔄</span> {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="sidebar-item" onClick={handleLogout} style={{ outline: 'none', color: 'var(--error)' }}>
            <span>↩</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-area-container">

        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="topbar-title">
              {navItems.find(n => n.id === activeTab)?.label || projects?.find((p: any) => `project-${p._id}` === activeTab)?.name || 'Workspace'}
            </span>
            {activeTab.startsWith('project-') ? (
              <span className={`badge ${statusColor[projects?.find((p: any) => `project-${p._id}` === activeTab)?.status] || 'badge-blue'}`}>
                {projects?.find((p: any) => `project-${p._id}` === activeTab)?.status || 'Active'}
              </span>
            ) : activeTab === 'projects' ? (
              <span className="badge badge-blue" style={{ marginLeft: '4px' }}>{projects?.length || 0} assigned</span>
            ) : (
              <span className="badge badge-purple">Team Member</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="main-area">

          {/* ─── My Work Tab ─── */}
          {activeTab === 'my-work' && (
            <div style={{ paddingTop: '8px' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: 'var(--text-2)' }}>Tasks assigned to you across all projects.</p>
              </div>

              {tasks?.length > 0 ? (
                <KanbanBoard 
                  tasks={tasks.map((t: any) => ({ ...t, title: `[${t.projectName}] ${t.title}` }))}
                  members={[]}
                  onUpdateStatus={async (taskId, status) => {
                    const task = tasks.find((t: any) => t._id === taskId);
                    if (!task) return;
                    const newTasks = tasks.map((t: any) => t._id === taskId ? { ...t, status } : t);
                    setData({ ...data, tasks: newTasks });
                    await updateTaskStatus(task.projectId, taskId, status);
                  }}
                  onTaskClick={task => {
                    const original = tasks.find((t: any) => t._id === task._id);
                    if (original) setSelectedTask({ ...original });
                  }}
                />
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>☕</div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>You're all caught up!</h3>
                  <p style={{ color: 'var(--text-2)' }}>You don't have any tasks assigned to you right now.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Project-Specific Tab ─── */}
          {activeTab.startsWith('project-') && (
            <div style={{ paddingTop: '8px' }}>
              {(() => {
                const projectId = activeTab.replace('project-', '');
                const project = projects.find((p: any) => p._id === projectId);
                const projectTasks = tasks.filter((t: any) => t.projectId === projectId);
                const doneTasks = projectTasks.filter((t: any) => t.status === 'Done').length;
                const progress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

                return (
                  <>
                    <div className="page-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ color: 'var(--text-2)', fontSize: '.95rem' }}>{project?.description || 'No description provided.'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{progress}%</div>
                        <div style={{ fontSize: '.8rem', color: 'var(--text-3)' }}>Completion</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                      <div className="card" style={{ padding: '20px' }}>
                        <p style={{ fontSize: '.8rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>My Tasks</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700 }}>{projectTasks.length}</p>
                      </div>
                      <div className="card" style={{ padding: '20px' }}>
                        <p style={{ fontSize: '.8rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Completed</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{doneTasks}</p>
                      </div>
                      <div className="card" style={{ padding: '20px' }}>
                        <p style={{ fontSize: '.8rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Timeline</p>
                        <p style={{ fontSize: '.88rem', fontWeight: 500, marginTop: '8px', lineHeight: '1.4' }}>
                          {project?.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Ongoing'}
                          <br/>
                          <span style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>to</span>
                          <br/>
                          {project?.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Present'}
                        </p>
                      </div>
                    </div>

                    {projectTasks.length > 0 ? (
                      <KanbanBoard 
                        tasks={projectTasks}
                        members={[]}
                        onUpdateStatus={async (taskId, status) => {
                          const newTasks = tasks.map((t: any) => t._id === taskId ? { ...t, status } : t);
                          setData({ ...data, tasks: newTasks });
                          await updateTaskStatus(projectId, taskId, status);
                        }}
                        onTaskClick={task => setSelectedTask({ ...task })}
                      />
                    ) : (
                      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No tasks assigned</h3>
                        <p style={{ color: 'var(--text-2)' }}>You don't have any tasks assigned to you in this project.</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* ─── Sprints Tab ─── */}
          {activeTab === 'sprints' && (
            <div style={{ paddingTop: '8px' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: 'var(--text-2)' }}>Active and planned sprints across your projects.</p>
              </div>

              {data.sprints?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {data.sprints.map((s: any) => {
                    const sprintTasks = tasks.filter((t: any) => {
                      const tId = t.sprintId?.toString ? t.sprintId.toString() : t.sprintId;
                      const sId = s._id?.toString ? s._id.toString() : s._id;
                      return tId === sId;
                    });
                    const doneTasks = sprintTasks.filter((t: any) => t.status === 'Done').length;
                    const progress = sprintTasks.length ? Math.round((doneTasks / sprintTasks.length) * 100) : 0;
                    const project = projects.find((p: any) => p._id?.toString() === s.projectId?.toString());
                    const statusColor = s.status === 'Active' ? '#10b981' : '#f59e0b';

                    return (
                      <div key={s._id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        {/* Sprint header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{s.name}</h3>
                              <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600, background: `${statusColor}22`, color: statusColor }}>{s.status}</span>
                              {project && <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{project.name}</span>}
                            </div>
                            {s.goal && <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-2)' }}>{s.goal}</p>}
                            {(s.startDate || s.endDate) && (
                              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-3)' }}>
                                {s.startDate ? new Date(s.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Ongoing'} — {s.endDate ? new Date(s.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Present'}
                              </p>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: progress === 100 ? '#10b981' : 'var(--primary)' }}>{progress}%</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{doneTasks}/{sprintTasks.length} done</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #a78bfa)', transition: 'width 0.4s', borderRadius: '3px' }} />
                          </div>
                        </div>

                        {/* Sprint tasks */}
                        {sprintTasks.length > 0 ? (
                          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {sprintTasks.map((t: any) => (
                              <div
                                key={t._id}
                                onClick={() => setSelectedTask({ ...t })}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                              >
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.status === 'Done' ? '#10b981' : t.status === 'In Progress' ? '#f59e0b' : '#6366f1', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px', borderRadius: '4px', background: t.type === 'Bug' ? 'rgba(239,68,68,0.2)' : 'rgba(96,165,250,0.15)', color: t.type === 'Bug' ? '#ef4444' : '#60a5fa', flexShrink: 0 }}>{t.type}</span>
                                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{t.title}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', flexShrink: 0 }}>{t.projectName}</span>
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: t.status === 'Done' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: t.status === 'Done' ? '#10b981' : 'var(--text-2)', flexShrink: 0 }}>{t.status}</span>
                                {t.comments?.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>💬 {t.comments.length}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.88rem' }}>No tasks from you in this sprint.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏃</div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No active sprints</h3>
                  <p style={{ color: 'var(--text-2)' }}>Your projects don't have any active or planned sprints right now.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Projects Tab ─── */}
          {activeTab === 'projects' && (
            <div style={{ paddingTop: '8px' }}>

              <div className="card">
                {projects?.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr><th>Project Name</th><th>Status</th><th>Members</th><th>My Tasks</th></tr>
                    </thead>
                    <tbody>
                      {projects.map((p: any) => {
                        const myProjectTasks = tasks.filter((t: any) => t.projectId === p._id);
                        const doneTasks = myProjectTasks.filter((t: any) => t.status === 'Done').length;
                        
                        return (
                          <tr key={p._id}>
                            <td>
                              <p style={{ fontWeight: 600 }}>{p.name}</p>
                              {p.description && <p style={{ color: 'var(--text-2)', fontSize: '.78rem', marginTop: '2px' }}>{p.description}</p>}
                            </td>
                            <td><span className={`badge ${statusColor[p.status] || 'badge-gray'}`}>{p.status || 'Active'}</span></td>
                            <td style={{ color: 'var(--text-2)' }}>{p.assignedMembers?.length || 0}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{doneTasks} / {myProjectTasks.length}</span>
                                <span style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>done</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🗂</p>
                    <p>You haven't been assigned to any projects yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Task Modal (view-only for members, with comments) ── */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          projectId={selectedTask.projectId || ''}
          sprints={data.sprints || []}
          members={[]}
          isAdmin={false}
          currentUser={member.name}
          onClose={() => setSelectedTask(null)}
          onUpdate={updatedTask => {
            const newTasks = tasks.map((t: any) => t._id === updatedTask._id ? { ...updatedTask, projectName: t.projectName } : t);
            setData({ ...data, tasks: newTasks });
          }}
        />
      )}
    </div>
  );
};

export default MemberDashboard;
