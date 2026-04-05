import { db, fmt } from '../store/db.js';
import { SyncEngine } from '../store/supabase-sync.js';
import { isSupabaseConfigured } from '../store/supabase-config.js';

export default function BackupView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let importStatus = null;

    const render = () => {
        const syncStatus = SyncEngine.getStatus();
        const configured = isSupabaseConfigured();

        c.innerHTML = `
          <div class="card mb-4">
            <div class="section-header">
              <div class="section-title"><i class="ph ph-cloud-arrow-down"></i> Backup & Data Management</div>
            </div>
            <p class="text-muted mb-4">Export your data, import backups, or sync with Supabase cloud. All data is stored locally in IndexedDB (offline-first).</p>
            
            <div class="grid-3 mb-4">
              <div class="stat-card" style="border-left: 4px solid var(--accent-success);">
                <div class="stat-label">Export Full Backup</div>
                <p class="text-sm text-muted mb-2">Download your entire ERP data as a JSON file</p>
                <button class="btn btn-success" id="btn-export"><i class="ph ph-download-simple"></i> Export Data</button>
              </div>
              <div class="stat-card" style="border-left: 4px solid var(--accent-primary);">
                <div class="stat-label">Import Data</div>
                <p class="text-sm text-muted mb-2">Restore or merge from a JSON backup file</p>
                <input type="file" id="import-file" accept=".json" style="display:none">
                <button class="btn btn-primary" id="btn-import-select"><i class="ph ph-upload-simple"></i> Select File</button>
              </div>
              <div class="stat-card" style="border-left: 4px solid var(--accent-info);">
                <div class="stat-label">Cloud Sync Status</div>
                <p class="text-sm text-muted mb-2">
                  ${configured 
                    ? `Supabase connected • Version: ${syncStatus.remoteVersion || 'N/A'}`
                    : 'Supabase not configured'}
                </p>
                <div class="flex gap-2">
                  <button class="btn btn-sm ${configured ? 'btn-primary' : 'btn-secondary'}" id="btn-cloud-upload" ${!configured ? 'disabled title="Configure Supabase first"' : ''}>
                    <i class="ph ph-cloud-arrow-up"></i> Upload to Cloud
                  </button>
                  <button class="btn btn-sm ${configured ? 'btn-success' : 'btn-secondary'}" id="btn-cloud-download" ${!configured ? 'disabled title="Configure Supabase first"' : ''}>
                    <i class="ph ph-cloud-arrow-down"></i> Download from Cloud
                  </button>
                </div>
                ${syncStatus.lastSynced ? `<div class="text-xs text-muted mt-2"><i class="ph ph-clock"></i> Last synced: ${new Date(syncStatus.lastSynced).toLocaleString()}</div>` : ''}
                ${syncStatus.lastError ? `<div class="text-xs text-danger mt-1"><i class="ph ph-warning"></i> ${syncStatus.lastError}</div>` : ''}
              </div>
            </div>
          </div>

          <div id="import-panel" style="display:none;" class="card mb-4">
            <div class="section-header"><div class="section-title"><i class="ph ph-upload-simple"></i> Import Options</div></div>
            <div id="import-preview" class="mb-4"></div>
            <div class="panel mb-4">
              <div class="panel-title">Choose Import Strategy</div>
              <div class="grid-3">
                <label class="strategy-option" style="display:flex;flex-direction:column;align-items:center;padding:20px;border:var(--glass-border);border-radius:var(--radius-md);cursor:pointer;">
                  <input type="radio" name="strategy" value="replace" style="margin-bottom:10px;">
                  <span class="font-bold" style="color:var(--accent-danger);">🔄 Replace All</span>
                  <span class="text-sm text-muted text-center mt-2">Delete ALL existing data and import fresh. Clean restore.</span>
                </label>
                <label class="strategy-option" style="display:flex;flex-direction:column;align-items:center;padding:20px;border:var(--glass-border);border-radius:var(--radius-md);cursor:pointer;border-color:var(--accent-primary);">
                  <input type="radio" name="strategy" value="merge" checked style="margin-bottom:10px;">
                  <span class="font-bold" style="color:var(--accent-primary);">🔁 Smart Merge</span>
                  <span class="text-sm text-muted text-center mt-2">Update existing records & add new ones. Best for sync.</span>
                </label>
                <label class="strategy-option" style="display:flex;flex-direction:column;align-items:center;padding:20px;border:var(--glass-border);border-radius:var(--radius-md);cursor:pointer;">
                  <input type="radio" name="strategy" value="add_only" style="margin-bottom:10px;">
                  <span class="font-bold" style="color:var(--accent-success);">➕ Add Only</span>
                  <span class="text-sm text-muted text-center mt-2">Only insert new records, skip duplicates. Safe append.</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button class="btn btn-ghost" id="btn-cancel-import">Cancel</button>
              <button class="btn btn-primary" id="btn-execute-import"><i class="ph ph-check-circle"></i> Apply Import</button>
            </div>
          </div>

          <div id="import-result" style="display:none;" class="card mb-4"></div>

          <div class="card">
            <div class="section-header">
              <div class="section-title"><i class="ph ph-database"></i> Local Data Summary</div>
            </div>
            <div class="grid-4">
              ${Object.entries(db.data || {}).map(([key, val]) => {
                if (typeof val === 'object' && !Array.isArray(val)) return '';
                const count = Array.isArray(val) ? val.length : 0;
                return count > 0 ? `<div class="stat-card"><div class="stat-value text-sm">${count}</div><div class="stat-label text-xs">${key}</div></div>` : '';
              }).filter(Boolean).join('')}
            </div>
          </div>
        `;

        // Bind events
        c.querySelector('#btn-export').addEventListener('click', handleExport);
        c.querySelector('#btn-import-select').addEventListener('click', () => c.querySelector('#import-file').click());
        c.querySelector('#import-file').addEventListener('change', handleFileSelect);
        c.querySelector('#btn-cancel-import')?.addEventListener('click', () => {
            c.querySelector('#import-panel').style.display = 'none';
        });
        c.querySelector('#btn-execute-import')?.addEventListener('click', handleImport);
        
        // Cloud sync buttons
        c.querySelector('#btn-cloud-upload')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.innerHTML = '<i class="ph ph-arrows-clockwise sync-spin"></i> Uploading...';
            btn.disabled = true;
            const result = await SyncEngine.uploadToCloud(db);
            if (result.success) {
                alert('✅ Data uploaded to Supabase cloud!');
            } else {
                alert('❌ Upload failed: ' + result.error);
            }
            render();
        });
        
        c.querySelector('#btn-cloud-download')?.addEventListener('click', async (e) => {
            if (!confirm('⚠️ This will replace your local data with cloud data. Continue?')) return;
            const btn = e.currentTarget;
            btn.innerHTML = '<i class="ph ph-arrows-clockwise sync-spin"></i> Downloading...';
            btn.disabled = true;
            const result = await SyncEngine.downloadFromCloud(db);
            if (result.success) {
                alert('✅ Data downloaded from Supabase cloud!');
                location.reload();
            } else {
                alert('❌ Download failed: ' + result.error);
            }
            render();
        });
    };

    let selectedFileData = null;

    const handleExport = () => {
        try {
            const backup = {
                _meta: {
                    app: 'RubberERP',
                    version: '3.0-supabase',
                    exportDate: new Date().toISOString(),
                    tables: Object.keys(db.data),
                    recordCounts: {}
                },
                data: db.data
            };
            
            for (const [k, v] of Object.entries(db.data)) {
                backup._meta.recordCounts[k] = Array.isArray(v) ? v.length : (v ? 1 : 0);
            }
            
            // Download as file
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `RubberERP_Backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            alert('✅ Backup exported from local IndexedDB!');
        } catch (e) {
            alert('❌ Export failed: ' + e.message);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                selectedFileData = JSON.parse(ev.target.result);
                const meta = selectedFileData._meta || {};
                
                // Show preview
                c.querySelector('#import-panel').style.display = 'block';
                c.querySelector('#import-preview').innerHTML = `
                    <div class="panel">
                      <div class="panel-title"><i class="ph ph-file"></i> File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)</div>
                      ${meta.exportDate ? `<p class="text-sm text-muted">Exported: ${new Date(meta.exportDate).toLocaleString()}</p>` : ''}
                      ${meta.version ? `<p class="text-sm text-muted">Version: ${meta.version}</p>` : ''}
                      <div class="grid-4 mt-2">
                        ${Object.entries(meta.recordCounts || {}).map(([k, v]) => 
                          `<div class="text-sm"><span class="text-muted">${k}:</span> <span class="font-bold">${v}</span></div>`
                        ).join('')}
                      </div>
                    </div>
                `;
            } catch (err) {
                alert('❌ Invalid JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = () => {
        if (!selectedFileData) { alert('Select a file first'); return; }
        
        const strategy = c.querySelector('input[name="strategy"]:checked')?.value || 'merge';
        const strategyLabels = { replace: 'REPLACE ALL', merge: 'SMART MERGE', add_only: 'ADD ONLY' };
        
        if (strategy === 'replace') {
            if (!confirm(`⚠️ WARNING: This will DELETE ALL existing data and replace with backup. Continue?`)) return;
        }
        
        try {
            // Get the actual data from the backup
            const importData = selectedFileData.data || selectedFileData;
            
            if (strategy === 'replace') {
                // Complete replacement
                db.mergeRemoteState(importData);
            } else if (strategy === 'merge') {
                // Smart merge: for arrays, merge by id; for objects, deep merge
                const currentData = db.data;
                for (const [key, val] of Object.entries(importData)) {
                    if (Array.isArray(val) && Array.isArray(currentData[key])) {
                        const existingIds = new Set(currentData[key].map(r => r.id));
                        for (const record of val) {
                            if (existingIds.has(record.id)) {
                                // Update existing
                                const idx = currentData[key].findIndex(r => r.id === record.id);
                                if (idx >= 0) currentData[key][idx] = record;
                            } else {
                                // Insert new
                                currentData[key].push(record);
                            }
                        }
                    } else if (typeof val === 'object' && !Array.isArray(val)) {
                        currentData[key] = { ...currentData[key], ...val };
                    }
                }
                db.saveData();
                db.notify();
            } else if (strategy === 'add_only') {
                // Only add records that don't exist
                const currentData = db.data;
                for (const [key, val] of Object.entries(importData)) {
                    if (Array.isArray(val) && Array.isArray(currentData[key])) {
                        const existingIds = new Set(currentData[key].map(r => r.id));
                        for (const record of val) {
                            if (!existingIds.has(record.id)) {
                                currentData[key].push(record);
                            }
                        }
                    }
                }
                db.saveData();
                db.notify();
            }
            
            c.querySelector('#import-panel').style.display = 'none';
            const resultDiv = c.querySelector('#import-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div class="section-header"><div class="section-title" style="color:var(--accent-success);">✅ Import Successful!</div></div>
                <p class="text-muted">Strategy: <b>${strategyLabels[strategy]}</b>. Data has been applied locally.</p>
                <button class="btn btn-primary mt-2" onclick="location.reload()"><i class="ph ph-arrows-clockwise"></i> Reload App</button>
            `;
        } catch (e) {
            alert('❌ Import failed: ' + e.message);
        }
    };

    render();
    return c;
}
