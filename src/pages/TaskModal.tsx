import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TYPE_COLOR: Record<string, string> = {
  Epic:  '#8b5cf6',
  Story: '#10b981',
  Bug:   '#ef4444',
  Task:  '#60a5fa',
};

const PRIORITY_COLOR: Record<string, string> = {
  Critical: '#ef4444',
  High:     '#f59e0b',
  Medium:   '#60a5fa',
  Low:      '#64748b',
};

const PRIORITY_ICON: Record<string, string> = {
  Critical: '🔴',
  High:     '🟠',
  Medium:   '🔵',
  Low:      '⚫',
};

const STATUS_COLOR: Record<string, string> = {
  'Backlog':     '#64748b',
  'To Do':       '#6366f1',
  'In Progress': '#f59e0b',
  'Review':      '#a78bfa',
  'Testing':     '#8b5cf6',
  'Done':        '#10b981',
};

interface TaskModalProps {
  task: any;
  projectId: string;
  sprints: any[];
  members: string[];
  isAdmin: boolean;
  currentUser: string;  // name of logged-in user (member or admin)
  onClose: () => void;
  onUpdate: (updatedTask: any) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  task: initialTask,
  projectId,
  sprints,
  members,
  isAdmin,
  currentUser,
  onClose,
  onUpdate,
}) => {
  const API = import.meta.env.VITE_API_URL;

  const [task, setTask]             = useState<any>(initialTask);
  const [editing, setEditing]       = useState(false);
  const [editForm, setEditForm]     = useState<any>({});
  const [saving, setSaving]         = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [activeSection, setActiveSection] = useState<'details' | 'comments'>('details');

  // Sync if parent passes new task (e.g. after status drag)
  useEffect(() => { setTask(initialTask); }, [initialTask]);

  const openEdit = () => {
    setEditForm({
      title:              task.title || '',
      description:        task.description || '',
      type:               task.type || 'Task',
      status:             task.status || 'To Do',
      priority:           task.priority || 'Medium',
      assignee:           task.assignee || '',
      storyPoints:        task.storyPoints || 0,
      dueDate:            task.dueDate ? task.dueDate.slice(0, 10) : '',
      sprintId:           task.sprintId || '',
      acceptanceCriteria: task.acceptanceCriteria || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/api/projects/${projectId}/tasks/${task._id}`, editForm);
      const updated = res.data;
      setTask(updated);
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save task', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const res = await axios.post(`${API}/api/projects/${projectId}/tasks/${task._id}/comments`, {
        author: currentUser,
        text: commentText.trim(),
      });
      setTask(res.data);
      onUpdate(res.data);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await axios.delete(`${API}/api/projects/${projectId}/tasks/${task._id}/comments/${commentId}`);
      setTask(res.data);
      onUpdate(res.data);
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const sprint = sprints.find(s => s._id === task.sprintId || s._id?.toString() === task.sprintId?.toString());

  // ── Modal overlay styles ──
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    animation: 'fadeIn 0.15s ease',
  };

  const modalStyle: React.CSSProperties = {
    background: '#0f1525',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '18px',
    width: '100%',
    maxWidth: '780px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    animation: 'slideUp 0.2s ease',
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .task-modal-scroll::-webkit-scrollbar { width: 6px; }
        .task-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .task-modal-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .comment-card:hover .delete-btn { opacity: 1 !important; }
      `}</style>

      <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={modalStyle}>

          {/* ── Header ── */}
          <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, background: TYPE_COLOR[task.type] || '#60a5fa' }}>
                  {task.type}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: `${STATUS_COLOR[task.status] || '#6366f1'}22`, color: STATUS_COLOR[task.status] || '#6366f1', border: `1px solid ${STATUS_COLOR[task.status] || '#6366f1'}44` }}>
                  {task.status}
                </span>
                {sprint && (
                  <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                    🏃 {sprint.name}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {isAdmin && !editing && activeSection === 'details' && (
                  <button
                    onClick={openEdit}
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                  >
                    ✏️ Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: 'var(--text-2)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {editing ? (
              <input
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                style={{ marginTop: '14px', width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '1.2rem', fontWeight: 700, outline: 'none' }}
              />
            ) : (
              <h2 style={{ marginTop: '14px', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.4, color: '#f1f5f9' }}>{task.title}</h2>
            )}

            {/* Section tabs */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '16px' }}>
              {(['details', 'comments'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  style={{
                    padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    background: activeSection === s ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: activeSection === s ? '#818cf8' : 'var(--text-3)',
                    textTransform: 'capitalize',
                  }}
                >
                  {s} {s === 'comments' && task.comments?.length > 0 && `(${task.comments.length})`}
                </button>
              ))}
            </div>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="task-modal-scroll" style={{ overflowY: 'auto', flex: 1 }}>

            {/* ── Details Section ── */}
            {activeSection === 'details' && (
              <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 260px', gap: '28px' }}>

                {/* Left: description + acceptance criteria */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3)', marginBottom: '10px' }}>Description</p>
                    {editing ? (
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Add a description..."
                        rows={5}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '0.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <p style={{ color: task.description ? '#cbd5e1' : 'var(--text-3)', fontSize: '0.9rem', lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '80px' }}>
                        {task.description || 'No description provided.'}
                      </p>
                    )}
                  </div>

                  {(isAdmin || task.acceptanceCriteria) && (
                    <div>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3)', marginBottom: '10px' }}>Acceptance Criteria</p>
                      {editing ? (
                        <textarea
                          value={editForm.acceptanceCriteria}
                          onChange={e => setEditForm({ ...editForm, acceptanceCriteria: e.target.value })}
                          placeholder="Given... When... Then..."
                          rows={4}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '0.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                        />
                      ) : task.acceptanceCriteria ? (
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.7, background: 'rgba(16,185,129,0.04)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(16,185,129,0.1)' }}>
                          {task.acceptanceCriteria}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Right: meta fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Priority */}
                  <MetaField label="Priority">
                    {editing ? (
                      <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} style={selectStyle}>
                        {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    ) : (
                      <span style={{ color: PRIORITY_COLOR[task.priority] || '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
                        {PRIORITY_ICON[task.priority]} {task.priority}
                      </span>
                    )}
                  </MetaField>

                  {/* Status */}
                  <MetaField label="Status">
                    {editing ? (
                      <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={selectStyle}>
                        {['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Done'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span style={{ color: STATUS_COLOR[task.status] || '#6366f1', fontWeight: 600, fontSize: '0.9rem' }}>{task.status}</span>
                    )}
                  </MetaField>

                  {/* Assignee */}
                  <MetaField label="Assignee">
                    {editing ? (
                      <select value={editForm.assignee} onChange={e => setEditForm({ ...editForm, assignee: e.target.value })} style={selectStyle}>
                        <option value="">Unassigned</option>
                        {members.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                          {task.assignee.charAt(0).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{task.assignee}</span>
                      </div>
                    ) : <span style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>Unassigned</span>}
                  </MetaField>

                  {/* Story Points */}
                  <MetaField label="Story Points">
                    {editing ? (
                      <input type="number" value={editForm.storyPoints} onChange={e => setEditForm({ ...editForm, storyPoints: parseInt(e.target.value) || 0 })} style={{ ...inputStyle, width: '80px' }} />
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', background: 'rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: '8px' }}>
                        {task.storyPoints > 0 ? `${task.storyPoints} SP` : '—'}
                      </span>
                    )}
                  </MetaField>

                  {/* Due Date */}
                  <MetaField label="Due Date">
                    {editing ? (
                      <input type="date" value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
                    ) : (
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: task.dueDate ? '#f1f5f9' : 'var(--text-3)' }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                      </span>
                    )}
                  </MetaField>

                  {/* Sprint */}
                  {(isAdmin || sprint) && (
                    <MetaField label="Sprint">
                      {editing ? (
                        <select value={editForm.sprintId} onChange={e => setEditForm({ ...editForm, sprintId: e.target.value })} style={selectStyle}>
                          <option value="">No Sprint (Backlog)</option>
                          {sprints.map(s => (
                            <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                          ))}
                        </select>
                      ) : sprint ? (
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#818cf8' }}>🏃 {sprint.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>Backlog</span>
                      )}
                    </MetaField>
                  )}

                  {/* Type (admin edit only) */}
                  {editing && (
                    <MetaField label="Type">
                      <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} style={selectStyle}>
                        {['Epic', 'Story', 'Task', 'Bug'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </MetaField>
                  )}

                  {/* Created at */}
                  <MetaField label="Created">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </MetaField>
                </div>
              </div>
            )}

            {/* ── Comments Section ── */}
            {activeSection === 'comments' && (
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Post comment box */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                      {currentUser.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePostComment(); }}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '0.9rem', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Ctrl+Enter to send</span>
                        <button
                          onClick={handlePostComment}
                          disabled={postingComment || !commentText.trim()}
                          style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', color: 'white', borderRadius: '8px', padding: '7px 18px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: (!commentText.trim() || postingComment) ? 0.5 : 1 }}
                        >
                          {postingComment ? 'Posting…' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment list */}
                {task.comments?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[...task.comments].reverse().map((c: any) => (
                      <div
                        key={c._id}
                        className="comment-card"
                        style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px', position: 'relative' }}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                          {c.author?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{c.author}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                              {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#cbd5e1' }}>{c.text}</p>
                        </div>
                        {(isAdmin || c.author === currentUser) && (
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteComment(c._id)}
                            style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.8rem', opacity: 0, transition: 'opacity 0.2s', padding: '2px 6px', borderRadius: '4px' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                    <p>No comments yet. Be the first to leave one!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer (edit actions) ── */}
          {editing && (
            <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setEditing(false)}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-2)', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 24px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Helper sub-components ────────────────────────────────────────────────────

const MetaField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-3)', marginBottom: '6px' }}>{label}</p>
    {children}
  </div>
);

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '7px',
  color: 'white',
  padding: '6px 10px',
  fontSize: '0.88rem',
  outline: 'none',
  width: '100%',
  cursor: 'pointer',
  colorScheme: 'dark',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '7px',
  color: 'white',
  padding: '6px 10px',
  fontSize: '0.88rem',
  outline: 'none',
};

export default TaskModal;
