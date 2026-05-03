const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');

function parseRequirementLine(line) {
    const cleanLine = line.split('#')[0].trim();
    if (!cleanLine || cleanLine.startsWith('-')) return null;

    const match = cleanLine.match(/^([A-Za-z0-9_.-]+)(?:[<>=!~]=?\s*([^,;\s]+))?/);
    if (!match) return null;

    return match[2] ? { name: match[1], version: match[2] } : { name: match[1] };
}

async function readOptionalText(filePath) {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
}

async function readFolderSkillMetadata(folderPath, sourcePath) {
    const entries = await fs.readdir(folderPath);
    const helperFiles = entries.filter(file => {
        const extension = path.extname(file).toLowerCase();
        return ['.py', '.js', '.ts'].includes(extension) && path.join(folderPath, file) !== sourcePath;
    });

    const requirementsText = await readOptionalText(path.join(folderPath, 'requirements.txt'));
    const pipRequirements = requirementsText
        ? requirementsText.split(/\r?\n/).map(parseRequirementLine).filter(Boolean)
        : [];

    const packageJsonText = await readOptionalText(path.join(folderPath, 'package.json'));
    let npmRequirements = [];
    if (packageJsonText) {
        const packageJson = JSON.parse(packageJsonText);
        npmRequirements = Object.entries({
            ...(packageJson.dependencies || {}),
            ...(packageJson.peerDependencies || {})
        }).map(([name, version]) => ({ name, version: String(version).replace(/^[~^]/, '') }));
    }

    const warnings = [];
    if (helperFiles.length > 0) {
        warnings.push(`Found helper files: ${helperFiles.join(', ')}. Letta tools are saved as one source_code field; local imports are not uploaded as separate files.`);
        warnings.push('Bundle helper code into the main tool file before saving if the tool imports local modules.');
    }

    return { pipRequirements, npmRequirements, helperFiles, warnings };
}

async function readSkillSource(targetPath) {
    const stat = await fs.stat(targetPath);
    let sourcePath = targetPath;
    let metadata = {
        pipRequirements: [],
        npmRequirements: [],
        helperFiles: [],
        warnings: []
    };

    if (stat.isDirectory()) {
        const entries = await fs.readdir(targetPath);
        const candidates = ['tool.py', 'skill.py', 'main.py', 'index.js', 'tool.js', 'skill.js', 'index.ts'];
        const candidate = candidates.find(file => entries.includes(file)) ||
            entries.find(file => /\.(py|js|ts)$/i.test(file));

        if (!candidate) {
            throw new Error('No Python, JavaScript, or TypeScript skill source file was found in that folder.');
        }

        sourcePath = path.join(targetPath, candidate);
        metadata = await readFolderSkillMetadata(targetPath, sourcePath);
    }

    const content = await fs.readFile(sourcePath, 'utf8');
    return { path: sourcePath, content, ...metadata };
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f172a',
            symbolColor: '#cbd5e1'
        },
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    ipcMain.handle('read-skill-source-path', async (_event, targetPath) => {
        if (!targetPath || typeof targetPath !== 'string') {
            throw new Error('Enter a valid file or folder path.');
        }

        return readSkillSource(targetPath.trim());
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
