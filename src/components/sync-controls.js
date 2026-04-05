// ============================================================
// SYNC CONTROLS — Topbar Widget for Cloud Sync
// ============================================================
// Shows sync status, manual upload/download, auto-sync toggle
// ============================================================

import { SyncEngine } from '../store/supabase-sync.js';
import { isSupabaseConfigured } from '../store/supabase-config.js';
import { db } from '../store/db.js';

export function createSyncControls() {
  const container = document.createElement('div');
  container.className = 'sync-controls';
  container.id = 'sync-controls';

  let dropdownOpen = false;

  function getTimeSince(date) {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function render() {
    const status = SyncEngine.getStatus();
    const configured = isSupabaseConfigured();

    // Status dot color
    let dotClass = 'sync-dot-gray';
    let statusText = 'Not configured';
    if (!configured) {
      dotClass = 'sync-dot-gray';
      statusText = 'Not configured';
    } else if (status.isSyncing) {
      dotClass = 'sync-dot-blue sync-dot-pulse';
      statusText = 'Syncing...';
    } else if (!status.isOnline) {
      dotClass = 'sync-dot-red';
      statusText = 'Offline';
    } else if (status.pendingChanges) {
      dotClass = 'sync-dot-orange sync-dot-pulse';
      statusText = 'Pending';
    } else if (status.lastSynced) {
      dotClass = 'sync-dot-green';
      statusText = 'Synced';
    } else {
      dotClass = 'sync-dot-gray';
      statusText = 'Ready';
    }

    container.innerHTML = `
      <button class="sync-trigger" id="sync-trigger" title="Cloud Sync — ${statusText}">
        <span class="sync-dot ${dotClass}"></span>
        <i class="ph ${status.isSyncing ? 'ph-arrows-clockwise sync-spin' : 'ph-cloud'}"></i>
      </button>

      <div class="sync-dropdown ${dropdownOpen ? 'active' : ''}" id="sync-dropdown">
        <div class="sync-dropdown-header">
          <span class="sync-dropdown-title">
            <i class="ph ph-cloud"></i> Cloud Sync
          </span>
          <span class="sync-status-badge ${dotClass.replace('sync-dot-', 'sync-badge-')}">
            ${statusText}
          </span>
        </div>

        ${!configured ? `
          <div class="sync-notice">
            <i class="ph ph-warning-circle"></i>
            <div>
              <div class="font-medium">Supabase Not Connected</div>
              <div class="text-xs text-muted">Open <code>src/store/supabase-config.js</code> and add your Supabase URL & Key</div>
            </div>
          </div>
        ` : `
          ${status.lastError ? `
            <div class="sync-error">
              <i class="ph ph-warning"></i>
              <span>${status.lastError}</span>
            </div>
          ` : ''}

          ${status.progress ? `
            <div class="sync-info-row" style="background:rgba(99,102,241,0.08);border-radius:6px;padding:8px 10px;margin-bottom:6px;">
              <span style="font-size:11px;color:var(--accent-primary);"><i class="ph ph-arrows-clockwise sync-spin"></i> ${status.progress}</span>
            </div>
          ` : ''}

          <div class="sync-info-row">
            <span class="text-muted"><i class="ph ph-clock"></i> Last synced</span>
            <span class="font-medium">${getTimeSince(status.lastSynced)}</span>
          </div>

          <div class="sync-info-row">
            <span class="text-muted"><i class="ph ph-wifi-high"></i> Connection</span>
            <span class="font-medium ${status.isOnline ? 'text-success' : 'text-danger'}">
              ${status.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div class="sync-actions">
            <button class="btn btn-sm btn-sync-upload" id="btn-sync-upload" ${status.isSyncing ? 'disabled' : ''}>
              <i class="ph ph-cloud-arrow-up"></i> Upload
            </button>
            <button class="btn btn-sm btn-sync-download" id="btn-sync-download" ${status.isSyncing ? 'disabled' : ''}>
              <i class="ph ph-cloud-arrow-down"></i> Download
            </button>
          </div>

          <div class="sync-divider"></div>

          <div class="sync-info-row">
            <span class="text-muted"><i class="ph ph-arrows-clockwise"></i> Auto Sync</span>
            <label class="sync-toggle">
              <input type="checkbox" id="sync-auto-toggle" ${status.autoSyncEnabled ? 'checked' : ''}>
              <span class="sync-toggle-slider"></span>
            </label>
          </div>

          ${status.autoSyncEnabled ? `
            <div class="sync-info-row">
              <span class="text-muted"><i class="ph ph-timer"></i> Interval</span>
              <select class="sync-interval-select" id="sync-interval-select">
                <option value="30000" ${status.autoSyncInterval === 30000 ? 'selected' : ''}>30 sec</option>
                <option value="60000" ${status.autoSyncInterval === 60000 ? 'selected' : ''}>1 min</option>
                <option value="300000" ${status.autoSyncInterval === 300000 ? 'selected' : ''}>5 min</option>
                <option value="900000" ${status.autoSyncInterval === 900000 ? 'selected' : ''}>15 min</option>
              </select>
            </div>
          ` : ''}
        `}
      </div>
    `;

    // ── Bind events ────────────────────────────────
    const trigger = container.querySelector('#sync-trigger');
    trigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownOpen = !dropdownOpen;
      render();
    });

    container.querySelector('#btn-sync-upload')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      btn.innerHTML = '<i class="ph ph-arrows-clockwise sync-spin"></i> Uploading...';
      btn.disabled = true;
      const result = await SyncEngine.uploadToCloud(db);
      if (result.success) {
        showToast('✅ Data uploaded to cloud!', 'success');
      } else {
        showToast('❌ Upload failed: ' + result.error, 'error');
      }
      render();
    });

    container.querySelector('#btn-sync-download')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      btn.innerHTML = '<i class="ph ph-arrows-clockwise sync-spin"></i> Downloading...';
      btn.disabled = true;
      const result = await SyncEngine.downloadFromCloud(db);
      if (result.success) {
        showToast('✅ Data downloaded from cloud!', 'success');
        // Refresh the current view
        window.dispatchEvent(new CustomEvent('view-activated', {
          detail: { route: window.location.hash.substring(1) }
        }));
      } else {
        showToast('❌ Download failed: ' + result.error, 'error');
      }
      render();
    });

    container.querySelector('#sync-auto-toggle')?.addEventListener('change', (e) => {
      e.stopPropagation();
      SyncEngine.setAutoSync(e.target.checked, db);
      render();
    });

    container.querySelector('#sync-interval-select')?.addEventListener('change', (e) => {
      e.stopPropagation();
      SyncEngine.setAutoSyncInterval(Number(e.target.value), db);
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && dropdownOpen) {
      dropdownOpen = false;
      render();
    }
  });

  // Subscribe to sync state changes
  SyncEngine.subscribe(() => render());

  // Auto re-render "Last synced: Xm ago" every 30s
  setInterval(() => { if (!dropdownOpen) return; render(); }, 30000);

  // Initial render
  render();
  return container;
}

// ── Toast notification helper ─────────────────────────────
function showToast(message, type = 'info') {
  const existing = document.getElementById('sync-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'sync-toast';
  toast.className = `sync-toast sync-toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('sync-toast-exit');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

export default createSyncControls;
