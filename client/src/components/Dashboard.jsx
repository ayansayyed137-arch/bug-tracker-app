import React, { useState, useEffect } from 'react';
import Projects from './Projects';

export default function Dashboard({ onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'projects'
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  // Filtering & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  
  const [bugForm, setBugForm] = useState({ title: '', description: '', severity: 'Medium', assignee: '', dueDate: '' });
  const [commentInputs, setCommentInputs] = useState({}); // Bug ID ke hisab se comment text store karne ke liye
  const [activeTab, setActiveTab] = useState({}); // Card ke andar comments vs activity logs toggle karne ke liye
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  // Fetch Bugs
  const fetchBugs = async () => {
    try {
      const response = await fetch('/api/bugs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setBugs(data);
      } else {
        setError(data.message || 'Failed to fetch bugs');
      }
    } catch (err) {
      setError('Server error while fetching bugs');
    }
  };

  // Fetch Projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProjects(data);
        if (data.length > 0 && (!selectedProject || !data.some(p => p._id === selectedProject))) {
          setSelectedProject(data[0]._id);
        } else if (data.length === 0) {
          setSelectedProject('');
        }
      } else {
        setError(data.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Server error while fetching projects');
    }
  };

  useEffect(() => {
    fetchBugs();
    fetchProjects();
  }, [currentView]);

  const handleBugChange = (e) => {
    setBugForm({ ...bugForm, [e.target.name]: e.target.value });
  };

  // Create Bug
  const handleCreateBug = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...bugForm,
        projectId: selectedProject,
        assignee: bugForm.assignee || null,
        dueDate: bugForm.dueDate || null,
        status: 'To Do'
      };

      const response = await fetch('/api/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setBugForm({ title: '', description: '', severity: 'Medium', assignee: '', dueDate: '' });
        fetchBugs();
        setError('');
      } else {
        setError(data.message || 'Failed to create bug');
      }
    } catch (err) {
      setError('Server error while creating bug');
    }
  };

  const handleDeleteBug = async (id) => {
    try {
      const response = await fetch(`/api/bugs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchBugs();
      }
    } catch (err) {
      setError('Server error while deleting bug');
    }
  };

  const handleStatusChange = async (id, status) => {
    // Optimistic UI Update
    setBugs((prevBugs) =>
      prevBugs.map((bug) => (bug._id === id ? { ...bug, status } : bug))
    );

    try {
      const response = await fetch(`/api/bugs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchBugs();
      } else {
        setError(data.message || 'Failed to update status');
        fetchBugs();
      }
    } catch (err) {
      setError('Server error while updating status');
      fetchBugs();
    }
  };

  // Add Comment Handler
  const handleAddComment = async (bugId) => {
    const text = commentInputs[bugId];
    if (!text || !text.trim()) return;

    try {
      const response = await fetch(`/api/bugs/${bugId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (response.ok) {
        setBugs((prevBugs) => prevBugs.map((bug) => (bug._id === bugId ? data : bug)));
        setCommentInputs({ ...commentInputs, [bugId]: '' });
      } else {
        setError(data.message || 'Failed to add comment');
      }
    } catch (err) {
      setError('Server error while adding comment');
    }
  };

  // Advanced Filter and Search Logic (Project-scoped)
  const filteredBugs = bugs.filter((bug) => {
    const matchesProject = (bug.projectId?._id || bug.projectId) === selectedProject;
    const matchesSearch = bug.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bug.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || bug.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || bug.severity === filterPriority;
    const matchesAssignee = filterAssignee === 'All' || (bug.assignee?._id || bug.assignee) === filterAssignee;
    
    return matchesProject && matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Kanban Columns Split (Normalized)
  const todoBugs = filteredBugs.filter(bug => !bug.status || bug.status === 'Open' || bug.status === 'To Do');
  const inProgressBugs = filteredBugs.filter(bug => bug.status === 'In Progress');
  const resolvedBugs = filteredBugs.filter(bug => bug.status === 'Resolved' || bug.status === 'Done');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6 text-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation and Logout */}
        <div className="flex justify-between items-center mb-8 glass-card p-4 rounded-2xl shadow-xl bg-white/10 border border-white/20 backdrop-blur-md">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white">Bug Tracker Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView(currentView === 'dashboard' ? 'projects' : 'dashboard')}
              className="px-4 py-2 bg-purple-600/80 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg transition duration-200"
            >
              {currentView === 'dashboard' ? 'Manage Projects' : 'Back to Dashboard'}
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-xl text-sm font-semibold shadow-lg transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/30 border border-red-500/50 text-red-200 text-sm rounded-xl backdrop-blur-md">{error}</div>}

        {/* Conditional View Rendering */}
        {currentView === 'projects' ? (
          <Projects />
        ) : (
          <>
            {/* Active Project Selector Bar on Dashboard */}
            <div className="bg-white/10 border border-white/20 p-4 rounded-2xl shadow-xl mb-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-semibold text-gray-200">Active Project:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full sm:w-72 px-4 py-2 bg-gray-900/80 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((proj) => (
                    <option key={proj._id} value={proj._id} className="bg-gray-900">
                      {proj.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Dashboard Analytics / Overview Cards */}
            {selectedProject && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {/* Total Tasks */}
                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md shadow-lg flex flex-col justify-between">
                  <span className="text-xs text-gray-300 font-medium">Total Tasks</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold text-white">{filteredBugs.length}</span>
                    <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                </div>

                {/* Completed / Done */}
                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md shadow-lg flex flex-col justify-between">
                  <span className="text-xs text-gray-300 font-medium">Completed</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold text-green-300">{resolvedBugs.length}</span>
                    <span className="text-xs bg-green-500/30 text-green-200 px-2 py-0.5 rounded-full">
                      {filteredBugs.length > 0 ? Math.round((resolvedBugs.length / filteredBugs.length) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Overdue Tasks */}
                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md shadow-lg flex flex-col justify-between">
                  <span className="text-xs text-gray-300 font-medium">Overdue</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold text-red-300">
                      {filteredBugs.filter(b => b.dueDate && new Date(b.dueDate) < new Date() && b.status !== 'Done').length}
                    </span>
                    <span className="text-xs bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full">Alert</span>
                  </div>
                </div>

                {/* Critical / High Severity */}
                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md shadow-lg flex flex-col justify-between">
                  <span className="text-xs text-gray-300 font-medium">Critical / High</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold text-pink-300">
                      {filteredBugs.filter(b => b.severity === 'Critical' || b.severity === 'High').length}
                    </span>
                    <span className="text-xs bg-pink-500/30 text-pink-200 px-2 py-0.5 rounded-full">Priority</span>
                  </div>
                </div>
              </div>
            )}

            {/* Create Bug Form (Glass Card) */}
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl mb-8 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-4">Report New Task / Bug</h2>
              <form onSubmit={handleCreateBug} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={bugForm.title}
                    onChange={handleBugChange}
                    required
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Task summary..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={bugForm.description}
                    onChange={handleBugChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Detailed description..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Severity</label>
                    <select
                      name="severity"
                      value={bugForm.severity}
                      onChange={handleBugChange}
                      className="w-full px-4 py-2 bg-gray-900/60 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="Low" className="bg-gray-900">Low</option>
                      <option value="Medium" className="bg-gray-900">Medium</option>
                      <option value="High" className="bg-gray-900">High</option>
                      <option value="Critical" className="bg-gray-900">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Assignee</label>
                    <select
                      name="assignee"
                      value={bugForm.assignee}
                      onChange={handleBugChange}
                      className="w-full px-4 py-2 bg-gray-900/60 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">Unassigned</option>
                      {projects.find(p => p._id === selectedProject)?.teamMembers?.map((member) => (
                        <option key={member._id || member} value={member._id || member} className="bg-gray-900">
                          {member.email || member}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={bugForm.dueDate}
                      onChange={handleBugChange}
                      className="w-full px-4 py-2 bg-gray-900/60 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!selectedProject}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg transition duration-200 disabled:opacity-50"
                >
                  Create Task
                </button>
              </form>
            </div>

            {/* Board View Section */}
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
              <div className="flex flex-col justify-between items-center mb-6 gap-4">
                <div className="w-full flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Board View</h2>
                </div>

                {/* Advanced Search and Filters Bar */}
                <div className="flex flex-wrap gap-3 w-full">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 flex-1 min-w-[200px]"
                  />
                  
                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-gray-900/70 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="All">All Status</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-3 py-2 bg-gray-900/70 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>

                  {/* Assignee Filter */}
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="px-3 py-2 bg-gray-900/70 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="All">All Assignees</option>
                    {projects.find(p => p._id === selectedProject)?.teamMembers?.map((member) => (
                      <option key={member._id || member} value={member._id || member}>
                        {member.email || member}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!selectedProject ? (
                <p className="text-gray-300 text-sm">Please select or create a project to view tasks.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Column 1: To Do */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                      <h3 className="font-bold text-white text-md">To Do</h3>
                      <span className="text-xs bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full font-semibold">{todoBugs.length}</span>
                    </div>
                    <div className="space-y-4 flex-1">
                      {todoBugs.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No tasks in To Do</p>
                      ) : (
                        todoBugs.map((bug) => renderBugCard(bug))
                      )}
                    </div>
                  </div>

                  {/* Column 2: In Progress */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                      <h3 className="font-bold text-white text-md">In Progress</h3>
                      <span className="text-xs bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full font-semibold">{inProgressBugs.length}</span>
                    </div>
                    <div className="space-y-4 flex-1">
                      {inProgressBugs.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No tasks in progress</p>
                      ) : (
                        inProgressBugs.map((bug) => renderBugCard(bug))
                      )}
                    </div>
                  </div>

                  {/* Column 3: Done */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                      <h3 className="font-bold text-white text-md">Done</h3>
                      <span className="text-xs bg-green-500/30 text-green-200 px-2.5 py-0.5 rounded-full font-semibold">{resolvedBugs.length}</span>
                    </div>
                    <div className="space-y-4 flex-1">
                      {resolvedBugs.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No completed tasks</p>
                      ) : (
                        resolvedBugs.map((bug) => renderBugCard(bug))
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Helper function to render individual Bug Card with Action Buttons
  function renderBugCard(bug) {
    const isDone = bug.status === 'Done';
    const isInProgress = bug.status === 'In Progress';
    const isToDo = !bug.status || bug.status === 'Open' || bug.status === 'To Do';
    const currentActiveTab = activeTab[bug._id] || 'comments';

    return (
      <div key={bug._id} className="p-4 bg-white/10 border border-white/20 rounded-xl shadow-md hover:bg-white/15 transition flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className={`font-bold text-white text-base leading-snug ${isDone ? 'line-through opacity-80' : ''}`}>{bug.title}</h4>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-500/30 border border-pink-400/40 text-pink-200 rounded-full whitespace-nowrap">
            {bug.severity}
          </span>
        </div>
        <p className={`text-xs text-gray-300 ${isDone ? 'opacity-80' : ''}`}>{bug.description}</p>
        
        <div className="flex flex-col gap-1.5 text-[11px] text-gray-300 pt-2 border-t border-white/10">
          <div>Assignee: <strong className="text-white">{bug.assignee?.email || bug.assignee || 'Unassigned'}</strong></div>
          <div>Created: <strong className="text-white">{bug.createdAt ? new Date(bug.createdAt).toLocaleDateString() : 'N/A'}</strong></div>
          {bug.dueDate && (
            <div>
              Due Date: <strong className={`${new Date(bug.dueDate) < new Date() && !isDone ? 'text-red-400 font-bold' : 'text-white'}`}>
                {new Date(bug.dueDate).toLocaleDateString()}
              </strong>
            </div>
          )}
        </div>

        {/* Comments & Activity Section */}
        <div className="bg-black/20 p-2.5 rounded-xl border border-white/10 mt-1 flex flex-col gap-2">
          <div className="flex justify-between border-b border-white/10 pb-1 text-[11px]">
            <button 
              onClick={() => setActiveTab({ ...activeTab, [bug._id]: 'comments' })}
              className={`font-semibold pb-0.5 ${currentActiveTab === 'comments' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-400'}`}
            >
              Comments ({bug.comments?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab({ ...activeTab, [bug._id]: 'logs' })}
              className={`font-semibold pb-0.5 ${currentActiveTab === 'logs' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-400'}`}
            >
              Activity Logs ({bug.activityLogs?.length || 0})
            </button>
          </div>

          {currentActiveTab === 'comments' ? (
            <div className="flex flex-col gap-2">
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                {(!bug.comments || bug.comments.length === 0) ? (
                  <p className="text-gray-400 italic text-[10px]">No comments yet.</p>
                ) : (
                  bug.comments.map((c, idx) => (
                    <div key={idx} className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <div className="flex justify-between text-[10px] text-purple-300 font-medium">
                        <span>{c.user?.name || c.user?.email || 'User'}</span>
                        <span className="text-gray-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-gray-200 mt-0.5">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-1 pt-1">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInputs[bug._id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [bug._id]: e.target.value })}
                  className="px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-[11px] focus:outline-none flex-1"
                />
                <button
                  onClick={() => handleAddComment(bug._id)}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold rounded-lg transition"
                >
                  Post
                </button>
              </div>
            </div>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-[11px]">
              {(!bug.activityLogs || bug.activityLogs.length === 0) ? (
                <p className="text-gray-400 italic text-[10px]">No activity recorded.</p>
              ) : (
                bug.activityLogs.map((log, idx) => (
                  <div key={idx} className="text-gray-300 text-[10px] border-l-2 border-purple-400 pl-2 py-0.5">
                    <span className="text-white font-medium">{log.action}</span>
                    <div className="text-gray-400 text-[9px]">{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Buttons & Delete */}
        <div className="flex justify-between items-center pt-2 gap-2">
          {isToDo && (
            <button
              onClick={() => handleStatusChange(bug._id, 'In Progress')}
              className="px-3 py-1.5 text-[11px] font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition flex-1 shadow"
            >
              Start →
            </button>
          )}

          {isInProgress && (
            <button
              onClick={() => handleStatusChange(bug._id, 'Done')}
              className="px-3 py-1.5 text-[11px] font-semibold bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition flex-1 shadow"
            >
              Response ✓
            </button>
          )}

          {isDone && (
            <button
              onClick={() => handleStatusChange(bug._id, 'In Progress')}
              className="px-3 py-1.5 text-[11px] font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition flex-1 shadow"
            >
              ↺ Reopen
            </button>
          )}

          <button
            onClick={() => handleDeleteBug(bug._id)}
            className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-200 text-[11px] font-semibold rounded-lg transition"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }
}
