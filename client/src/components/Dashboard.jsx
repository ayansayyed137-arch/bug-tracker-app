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
  const [commentInputs, setCommentInputs] = useState({}); 
  const [activeTab, setActiveTab] = useState({}); 
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
                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md shadow-lg flex flex-col justify-between">
                  <span className="text-xs text-gray-300 font-medium">Total Tasks</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold text-white">{filteredBugs.length}</span>
                    <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md shadow-lg flex flex-col justify-between">
                  <span className="text-xs text-gray-300 font-medium">Completed</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold text-green-300">{resolvedBugs.length}</span>
                    <span className="text-xs bg-green-500/30 text-green-200 px-2 py-0.5 rounded-full">
                      {filteredBugs.length > 0 ? Math.round((resolvedBugs.length / filteredBugs.length) * 100) : 0}%
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md shadow-lg flex flex-col justify-between">
                  <span className="text-xs text-gray-300 font-medium">Overdue</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold text-red-300">
                      {filteredBugs.filter(b => b.dueDate && new Date(b.dueDate) < new Date() && b.status !== 'Done').length}
                    </span>
                    <span className="text-xs bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full">Alert</span>
                  </div>
                </div>

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

            {/* Create Bug Form */}
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

                {/* Filters */}
                <div className="flex flex-wrap gap-3 w-full">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 flex-1 min-w-[200px]"
                  />
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
                </div>
              </div>

              {!selectedProject ? (
                <p className="text-gray-300 text-sm">Please select or create a project to view tasks.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  
                  {/* Column 1: To Do */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[280px] max-h-[550px] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10 sticky top-0 bg-white/5 backdrop-blur-md z-10">
                      <h3 className="font-bold text-white text-md">To Do</h3>
                      <span className="text-xs bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full font-semibold">{todoBugs.length}</span>
                    </div>
                    <div className="space-y-4">
                      {todoBugs.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-6">No tasks in To Do</p>
                      ) : (
                        todoBugs.map((bug) => renderBugCard(bug))
                      )}
                    </div>
                  </div>

                  {/* Column 2: In Progress */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[280px] max-h-[550px] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10 sticky top-0 bg-white/5 backdrop-blur-md z-10">
                      <h3 className="font-bold text-white text-md">In Progress</h3>
                      <span className="text-xs bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full font-semibold">{inProgressBugs.length}</span>
                    </div>
                    <div className="space-y-4">
                      {inProgressBugs.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-6">No tasks in progress</p>
                      ) : (
                        inProgressBugs.map((bug) => renderBugCard(bug))
                      )}
                    </div>
                  </div>

                  {/* Column 3: Done */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-col min-h-[280px] max-h-[550px] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10 sticky top-0 bg-white/5 backdrop-blur-md z-10">
                      <h3 className="font-bold text-white text-md">Done</h3>
                      <span className="text-xs bg-green-500/30 text-green-200 px-2.5 py-0.5 rounded-full font-semibold">{resolvedBugs.length}</span>
                    </div>
                    <div className="space-y-4">
                      {resolvedBugs.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-6">No completed tasks</p>
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

  // Helper function to render individual Bug Card
  function renderBugCard(bug) {
    const isDone = bug.status === 'Done';
    const isInProgress = bug.status === 'In Progress';
    const isToDo = !bug.status || bug.status === 'Open' || bug.status === 'To Do';

    return (
      <div key={bug._id} className="p-4 bg-black/40 border border-white/10 rounded-2xl shadow-lg hover:bg-black/50 transition flex flex-col gap-3">
        
        {/* Top: Title & Delete Icon */}
        <div className="flex justify-between items-start gap-2">
          <h4 className={`font-bold uppercase tracking-wide text-white text-sm leading-snug ${isDone ? 'line-through opacity-70' : ''}`}>
            {bug.title}
          </h4>
          <button
            onClick={() => handleDeleteBug(bug._id)}
            className="text-gray-400 hover:text-red-400 transition p-1"
            title="Delete Task"
          >
            🗑️
          </button>
        </div>

        {/* Description */}
        <p className={`text-xs text-gray-300 uppercase tracking-wide ${isDone ? 'opacity-70' : ''}`}>
          {bug.description}
        </p>

        {/* Divider Line */}
        <div className="border-t border-white/10 my-1"></div>

        {/* Footer: Assignee, Date & Action Button */}
        <div className="flex justify-between items-center pt-1 text-xs">
          <div className="flex flex-col gap-0.5 text-gray-400">
            <span className="flex items-center gap-1.5 font-medium text-purple-300">
              👤 {bug.assignee?.email || bug.assignee || 'Unassigned'}
            </span>
            {bug.dueDate && (
              <span className="text-[10px] text-gray-400">
                📅 Due: {new Date(bug.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <div>
            {isToDo && (
              <button
                onClick={() => handleStatusChange(bug._id, 'In Progress')}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl transition shadow"
              >
                Start
              </button>
            )}

            {isInProgress && (
              <button
                onClick={() => handleStatusChange(bug._id, 'Done')}
                className="px-3 py-1.5 text-xs font-semibold bg-green-600/80 hover:bg-green-600 text-white rounded-xl transition shadow"
              >
                Response
              </button>
            )}

            {isDone && (
              <button
                onClick={() => handleStatusChange(bug._id, 'In Progress')}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl transition shadow"
              >
                Reopen
              </button>
            )}
          </div>
        </div>

      </div>
    );
  }
}
