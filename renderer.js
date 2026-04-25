document.addEventListener('DOMContentLoaded', () => {
    // State
    let lettaServerUrl = localStorage.getItem('lettaServerUrl') || 'http://localhost:8283';
    document.getElementById('server-url').value = lettaServerUrl;

    // Navigation
    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update active view
            const targetViewId = `view-${link.dataset.view}`;
            views.forEach(view => {
                view.classList.remove('active-view');
                if (view.id === targetViewId) {
                    view.classList.add('active-view');
                }
            });

            // Load data based on view
            if (link.dataset.view === 'agents') loadAgents();
            if (link.dataset.view === 'documents') loadSources();
            if (link.dataset.view === 'skills') loadSkills();
            if (link.dataset.view === 'blocks') loadBlocks();
            if (link.dataset.view === 'map') loadMap();
            if (link.dataset.view === 'dashboard') loadDashboard();
        });
    });

    // Settings Form
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        lettaServerUrl = document.getElementById('server-url').value;
        if (lettaServerUrl.endsWith('/')) {
            lettaServerUrl = lettaServerUrl.slice(0, -1);
        }
        localStorage.setItem('lettaServerUrl', lettaServerUrl);
        checkServerStatus();
        loadDashboard();
        alert('Settings saved successfully!');
    });

    // API Helper
    async function apiGet(endpoint) {
        try {
            const response = await fetch(`${lettaServerUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    // Status Checker
    async function checkServerStatus() {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.getElementById('server-status-text');
        
        try {
            // Letta server usually responds to base URL or /v1/models to verify it's up
            const response = await fetch(`${lettaServerUrl}/v1/models`, { method: 'GET' });
            if (response.ok) {
                statusIndicator.className = 'status-indicator online';
                statusText.textContent = 'Server Online';
            } else {
                throw new Error('Server returned error');
            }
        } catch (error) {
            statusIndicator.className = 'status-indicator offline';
            statusText.textContent = 'Server Offline';
        }
    }

    // Load Dashboard Data
    async function loadDashboard() {
        checkServerStatus();
        
        const agents = await apiGet('/v1/agents');
        const sources = await apiGet('/v1/sources');
        const models = await apiGet('/v1/models');

        document.getElementById('stat-agents').textContent = agents ? agents.length : '0';
        document.getElementById('stat-sources').textContent = sources ? sources.length : '0';
        document.getElementById('stat-models').textContent = models ? models.length : '0';
    }

    // Load Agents
    async function loadAgents() {
        const tbody = document.getElementById('agents-list');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading agents...</td></tr>';
        
        const agents = await apiGet('/v1/agents');
        
        if (!agents) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Failed to load agents. Check server connection.</td></tr>';
            return;
        }

        if (agents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No agents found. Create one to get started!</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        agents.forEach(agent => {
            const tr = document.createElement('tr');
            
            // Format dates and models based on Letta API spec
            const name = agent.name || 'Unnamed Agent';
            const model = agent.llm_config?.model || 'Unknown Model';
            const createdAt = agent.created_at ? new Date(agent.created_at).toLocaleDateString() : '-';
            
            tr.innerHTML = `
                <td><strong>${name}</strong></td>
                <td><span style="background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${model}</span></td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="alert('Chat with ${name} not implemented yet')">Chat</button>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); color: #f87171;" onclick="alert('Delete ${name} not implemented yet')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Load Sources
    async function loadSources() {
        const tbody = document.getElementById('sources-list');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading sources...</td></tr>';
        
        const sources = await apiGet('/v1/sources');
        
        if (!sources) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Failed to load sources. Check server connection.</td></tr>';
            return;
        }

        if (sources.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No sources found. Add a document source!</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        sources.forEach(source => {
            const tr = document.createElement('tr');
            
            const name = source.name || 'Unnamed Source';
            const description = source.description || 'No description';
            const createdAt = source.created_at ? new Date(source.created_at).toLocaleDateString() : '-';
            
            tr.innerHTML = `
                <td><strong>${name}</strong></td>
                <td>${description}</td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="alert('View ${name} not implemented yet')">View</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Load Skills
    async function loadSkills() {
        const tbody = document.getElementById('skills-list');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading skills...</td></tr>';
        
        const tools = await apiGet('/v1/tools');
        
        if (!tools) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Failed to load skills. Check server connection.</td></tr>';
            return;
        }

        if (tools.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No skills found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        tools.forEach(tool => {
            const tr = document.createElement('tr');
            
            const name = tool.name || 'Unnamed Skill';
            const description = tool.description || 'No description';
            const createdAt = tool.created_at ? new Date(tool.created_at).toLocaleDateString() : '-';
            
            tr.innerHTML = `
                <td><strong>${name}</strong></td>
                <td><span style="font-size: 0.85rem; color: var(--text-muted);">${description}</span></td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="alert('Edit ${name} not implemented yet')">Edit</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Load Blocks
    async function loadBlocks() {
        const tbody = document.getElementById('blocks-list');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading blocks...</td></tr>';
        
        const blocks = await apiGet('/v1/blocks');
        
        if (!blocks) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Failed to load blocks. Check server connection.</td></tr>';
            return;
        }

        if (blocks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No shared blocks found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        blocks.forEach(block => {
            const tr = document.createElement('tr');
            
            const label = block.label || 'Unnamed Block';
            const value = block.value ? (block.value.length > 50 ? block.value.substring(0, 50) + '...' : block.value) : 'Empty';
            const limit = block.limit || 'Unlimited';
            
            tr.innerHTML = `
                <td><strong>${label}</strong></td>
                <td><span style="font-size: 0.85rem; color: var(--text-muted);">${value}</span></td>
                <td>${limit}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="alert('Edit ${label} not implemented yet')">Edit</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Load Map
    async function loadMap() {
        const container = document.getElementById('network-graph');
        container.innerHTML = '<div style="color: #94a3b8; padding: 20px; text-align: center; margin-top: 50px;">Loading neural map...</div>';
        
        const agents = await apiGet('/v1/agents');
        const blocks = await apiGet('/v1/blocks');
        
        if (!agents || !blocks) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px; text-align: center;">Failed to load data for map.</div>';
            return;
        }

        const nodesData = [];
        const edgesData = [];
        const blockMap = new Map();

        // Create Block Nodes
        blocks.forEach(block => {
            blockMap.set(block.id, block);
            nodesData.push({
                id: `block_${block.id}`,
                label: block.label || 'Block',
                group: 'blocks',
                title: block.value ? block.value.substring(0, 100) + '...' : 'Empty Block'
            });
        });

        // Create Agent Nodes & Edges
        agents.forEach(agent => {
            const agentId = `agent_${agent.id}`;
            nodesData.push({
                id: agentId,
                label: agent.name || 'Agent',
                group: 'agents',
                title: agent.llm_config?.model || 'Agent'
            });

            // Find blocks connected to this agent
            // We'll stringify the agent object to find any block IDs it references,
            // which handles Letta's various memory structures dynamically.
            const agentStr = JSON.stringify(agent);
            let hasConnections = false;
            
            blocks.forEach(block => {
                if (agentStr.includes(block.id)) {
                    hasConnections = true;
                    edgesData.push({
                        from: agentId,
                        to: `block_${block.id}`
                    });
                }
            });

            // If no direct connections found, connect to a 'Persona' block if it exists
            // just to show the network (fallback logic)
            if (!hasConnections && blocks.length > 0) {
                 const personaBlock = blocks.find(b => b.label && b.label.toLowerCase().includes('persona'));
                 if (personaBlock) {
                     edgesData.push({
                         from: agentId,
                         to: `block_${personaBlock.id}`,
                         dashes: true // indicated inferred connection
                     });
                 }
            }
        });

        const data = {
            nodes: new vis.DataSet(nodesData),
            edges: new vis.DataSet(edgesData)
        };

        const options = {
            nodes: {
                shape: 'dot',
                size: 20,
                font: { color: '#f8fafc', size: 14, face: 'Inter' },
                borderWidth: 2,
                shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10 }
            },
            edges: {
                width: 2,
                smooth: { type: 'continuous' },
                color: { color: 'rgba(139, 92, 246, 0.4)', highlight: '#8b5cf6' }
            },
            groups: {
                agents: {
                    color: { background: '#3b82f6', border: '#60a5fa', highlight: { background: '#60a5fa', border: '#93c5fd' } },
                    shadow: { color: '#3b82f6' }
                },
                blocks: {
                    color: { background: '#10b981', border: '#34d399', highlight: { background: '#34d399', border: '#6ee7b7' } },
                    shadow: { color: '#10b981' },
                    size: 15
                }
            },
            physics: {
                forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100, springConstant: 0.08 },
                maxVelocity: 50,
                solver: 'forceAtlas2Based',
                timestep: 0.35,
                stabilization: { iterations: 150 }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200
            }
        };

        container.innerHTML = '';
        new vis.Network(container, data, options);
    }

    // Initialize
    loadDashboard();
    
    // Status check every 30 seconds
    setInterval(checkServerStatus, 30000);
});
