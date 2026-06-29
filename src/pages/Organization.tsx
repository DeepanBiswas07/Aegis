import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusColor: Record<string, string> = {
  Active:    'badge-blue',
  Completed: 'badge-green',
  Archived:  'badge-gray',
  pending:   'badge-amber',
  accepted:  'badge-green',
};

const Organization = () => {
  const navigate = useNavigate();
  const orgLocal = JSON.parse(localStorage.getItem('org') || 'null');
  const [orgData, setOrgData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [memberMsg, setMemberMsg] = useState('');

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStart, setNewProjectStart] = useState('');
  const [newProjectEnd, setNewProjectEnd] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');

  useEffect(() => {
    if (!orgLocal) { navigate('/login'); return; }
    fetchOrg();
  }, [navigate]);

  const fetchOrg = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/organization/${orgLocal.id}`);
      setOrgData(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404 || err.response?.status === 401) {
        localStorage.removeItem('org');
        navigate('/login');
      } else {
        setOrgData({ error: true }); // Prevent infinite loading screen
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/organization/${orgLocal.id}/members`,
        { name: newMemberName, email: newMemberEmail, role: newMemberRole });
      setNewMemberName(''); setNewMemberEmail(''); setNewMemberRole('');
      setMemberMsg('Invite sent successfully!');
      setTimeout(() => setMemberMsg(''), 4000);
      fetchOrg();
    } catch (err: any) { setMemberMsg(err.response?.data?.message || 'Failed to invite member.'); }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Remove this member from the organization?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/organization/${orgLocal.id}/members/${memberId}`);
      fetchOrg();
    } catch (err) { console.error(err); }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/organization/${orgLocal.id}/projects`, {
        name: newProjectName, description: newProjectDesc,
        startDate: newProjectStart, targetEndDate: newProjectEnd,
        status: 'Active', assignedMembers: selectedMembers
      });
      setNewProjectName(''); setNewProjectDesc(''); setNewProjectStart('');
      setNewProjectEnd(''); setSelectedMembers([]); setIsCreatingProject(false);
      fetchOrg();
    } catch (err) { console.error(err); }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/organization/${orgLocal.id}/projects/${projectId}`);
      fetchOrg();
    } catch (err) { console.error(err); }
  };

  if (!orgData) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
      Loading…
    </div>
  );

  if (orgData.error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
      <h2>Failed to load organization.</h2>
      <button className="btn-secondary" onClick={() => { localStorage.removeItem('org'); navigate('/login'); }} style={{ marginTop: '20px' }}>Return to Login</button>
    </div>
  );

  const initial = (orgData.organizationName || 'O').charAt(0).toUpperCase();
  const totalMembers = orgData.members?.length || 0;
  const totalProjects = orgData.projects?.length || 0;
  const pendingInvites = orgData.members?.filter((m: any) => m.status === 'pending').length || 0;
  const activeProjects = orgData.projects?.filter((p: any) => p.status === 'Active').length || 0;

  const navItems = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'members',   icon: '👥', label: 'Members'   },
    { id: 'projects',  icon: '🗂',  label: 'Projects'  },
  ];

  const filteredProjects = (orgData.projects || []).filter((p: any) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) &&
    (projectFilter === 'All' || p.status === projectFilter)
  );

  return (
    <div className="dashboard-root">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">{initial}</div>
          <span className="sidebar-logo-name" style={{ fontSize: '.9rem' }}>{orgData.organizationName}</span>
        </div>

        <span className="sidebar-section-label">Navigation</span>

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

        <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '0 8px 8px' }}>
            <div className="flex-center gap-2" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="avatar avatar-sm">{orgData.username?.charAt(0).toUpperCase()}</div>
              <div>
                <p style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>@{orgData.username}</p>
                <p style={{ fontSize: '.72rem', color: 'var(--text-tertiary)' }}>Admin</p>
              </div>
            </div>
          </div>
          <button className="sidebar-item" onClick={fetchOrg} style={{ outline: 'none' }}>
            <span>🔄</span> Refresh
          </button>
          <button className="sidebar-item" onClick={() => { localStorage.removeItem('org'); navigate('/login'); }} style={{ outline: 'none', color: 'var(--error)' }}>
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
              {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </span>
            <span className="badge badge-blue">{orgData.organizationName}</span>
          </div>
        </div>

        {/* Content */}
        <div className="main-area">

          {/* ─── Dashboard Tab ─── */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="page-header" style={{ marginBottom: '28px' }}>
                <div>
                  <h1 className="page-title">Good day, @{orgData.username}! 👋</h1>
                  <p style={{ color: 'var(--text-2)', marginTop: '4px' }}>Here's an overview of {orgData.organizationName}.</p>
                </div>
              </div>

              <div className="stat-grid" style={{ marginBottom: '28px' }}>
                {[
                  { icon: '👥', label: 'Total Members', value: totalMembers, color: '#818cf8', bg: 'rgba(99,102,241,.12)' },
                  { icon: '🗂',  label: 'Total Projects', value: totalProjects, color: '#34d399', bg: 'rgba(16,185,129,.12)' },
                  { icon: '🚀', label: 'Active Projects', value: activeProjects, color: '#60a5fa', bg: 'rgba(96,165,250,.12)' },
                  { icon: '⏳', label: 'Pending Invites', value: pendingInvites, color: '#fbbf24', bg: 'rgba(245,158,11,.12)' },
                ].map(s => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                    <div>
                      <p className="stat-label">{s.label}</p>
                      <p className="stat-value" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent projects table */}
              {orgData.projects?.length > 0 && (
                <div className="card">
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Recent Projects</h2>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Timeline</th>
                        <th>Members</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgData.projects.map((p: any) => (
                        <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/organization/project/${p._id}`)}>
                          <td>
                            <strong style={{ fontSize: '.95rem' }}>{p.name}</strong>
                            {p.description && <p style={{ color: 'var(--text-2)', fontSize: '.8rem', marginTop: '4px' }}>{p.description}</p>}
                          </td>
                          <td style={{ color: 'var(--text-2)', fontSize: '.85rem' }}>
                            {p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'} to {p.targetEndDate ? new Date(p.targetEndDate).toLocaleDateString() : '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '1.2rem' }}>👥</span>
                              <span style={{ fontSize: '.85rem' }}>{p.assignedMembers?.length || 0}</span>
                            </div>
                          </td>
                          <td><span className={`badge ${statusColor[p.status] || 'badge-blue'}`}>{p.status}</span></td>
                          <td style={{ minWidth: '120px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="progress-bar-track" style={{ flex: 1 }}>
                                <div className="progress-bar-fill" style={{ width: `${p.progress || 0}%` }} />
                              </div>
                              <span style={{ fontSize: '.78rem', color: 'var(--text-2)', minWidth: '32px' }}>{p.progress || 0}%</span>
                            </div>
                          </td>
                          <td><span style={{ color: 'var(--primary-light)', fontSize: '.82rem' }}>Open →</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── Members Tab ─── */}
          {activeTab === 'members' && (
            <div>
              <div className="page-header">
                <h1 className="page-title">Team Members</h1>
                <span className="badge badge-blue">{totalMembers} total</span>
              </div>

              {/* Invite form */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '16px' }}>Invite a Member</h2>
                {memberMsg && (
                  <div className={`alert ${memberMsg.includes('success') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '14px' }}>
                    {memberMsg.includes('success') ? '✅' : '⚠️'} {memberMsg}
                  </div>
                )}
                <form onSubmit={handleAddMember} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input className="input-field" placeholder="Jane Smith" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input className="input-field" type="email" placeholder="jane@company.com" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Role</label>
                    <input className="input-field" placeholder="e.g. Developer" value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ margin: 0, padding: '13px' }}>Send Invite</button>
                </form>
              </div>

              {/* Members list */}
              <div className="card" style={{ overflowX: 'auto' }}>
                {orgData.members?.length > 0 ? (
                  <table className="data-table" style={{ minWidth: '600px' }}>
                    <thead>
                      <tr><th>Member</th><th>Role</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                    </thead>
                    <tbody>
                      {orgData.members.map((m: any) => (
                        <tr key={m._id}>
                          <td>
                            <div className="flex-center gap-2">
                              <div className="avatar avatar-sm">{m.name?.charAt(0).toUpperCase()}</div>
                              <div>
                                <p style={{ fontWeight: 600, fontSize: '.9rem' }}>{m.name}</p>
                                <p style={{ color: 'var(--text-2)', fontSize: '.78rem' }}>{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-blue">{m.role}</span></td>
                          <td><span className={`badge ${m.status === 'accepted' ? 'badge-green' : 'badge-amber'}`}>{m.status === 'accepted' ? 'Accepted' : 'Pending'}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleRemoveMember(m._id)}
                              style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '.82rem', padding: '4px 8px', fontWeight: 600 }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</p>
                    <p>No members yet. Invite your first team member above.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Projects Tab ─── */}
          {activeTab === 'projects' && (
            <div>
              <div className="page-header">
                <h1 className="page-title">Projects</h1>
                <button
                  className="btn-primary"
                  style={{ margin: 0, width: 'auto', padding: '10px 20px' }}
                  onClick={() => setIsCreatingProject(!isCreatingProject)}
                >
                  {isCreatingProject ? '✕ Cancel' : '+ New Project'}
                </button>
              </div>

              {/* Create form */}
              {isCreatingProject && (
                <div className="card" style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '20px' }}>Create New Project</h2>
                  <form onSubmit={handleAddProject} className="form-stack">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div className="input-group">
                        <label className="input-label">Project Name *</label>
                        <input className="input-field" placeholder="Website Revamp" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Description</label>
                        <input className="input-field" placeholder="Short description…" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Start Date</label>
                        <input className="input-field" type="date" value={newProjectStart} onChange={e => setNewProjectStart(e.target.value)} style={{ colorScheme: 'dark' }} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Target End Date</label>
                        <input className="input-field" type="date" value={newProjectEnd} onChange={e => setNewProjectEnd(e.target.value)} style={{ colorScheme: 'dark' }} />
                      </div>
                    </div>

                    {orgData.members?.length > 0 && (
                      <div>
                        <p className="input-label" style={{ marginBottom: '10px' }}>Assign Members</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {orgData.members.map((m: any) => (
                            <label key={m._id} style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '8px 14px', borderRadius: '99px', cursor: 'pointer',
                              border: `1px solid ${selectedMembers.includes(m.name) ? 'var(--primary)' : 'var(--border)'}`,
                              background: selectedMembers.includes(m.name) ? 'var(--primary-glow)' : 'var(--surface)',
                              transition: 'all .2s', fontSize: '.85rem'
                            }}>
                              <input
                                type="checkbox"
                                style={{ display: 'none' }}
                                checked={selectedMembers.includes(m.name)}
                                onChange={e => {
                                  if (e.target.checked) setSelectedMembers([...selectedMembers, m.name]);
                                  else setSelectedMembers(selectedMembers.filter(n => n !== m.name));
                                }}
                              />
                              {selectedMembers.includes(m.name) ? '✓ ' : ''}{m.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <button type="submit" className="btn-primary" style={{ margin: 0, width: 'auto', padding: '11px 28px' }}>
                        Create Project
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  className="input-field"
                  placeholder="🔍  Search projects…"
                  style={{ maxWidth: '280px' }}
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                />
                <select
                  className="input-field"
                  style={{ maxWidth: '160px' }}
                  value={projectFilter}
                  onChange={e => setProjectFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Table */}
              <div className="card" style={{ overflowX: 'auto' }}>
                {filteredProjects.length > 0 ? (
                  <table className="data-table" style={{ minWidth: '800px' }}>
                    <thead>
                      <tr><th>Project</th><th>Timeline</th><th>Status</th><th>Members</th><th>Progress</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((p: any) => (
                        <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/organization/project/${p._id}`)}>
                          <td>
                            <p style={{ fontWeight: 600 }}>{p.name}</p>
                            {p.description && <p style={{ color: 'var(--text-2)', fontSize: '.78rem', marginTop: '2px' }}>{p.description}</p>}
                          </td>
                          <td style={{ color: 'var(--text-2)', fontSize: '.85rem' }}>
                            {p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'} to {p.targetEndDate ? new Date(p.targetEndDate).toLocaleDateString() : '-'}
                          </td>
                          <td><span className={`badge ${statusColor[p.status] || 'badge-gray'}`}>{p.status || 'Active'}</span></td>
                          <td style={{ color: 'var(--text-2)' }}>{p.assignedMembers?.length || 0}</td>
                          <td style={{ minWidth: '130px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="progress-bar-track" style={{ flex: 1 }}>
                                <div className="progress-bar-fill" style={{ width: `${p.progress || 0}%` }} />
                              </div>
                              <span style={{ fontSize: '.78rem', color: 'var(--text-2)', minWidth: '30px' }}>{p.progress || 0}%</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteProject(p._id); }}
                              style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🗂</p>
                    <p>{orgData.projects?.length ? 'No projects match your filter.' : 'No projects yet. Create your first one above.'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Organization;
