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
            if (link.dataset.view === 'folders') loadFolders();
            if (link.dataset.view === 'skills') loadSkills();
            if (link.dataset.view === 'blocks') loadBlocks();
            if (link.dataset.view === 'map') loadMap();
            if (link.dataset.view === 'models') loadModels();
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

    // API Delete Helper
    async function apiDelete(endpoint) {
        try {
            const response = await fetch(`${lettaServerUrl}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return true;
        } catch (error) {
            console.error(`Error deleting ${endpoint}:`, error);
            return false;
        }
    }

    // API Post Helper
    async function apiPost(endpoint, body) {
        try {
            const response = await fetch(`${lettaServerUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error posting ${endpoint}:`, error);
            return null;
        }
    }

    // API Patch Helper
    async function apiPatch(endpoint, body) {
        try {
            const response = await fetch(`${lettaServerUrl}${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error patching ${endpoint}:`, error);
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
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No agents found. Create one to get started!</td></tr>';
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
                <td><input type="checkbox" class="agent-checkbox" value="${agent.id}"></td>
                <td><strong>${name}</strong></td>
                <td><span style="background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${model}</span></td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="alert('Chat with ${name} not implemented yet')">Chat</button>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); color: #f87171;" onclick="deleteAgent('${agent.id}', this)">Delete</button>
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

    // Load Folders
    async function loadFolders() {
        const tbody = document.getElementById('folders-list');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading folders...</td></tr>';
        
        const folders = await apiGet('/v1/folders/');
        
        if (!folders) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Failed to load folders. Check server connection.</td></tr>';
            return;
        }

        if (folders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No folders found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        folders.forEach(folder => {
            const tr = document.createElement('tr');
            
            const name = folder.name || 'Unnamed Folder';
            const createdAt = folder.created_at ? new Date(folder.created_at).toLocaleDateString() : '-';
            
            tr.innerHTML = `
                <td><input type="checkbox" class="folder-checkbox" value="${folder.id}"></td>
                <td><strong>${name}</strong></td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="openFolderModal('${folder.id}', '${name}')">Edit</button>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); color: #f87171;" onclick="deleteFolder('${folder.id}', this)">Delete</button>
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
    window.currentBlocks = [];
    async function loadBlocks() {
        const tbody = document.getElementById('blocks-list');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading blocks...</td></tr>';
        
        const blocks = await apiGet('/v1/blocks');
        
        if (!blocks) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Failed to load blocks. Check server connection.</td></tr>';
            return;
        }

        window.currentBlocks = blocks;

        if (blocks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No shared blocks found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        blocks.forEach(block => {
            const tr = document.createElement('tr');
            
            const label = block.label || 'Unnamed Block';
            const value = block.value ? (block.value.length > 50 ? block.value.substring(0, 50) + '...' : block.value) : 'Empty';
            const limit = block.limit || 'Unlimited';
            
            tr.innerHTML = `
                <td><input type="checkbox" class="block-checkbox" value="${block.id}"></td>
                <td><strong>${label}</strong></td>
                <td><span style="font-size: 0.85rem; color: var(--text-muted);">${value}</span></td>
                <td>${limit}</td>
                <td>
                    <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="showBlockDetails('${block.id}')">Details</button>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); color: #f87171;" onclick="deleteBlock('${block.id}', this)">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Show Block Details Modal
    window.showBlockDetails = async function(blockId) {
        const block = window.currentBlocks.find(b => b.id === blockId);
        if (!block) return;

        document.getElementById('modal-block-label').textContent = block.label || 'Block Details';
        document.getElementById('modal-block-value').textContent = block.value || 'Empty';
        document.getElementById('modal-block-limit').textContent = block.limit || 'Unlimited';
        
        const agentsContainer = document.getElementById('modal-block-agents');
        agentsContainer.innerHTML = '<span class="text-muted">Loading related agents...</span>';
        
        document.getElementById('block-modal').classList.add('active');

        // Fetch agents to see who is using this block
        const agents = await apiGet('/v1/agents');
        if (agents) {
            const relatedAgents = agents.filter(agent => JSON.stringify(agent).includes(blockId));
            
            if (relatedAgents.length > 0) {
                agentsContainer.innerHTML = relatedAgents.map(a => `<span class="agent-tag"><i class="fa-solid fa-robot"></i> ${a.name}</span>`).join('');
            } else {
                agentsContainer.innerHTML = '<span class="text-muted">No agents currently using this block.</span>';
            }
        } else {
            agentsContainer.innerHTML = '<span class="text-muted" style="color: var(--danger);">Failed to load agents.</span>';
        }
    };

    // Close Modal Logic
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('block-modal').classList.remove('active');
    });
    document.getElementById('block-modal').addEventListener('click', (e) => {
        if (e.target.id === 'block-modal') {
            document.getElementById('block-modal').classList.remove('active');
        }
    });

    // Model Modal Close Logic
    document.getElementById('btn-close-model-modal').addEventListener('click', () => {
        document.getElementById('model-modal').classList.remove('active');
    });
    document.getElementById('model-modal').addEventListener('click', (e) => {
        if (e.target.id === 'model-modal') {
            document.getElementById('model-modal').classList.remove('active');
        }
    });

    // Folder Modal Logic
    document.getElementById('btn-add-folder').addEventListener('click', () => openFolderModal());
    document.getElementById('btn-close-folder-modal').addEventListener('click', () => {
        document.getElementById('folder-action-modal').classList.remove('active');
    });
    document.getElementById('folder-action-modal').addEventListener('click', (e) => {
        if (e.target.id === 'folder-action-modal') {
            document.getElementById('folder-action-modal').classList.remove('active');
        }
    });

    window.openFolderModal = function(id = '', currentName = '') {
        document.getElementById('modal-folder-action-label').textContent = id ? 'Edit Folder' : 'Create Folder';
        document.getElementById('folder-name-input').value = currentName;
        document.getElementById('folder-id-input').value = id;
        document.getElementById('folder-action-modal').classList.add('active');
    };

    document.getElementById('btn-save-folder').addEventListener('click', async (e) => {
        const btn = e.target;
        const nameInput = document.getElementById('folder-name-input').value.trim();
        const idInput = document.getElementById('folder-id-input').value;
        
        if (!nameInput) {
            alert('Folder name cannot be empty.');
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        let success;
        if (idInput) {
            // Edit existing folder via PATCH or POST if required by Letta. Most standard REST is PATCH for update.
            // Some versions of Letta might not support renaming, we'll try PATCH first.
            success = await apiPatch(`/v1/folders/${idInput}`, { name: nameInput });
            // Fallback to POST or PUT if patch fails might be needed, but PATCH is standard.
        } else {
            // Create new folder requires embedding_config
            let embeddingModel = window.currentModels?.find(m => m.endpoint_type === 'embedding' || m.model?.includes('embed'));
            let embeddingConfig = embeddingModel ? {
                embedding_endpoint_type: embeddingModel.endpoint_type || "openai",
                embedding_model: embeddingModel.model || "text-embedding-ada-002",
                embedding_dim: 1536,
                embedding_chunk_size: 300,
                handle: embeddingModel.handle || `openai/${embeddingModel.model}`
            } : {
                embedding_endpoint_type: "openai",
                embedding_model: "text-embedding-ada-002",
                embedding_dim: 1536,
                embedding_chunk_size: 300,
                handle: "openai/text-embedding-ada-002"
            };

            success = await apiPost('/v1/folders/', { 
                name: nameInput, 
                embedding_config: embeddingConfig 
            });
        }

        btn.innerHTML = originalText;
        btn.disabled = false;

        if (success) {
            document.getElementById('folder-action-modal').classList.remove('active');
            loadFolders();
        } else {
            alert('Failed to save folder. It may not be supported by your Letta API version, or check server logs.');
        }
    });

    // Delete Operations
    window.deleteAgent = async function(id, btn) {
        if (confirm('Are you sure you want to delete this agent?')) {
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                btn.disabled = true;
            }
            const success = await apiDelete(`/v1/agents/${id}`);
            if (success) {
                loadAgents();
                loadDashboard(); // Refresh stats
            } else {
                if (btn) {
                    btn.innerHTML = 'Delete';
                    btn.disabled = false;
                }
                alert('Failed to delete agent. Check server logs.');
            }
        }
    };

    window.deleteBlock = async function(id, btn) {
        if (confirm('Are you sure you want to delete this memory block?')) {
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                btn.disabled = true;
            }
            const success = await apiDelete(`/v1/blocks/${id}`);
            if (success) {
                loadBlocks();
            } else {
                if (btn) {
                    btn.innerHTML = 'Delete';
                    btn.disabled = false;
                }
                alert('Failed to delete block. Check server logs.');
            }
        }
    };

    window.deleteFolder = async function(id, btn) {
        if (confirm('Are you sure you want to delete this folder?')) {
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                btn.disabled = true;
            }
            const success = await apiDelete(`/v1/folders/${id}`);
            if (success) {
                loadFolders();
            } else {
                if (btn) {
                    btn.innerHTML = 'Delete';
                    btn.disabled = false;
                }
                alert('Failed to delete folder. Check server logs.');
            }
        }
    };

    // Load Models
    window.currentModels = [];
    async function loadModels() {
        const tbody = document.getElementById('models-list');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading models...</td></tr>';
        
        const models = await apiGet('/v1/models');
        
        if (!models) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Failed to load models. Check server connection.</td></tr>';
            return;
        }

        window.currentModels = models;

        if (models.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No models found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        models.forEach(model => {
            const tr = document.createElement('tr');
            
            const name = model.model || 'Unnamed Model';
            const provider = model.provider || 'Unknown';
            const type = model.endpoint_type || (name.includes('embed') ? 'embedding' : 'llm');
            
            tr.innerHTML = `
                <td><strong>${name}</strong></td>
                <td>${provider}</td>
                <td><span style="font-size: 0.85rem; padding: 4px 8px; border-radius: 4px; background: rgba(59, 130, 246, 0.2); color: #60a5fa;">${type}</span></td>
                <td>
                    <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="showModelDetails('${name}')">Details</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Show Model Details Modal
    window.showModelDetails = function(modelName) {
        const model = window.currentModels.find(m => m.model === modelName);
        if (!model) return;

        document.getElementById('modal-model-label').textContent = model.model || 'Model Details';
        document.getElementById('modal-model-provider').textContent = model.provider || 'Unknown Provider';
        document.getElementById('modal-model-endpoint').textContent = model.endpoint_type || 'N/A';
        document.getElementById('modal-model-context').textContent = model.context_window ? `${model.context_window} tokens` : 'Unknown';
        document.getElementById('modal-model-raw').textContent = JSON.stringify(model, null, 2);
        
        document.getElementById('model-modal').classList.add('active');
    };

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

    // Multi-Select & Bulk Delete Logic
    function setupBulkDelete(type) {
        const selectAllCb = document.getElementById(`select-all-${type}s`);
        const tableBody = document.getElementById(`${type}s-list`);
        const deleteBtn = document.getElementById(`btn-delete-selected-${type}s`);

        if(!selectAllCb || !tableBody || !deleteBtn) return;

        // Select All Checkbox
        selectAllCb.addEventListener('change', (e) => {
            const checkboxes = tableBody.querySelectorAll(`.${type}-checkbox`);
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateDeleteBtn();
        });

        // Individual Checkboxes
        tableBody.addEventListener('change', (e) => {
            if (e.target.classList.contains(`${type}-checkbox`)) {
                updateDeleteBtn();
            }
        });

        function updateDeleteBtn() {
            const checkboxes = tableBody.querySelectorAll(`.${type}-checkbox:checked`);
            if (checkboxes.length > 0) {
                deleteBtn.style.display = 'inline-flex';
                deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i> Delete Selected (${checkboxes.length})`;
            } else {
                deleteBtn.style.display = 'none';
                selectAllCb.checked = false;
            }
        }

        // Handle Bulk Delete
        deleteBtn.addEventListener('click', async () => {
            const checkboxes = tableBody.querySelectorAll(`.${type}-checkbox:checked`);
            if (checkboxes.length === 0) return;
            
            if (confirm(`Are you sure you want to delete ${checkboxes.length} selected ${type}s?`)) {
                deleteBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;
                deleteBtn.disabled = true;
                deleteBtn.style.opacity = '0.7';

                let successCount = 0;
                for (let cb of checkboxes) {
                    const id = cb.value;
                    const endpoint = type === 'agent' ? `/v1/agents/${id}` : `/v1/blocks/${id}`;
                    const success = await apiDelete(endpoint);
                    if (success) successCount++;
                }
                
                deleteBtn.disabled = false;
                deleteBtn.style.opacity = '1';
                
                alert(`Successfully deleted ${successCount} out of ${checkboxes.length} ${type}s.`);
                
                selectAllCb.checked = false;
                deleteBtn.style.display = 'none';
                
                if (type === 'agent') {
                    loadAgents();
                    loadDashboard();
                } else if (type === 'block') {
                    loadBlocks();
                } else if (type === 'folder') {
                    loadFolders();
                }
            }
        });
    }

    // Initialize
    setupBulkDelete('agent');
    setupBulkDelete('block');
    setupBulkDelete('folder');
    loadDashboard();
    
    // Status check every 30 seconds
    setInterval(checkServerStatus, 30000);
});
