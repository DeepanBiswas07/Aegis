import React, { useRef, useState } from 'react';

const COLUMNS = [
  { id: 'Backlog',     label: 'Backlog',     color: '#64748b' },
  { id: 'To Do',       label: 'To Do',       color: '#6366f1' },
  { id: 'In Progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'Testing',     label: 'Testing',     color: '#8b5cf6' },
  { id: 'Done',        label: 'Done',        color: '#10b981' },
];

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

interface Props {
  tasks: any[];
  members: string[];
  onUpdateStatus: (taskId: string, status: string) => Promise<void>;
  onTaskClick?: (task: any) => void;
}

const KanbanBoard: React.FC<Props> = ({ tasks, members, onUpdateStatus, onTaskClick }) => {
  const dragTaskId  = useRef<string | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<any[]>(tasks);

  // search & filter state
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // keep local tasks in sync when parent refreshes
  React.useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    dragTaskId.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggingOver(colId);
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDraggingOver(null);
    const tid = dragTaskId.current;
    if (!tid) return;
    const task = localTasks.find(t => t._id === tid);
    if (!task || task.status === colId) return;
    // optimistic update
    setLocalTasks(prev => prev.map(t => t._id === tid ? { ...t, status: colId } : t));
    await onUpdateStatus(tid, colId);
    dragTaskId.current = null;
  };

  const handleDragLeave = () => setDraggingOver(null);

  // Unique values for filter dropdowns
  const uniqueAssignees = [...new Set(localTasks.map(t => t.assignee).filter(Boolean))];
  const uniqueTypes = [...new Set(localTasks.map(t => t.type).filter(Boolean))];
  const uniquePriorities = [...new Set(localTasks.map(t => t.priority).filter(Boolean))];

  // Apply filters
  const filteredTasks = localTasks.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchAssignee = !filterAssignee || t.assignee === filterAssignee;
    const matchType = !filterType || t.type === filterType;
    const matchPriority = !filterPriority || t.priority === filterPriority;
    return matchSearch && matchAssignee && matchType && matchPriority;
  });

  const hasFilters = search || filterAssignee || filterType || filterPriority;

  return (
    <div>
      {/* ── Search & Filter Bar ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            style={{ 
              width: '100%', 
              paddingLeft: '38px', 
              paddingRight: '14px', 
              paddingTop: '11px', 
              paddingBottom: '11px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.07)', 
              borderRadius: '12px', 
              color: 'white', 
              fontSize: '0.875rem', 
              outline: 'none', 
              boxSizing: 'border-box',
              transition: 'all 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.07)';
              e.target.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
          />
        </div>

        {uniqueAssignees.length > 0 && (
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={filterSelectStyle}>
            <option value="">All Assignees</option>
            {uniqueAssignees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}

        {uniqueTypes.length > 1 && (
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={filterSelectStyle}>
            <option value="">All Types</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        {uniquePriorities.length > 1 && (
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={filterSelectStyle}>
            <option value="">All Priorities</option>
            {uniquePriorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterAssignee(''); setFilterType(''); setFilterPriority(''); }}
            style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', color: '#fda4af', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.12)'; }}
          >
            ✕ Clear
          </button>
        )}

        {hasFilters && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-3)', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {filteredTasks.length} / {localTasks.length} tasks
          </span>
        )}
      </div>

      {/* ── Kanban Columns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          const isOver   = draggingOver === col.id;
          return (
            <div
              key={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDrop={e => handleDrop(e, col.id)}
              onDragLeave={handleDragLeave}
              style={{
                background: isOver ? 'rgba(255, 255, 255, 0.04)' : 'rgba(10, 11, 15, 0.25)',
                borderRadius: '20px',
                border: `1px solid ${isOver ? col.color : 'rgba(255, 255, 255, 0.045)'}`,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                boxShadow: 'var(--shadow-sm), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Column Header */}
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.045)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, display: 'inline-block', boxShadow: `0 0 8px ${col.color}` }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>{col.label}</span>
                </div>
                <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)' }}>{colTasks.length}</span>
              </div>

              {/* Task Cards */}
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '200px', flex: 1 }}>
                {colTasks.map(task => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={e => handleDragStart(e, task._id)}
                    onClick={() => onTaskClick?.(task)}
                    style={{
                      background: 'rgba(15, 17, 23, 0.65)',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: onTaskClick ? 'pointer' : 'grab',
                      userSelect: 'none',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.45), 0 0 20px rgba(99,102,241,0.06)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(20, 22, 30, 0.8)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = '';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(15, 17, 23, 0.65)';
                    }}
                  >
                    {/* Type badge + SP */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, background: TYPE_COLOR[task.type] || '#60a5fa', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                        {task.type}
                      </span>
                      {task.storyPoints > 0 && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 6px' }}>
                          {task.storyPoints} SP
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.5, color: '#f1f5f9', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.title}</p>

                    {/* Comments indicator */}
                    {task.comments?.length > 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>💬 {task.comments.length}</span>
                      </div>
                    )}

                    {/* Footer: priority + assignee */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                        background: `${PRIORITY_COLOR[task.priority] || '#64748b'}18`,
                        color: PRIORITY_COLOR[task.priority] || '#64748b',
                        border: `1px solid ${PRIORITY_COLOR[task.priority] || '#64748b'}25`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}>
                        {task.priority}
                      </span>
                      {task.assignee ? (
                        <span title={task.assignee} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {task.assignee.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-3)' }}>—</span>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.82rem', minHeight: '100px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.005)' }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const filterSelectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  color: 'white',
  padding: '10px 16px',
  fontSize: '0.875rem',
  outline: 'none',
  cursor: 'pointer',
  colorScheme: 'dark',
  transition: 'all 0.2s',
};

export default KanbanBoard;
