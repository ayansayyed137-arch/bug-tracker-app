import React, { useState, useEffect } from 'react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeProjectId, setActiveProjectId] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  // Decode JWT token to get current logged-in user's ID
  const getCurrentUserId = () => {
    try {
      if (!token) return null;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload).id || JSON.parse(jsonPayload).userId;
    } catch (e) {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Fetch projects on load
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data);
        if (data.length > 0 && (!activeProjectId || !data.some(p => p._id === activeProjectId))) {
          setActiveProjectId(data[0]._id);
        } else if (data.length === 0) {
          setActiveProjectId('');
        }
      } else {
        setError(data.message || 'Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Server error while fetching projects');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = value.replace(/[^A-Za-z\s]/g, '');
    if (name === 'title') {
      setTitle(filteredValue);
    } else if (name === 'description') {
      setDescription(filteredValue);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      const data = await res.json();
      if (res.ok) {
        setProjects([...projects, data]);
        setActiveProjectId(data._id);
        setTitle('');
        setDescription('');
        setError('');
      } else {
        setError(data.message || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Server error while creating project');
    }
  };

  const handleDeleteProject = async () => {
    if (!activeProjectId) return;
    if (!window.confirm("Kya aap sach mein is project ko delete karna chahte hain?")) return;

    try {
      const res = await fetch(`/api/projects/${activeProjectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchProjects();
        setError('');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Server error while deleting project');
    }
  };

  const handleRemoveMember = async (projectId, memberId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchProjects();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to remove member');
      }
    } catch (err) {
      setError('Server error while removing member');
    }
  };

  const currentProj = projects.find(p => p._id === activeProjectId);
  
  // Check if current logged-in user is the creator of the selected project
  const isOwner = currentProj && (
    (currentProj.createdBy?._id && currentProj.createdBy._id === currentUserId) ||
    (currentProj.createdBy === currentUserId)
  );

  return (
    <div className="p-6 max-w-xl mx-auto glass-card rounded-2xl shadow-2xl border border-white/20 text-gray-100 bg-white/10 backdrop-blur-md">
      <h2 className="text-xl font-bold mb-4 text-center">Projects & Team Management</h2>

      {error && <div className="mb-4 p-2 bg-red-500/30 border border-red-500/50 text-red-200 text-sm rounded-xl text-center">{error}</div>}

      <form onSubmit={handleCreateProject} className="space-y-3 mb-6">
        <input
          type="text"
          name="title"
          placeholder="New project title (Letters only)..."
          value={title}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="text"
          name="description"
          placeholder="Project description (Letters only)..."
          value={description}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="submit"
          className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg transition duration-200"
        >
          Add Project
        </button>
      </form>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-1">Select Active Project</h3>
        <div className="flex gap-2 items-center">
          <select 
            value={activeProjectId} 
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-900 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
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

          {/* Delete button will only show if the current user created this project */}
          {projects.length > 0 && isOwner && (
            <button
              type="button"
              onClick={handleDeleteProject}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 rounded-xl font-medium transition duration-200 whitespace-nowrap text-sm"
            >
              Delete Project
            </button>
          )}
        </div>
      </div>

      {/* Team Members Management Section */}
      {activeProjectId && currentProj && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h3 className="text-sm font-semibold text-gray-200 mb-2">Team Members</h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {currentProj.teamMembers && currentProj.teamMembers.length > 0 ? (
              currentProj.teamMembers.map(member => (
                <span key={member._id || member} className="px-3 py-1 bg-white/10 border border-white/20 text-xs rounded-full flex items-center gap-2 text-gray-200">
                  {member.email || member}
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(currentProj._id, member._id || member)}
                    className="text-red-300 hover:text-red-400 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <p className="text-xs text-gray-400">No team members added yet.</p>
            )}
          </div>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const emailInput = e.target.elements.memberEmail;
              const email = emailInput.value;
              if (!email) return;
              try {
                const res = await fetch(`/api/projects/${currentProj._id}/members`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (res.ok) {
                  fetchProjects();
                  emailInput.value = '';
                  setError('');
                } else {
                  setError(data.message || 'Failed to add member');
                }
              } catch (err) {
                setError('Server error while adding member');
              }
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              name="memberEmail"
              placeholder="Add team member by email..."
              className="flex-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold transition"
            >
              Add Member
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
