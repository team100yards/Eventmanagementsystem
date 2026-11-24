/**
 * Event Management System (EMS) — BY 100 YARDS
 * Universal Suite Navigation, Pitch-Side Resilience Pill & Ergonomics HUD
 */
(function(window, document) {
  'use strict';

  const TOOLS = [
    { id: 'dashboard', name: 'Dashboard Hub', icon: '🏛️', url: 'index.html', desc: 'Main Tournament & Event Dashboard' },
    { id: 'tournaments', name: 'Tournaments & Leagues', icon: '🏆', url: 'index.html?tab=tournaments', desc: 'Leagues, knockouts, brackets & group stages' },
    { id: 'matches', name: 'Match Centre & Fixtures', icon: '📋', url: 'index.html?tab=matches', desc: 'Fixtures, schedules, live clock & scorecards' },
    { id: 'teams', name: 'Teams & Clubs', icon: '🏟️', url: 'index.html?tab=teams', desc: 'Team rosters, crests, squad lists & coaches' },
    { id: 'players', name: 'Players Directory', icon: '👥', url: 'index.html?tab=players', desc: 'Player database, stats, photos & numbers' },
    { id: 'desk', name: 'Live Match Phone Desk', icon: '📱', url: 'match-phone.html', desc: 'Pitchside mobile operator desk for live scoring' },
    { id: 'formation', name: 'Formation Visualizer', icon: '📋', url: 'index.html?tab=formation', desc: 'Tactical pitch lineup builder & visualizer' }
  ];

  function getCurrentTool() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('formation-builder')) return 'formation';
    if (path.includes('match-phone')) return 'desk';
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab')) return params.get('tab');
    return 'dashboard';
  }

  function getClubBranding() {
    try {
      const b = localStorage.getItem('fhq_branding');
      if (b) {
        const parsed = JSON.parse(b);
        return {
          name: parsed.name || localStorage.getItem('hy_name') || 'Event Management System',
          logo: parsed.logo || localStorage.getItem('hy_logo') || ''
        };
      }
    } catch (e) {}
    return { name: localStorage.getItem('hy_name') || 'Event Management System', logo: localStorage.getItem('hy_logo') || '' };
  }

  let syncDrawerOpen = false;
  let userDropdownOpen = false;

  const CMSNav = {
    currentToolId: getCurrentTool(),

    renderAuthClusterHtml: function() {
      const auth = window.CMSAuth;
      if (!auth || !auth.currentUser) {
        return `
          <button type="button" class="cms-nav-auth-btn" onclick="if(window.CMSAuth){window.CMSAuth.openAuthModal('signin');}" title="Sign In (Google or Email)">
            <svg viewBox="0 0 48 48" width="14" height="14" style="flex-shrink:0;">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.79l7.97-6.2z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Sign In</span>
          </button>
        `;
      }

      const user = auth.currentUser;
      const tierId = auth.currentTier || 'pro';
      const tierObj = (auth.tiers && auth.tiers[tierId]) || { badge: 'PRO', color: '#00e676', name: 'Pro' };
      const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Coach');
      const initial = (displayName[0] || 'C').toUpperCase();
      const avatarHtml = user.photoURL 
        ? `<img src="${user.photoURL}" class="cms-nav-user-avatar" alt="${displayName}">`
        : `<div class="cms-nav-user-avatar">${initial}</div>`;

      return `
        <div class="cms-nav-user-chip" id="cms-nav-user-chip" onclick="CMSNav.toggleUserDropdown(event)" title="Account & Subscription (${displayName})">
          ${avatarHtml}
          <span style="max-width:85px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayName}</span>
          <span class="cms-nav-tier-badge" style="background:${tierObj.color}22;color:${tierObj.color};border:1px solid ${tierObj.color}66;">
            ${tierObj.badge}
          </span>

          <!-- User Profile & Subscription Dropdown -->
          <div class="cms-user-dropdown" id="cms-user-dropdown" style="display:none;" onclick="event.stopPropagation();">
            <div class="cms-user-dropdown-header">
              ${avatarHtml}
              <div style="overflow:hidden;flex:1;">
                <div style="font-weight:700;color:#ffffff;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${displayName}</div>
                <div style="font-size:11px;color:var(--cms-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.email || ''}</div>
              </div>
            </div>

            <div style="padding:6px 8px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.06);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:10px;font-weight:700;color:var(--cms-text-tertiary);text-transform:uppercase;letter-spacing:0.5px;">Active Tier</span>
                <span class="cms-nav-tier-badge" style="background:${tierObj.color}22;color:${tierObj.color};border:1px solid ${tierObj.color}66;">${tierObj.badge}</span>
              </div>
              <div style="font-weight:800;color:${tierObj.color};font-size:12.5px;margin-top:3px;">
                ${tierObj.name}
              </div>
            </div>

            <!-- Tier Simulator for instant evaluation -->
            <div style="border-top:1px solid var(--cms-border-subtle);padding-top:6px;">
              <div style="font-size:10px;font-weight:700;color:var(--cms-text-tertiary);text-transform:uppercase;padding:0 4px 4px 4px;">Tier Simulator (Preview):</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
                <button type="button" class="cms-user-dropdown-item" style="padding:4px 6px;font-size:11px;${tierId==='free'?'background:rgba(255,255,255,0.15);':''}" onclick="CMSAuth.setTierOverride('free')">⚪ Free</button>
                <button type="button" class="cms-user-dropdown-item" style="padding:4px 6px;font-size:11px;${tierId==='starter'?'background:rgba(0,176,255,0.2);':''}" onclick="CMSAuth.setTierOverride('starter')">🔵 Starter</button>
                <button type="button" class="cms-user-dropdown-item" style="padding:4px 6px;font-size:11px;${tierId==='pro'?'background:rgba(0,230,118,0.2);':''}" onclick="CMSAuth.setTierOverride('pro')">🟢 Pro</button>
                <button type="button" class="cms-user-dropdown-item" style="padding:4px 6px;font-size:11px;${tierId==='elite'?'background:rgba(255,214,0,0.2);':''}" onclick="CMSAuth.setTierOverride('elite')">🟡 Elite</button>
              </div>
            </div>

            <div style="border-top:1px solid var(--cms-border-subtle);padding-top:4px;">
              <button type="button" class="cms-user-dropdown-item" onclick="if(window.location.pathname.endsWith('index.html')||window.location.pathname==='/'||window.location.pathname.endsWith('/')){if(typeof goSettings==='function')goSettings();CMSNav.closeUserDropdown();}else{window.location.href='index.html?view=settings';}">
                <span>⚙️ Account &amp; Plan Settings</span>
                <span style="font-size:10px;color:var(--cms-accent-green);">Manage</span>
              </button>
              <button type="button" class="cms-user-dropdown-item" onclick="CMSNav.openPinSetupModal()">
                <span>🔐 Pitch 4-Digit PIN</span>
                <span style="font-size:10px;color:var(--cms-text-secondary);">Manage</span>
              </button>
              <button type="button" class="cms-user-dropdown-item" style="color:#ff5252;" onclick="CMSAuth.signOut();CMSNav.closeUserDropdown();">
                <span>🚪 Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      `;
    },

    renderHeaderHtml: function() {
      const current = this.currentToolId;
      const branding = getClubBranding();
      const currentToolObj = TOOLS.find(t => t.id === current) || TOOLS[0];
      const isOnline = navigator.onLine;

      const navLinksHtml = TOOLS.map(t => {
        const isActive = t.id === current;
        const hasAccess = window.CMSAuth ? window.CMSAuth.canAccessTool(t.id) : true;
        if (!hasAccess) {
          return `
            <a href="javascript:void(0)" class="cms-nav-link locked" onclick="if(window.CMSAuth) CMSAuth.showToolLockModal('${t.id}')" title="${t.desc} (Locked on current plan)">
              <span>${t.icon}</span>
              <span>${t.name}</span>
            </a>
          `;
        }
        return `
          <a href="${t.url}" class="cms-nav-link ${isActive ? 'active' : ''}" data-tool-id="${t.id}" onclick="return window.handleCMSNavToolClick ? window.handleCMSNavToolClick('${t.id}','${t.url}',event) : true;" title="${t.desc}">
            <span>${t.icon}</span>
            <span>${t.name}</span>
          </a>
        `;
      }).join('');

      return `
        <header class="cms-suite-topbar" id="cms-universal-topbar">
          <div class="cms-nav-left">
            <a href="index.html" class="cms-nav-brand" title="Return to Core Dashboard">
              <div class="cms-nav-logo-badge">⚽</div>
              <div class="cms-nav-brand-text">
                <span class="cms-nav-brand-title">${branding.name}</span>
                <span class="cms-nav-brand-sub">CMS Pro Suite</span>
              </div>
            </a>
            <div class="cms-nav-divider"></div>
            <div class="cms-nav-active-tool-pill">
              <span class="cms-nav-active-dot"></span>
              <span>${currentToolObj.name}</span>
            </div>
          </div>

          <nav class="cms-nav-center" id="cms-nav-links-center">
            ${navLinksHtml}
          </nav>

          <div class="cms-nav-right">
            <!-- Connection & Offline Resilience Pill -->
            <div class="cms-nav-sync-pill" id="cms-nav-sync-pill" onclick="CMSNav.toggleSyncDrawer()" title="Pitchside & Cloud Sync Status (Click to inspect)">
              <span class="cms-sync-dot ${isOnline ? 'online' : 'offline'}" id="cms-sync-dot"></span>
              <span class="cms-sync-label" id="cms-sync-label">${isOnline ? 'Live Sync' : 'Saved Locally (Offline)'}</span>
            </div>

            <!-- Quick Command Palette Switcher -->
            <button type="button" class="cms-nav-cmd-btn" onclick="CMSNav.openCommandPalette()" title="Quick Switcher (Press Ctrl+K or Cmd+K)">
              <span>⚡ Switcher</span>
              <span class="cms-nav-kbd">⌘K</span>
            </button>

            <!-- User Authentication & Subscription Cluster -->
            <div id="cms-auth-cluster-mount" style="position:relative;display:flex;align-items:center;">
              ${this.renderAuthClusterHtml()}
            </div>

            ${current !== 'squad' ? `
              <a href="index.html" class="cms-nav-action-btn" title="Back to Squad Dashboard">
                <span>← Dashboard</span>
              </a>
            ` : ''}

            <!-- Sync Drawer Dropdown -->
            <div class="cms-nav-sync-drawer" id="cms-sync-drawer" style="display:none;">
              <div class="cms-sync-drawer-row">
                <span style="font-weight:700;color:#ffffff;display:flex;align-items:center;gap:6px;">
                  <span id="cms-drawer-status-dot" class="cms-sync-dot ${isOnline ? 'online' : 'offline'}"></span>
                  <span id="cms-drawer-status-text">${isOnline ? 'Online (Connected)' : 'Offline (Pitchside Mode)'}</span>
                </span>
                <span id="cms-drawer-pending-badge" style="font-family:var(--cms-font-mono);font-size:11px;color:var(--cms-text-secondary);">0 pending</span>
              </div>
              
              <div style="font-size:11.5px;color:var(--cms-text-secondary);line-height:1.4;">
                All squad edits, session notes, and match ratings are optimistically saved locally on your device and automatically synced to the cloud upon reconnection.
              </div>

              <div class="cms-sync-drawer-row" style="border-top:1px solid var(--cms-border-subtle);padding-top:10px;">
                <span style="font-size:12px;font-weight:600;">Outdoor Sun Glare Mode:</span>
                <button type="button" class="cms-pitch-mode-btn" onclick="CMSNav.togglePitchMode()" style="padding:4px 10px;border-radius:6px;background:rgba(255,255,255,0.08);border:1px solid var(--cms-border-medium);color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;">
                  ☀️ Sunlight Turf
                </button>
              </div>

              <button type="button" class="cms-sync-drawer-btn" onclick="CMSNav.forceSyncNow()">
                <span>⚡ Force Cloud Sync</span>
              </button>
            </div>
          </div>
        </header>
      `;
    },

    updateSyncPill: function(status, count = 0) {
      const dot = document.getElementById('cms-sync-dot');
      const label = document.getElementById('cms-sync-label');
      const drawerDot = document.getElementById('cms-drawer-status-dot');
      const drawerText = document.getElementById('cms-drawer-status-text');
      const drawerPending = document.getElementById('cms-drawer-pending-badge');

      if (!dot || !label) return;

      dot.className = 'cms-sync-dot ' + status;
      if (drawerDot) drawerDot.className = 'cms-sync-dot ' + status;

      let labelText = 'Live Sync';
      let descText = 'Online (Connected)';

      if (status === 'offline') {
        labelText = count > 0 ? `Saved Offline (${count})` : 'Saved Locally (Offline)';
        descText = 'Offline (Pitchside Mode)';
      } else if (status === 'syncing') {
        labelText = 'Syncing...';
        descText = 'Flushing changes to cloud...';
      } else if (status === 'error') {
        labelText = 'Network Error';
        descText = 'Temporary network disconnect';
      }

      label.textContent = labelText;
      if (drawerText) drawerText.textContent = descText;
      if (drawerPending) drawerPending.textContent = `${count} pending`;
    },

    toggleSyncDrawer: function() {
      const drawer = document.getElementById('cms-sync-drawer');
      if (!drawer) return;
      syncDrawerOpen = !syncDrawerOpen;
      drawer.style.display = syncDrawerOpen ? 'flex' : 'none';
    },

    togglePitchMode: function() {
      if (window.CMSStorage && typeof window.CMSStorage.togglePitchMode === 'function') {
        const next = window.CMSStorage.togglePitchMode();
        if (window.CMSBus) {
          window.CMSBus.notify(next === 'sunlight' ? 'High-Contrast Sunlight Turf Enabled ☀️' : 'Midnight Tactical Mode Enabled 🌙');
        }
      }
    },

    forceSyncNow: function() {
      if (window.CMSStorage && typeof window.CMSStorage.flushOfflineQueue === 'function') {
        const db = window.db || null;
        window.CMSStorage.flushOfflineQueue(db);
        this.updateSyncPill('syncing', 0);
      }
    },

    /**
     * Mount floating Undo/Redo & Ergonomic gesture HUD directly onto canvas container
     * @param {string|HTMLElement} targetContainer
     * @param {object} options - { onUndo, onRedo, getStepCount, onToggleMode, canvas }
     */
    initCanvasHUD: function(targetContainer, options = {}) {
      const container = typeof targetContainer === 'string' ? document.getElementById(targetContainer) : targetContainer;
      if (!container) return;

      let hud = container.querySelector('.cms-canvas-hud');
      if (!hud) {
        hud = document.createElement('div');
        hud.className = 'cms-canvas-hud';
        container.style.position = 'relative';
        container.appendChild(hud);
      }

      hud.innerHTML = `
        <button type="button" class="cms-hud-btn" id="cms-hud-undo-btn" title="Undo (Ctrl+Z)">
          <span>↩️</span><span style="font-size:11px;">Undo</span>
        </button>
        <div class="cms-hud-counter" id="cms-hud-step-counter">0</div>
        <button type="button" class="cms-hud-btn" id="cms-hud-redo-btn" title="Redo (Ctrl+Y)">
          <span>↪️</span><span style="font-size:11px;">Redo</span>
        </button>
        <div class="cms-hud-sep"></div>
        <button type="button" class="cms-hud-btn" id="cms-hud-sunlight-btn" title="Toggle Sunlight Turf Mode">
          <span>☀️</span>
        </button>
      `;

      const undoBtn = hud.querySelector('#cms-hud-undo-btn');
      const redoBtn = hud.querySelector('#cms-hud-redo-btn');
      const sunlightBtn = hud.querySelector('#cms-hud-sunlight-btn');

      if (undoBtn && options.onUndo) undoBtn.onclick = (e) => { e.stopPropagation(); options.onUndo(); };
      if (redoBtn && options.onRedo) redoBtn.onclick = (e) => { e.stopPropagation(); options.onRedo(); };
      if (sunlightBtn) {
        sunlightBtn.onclick = (e) => {
          e.stopPropagation();
          if (options.onToggleMode) options.onToggleMode();
          else this.togglePitchMode();
        };
      }

      // Update step count periodically or on change
      if (options.getStepCount) {
        const updateStep = () => {
          const counter = hud.querySelector('#cms-hud-step-counter');
          if (counter) counter.textContent = String(options.getStepCount() || 0);
        };
        updateStep();
        setInterval(updateStep, 500);
      }

      // Touch & Palm Rejection Ergonomics on targeted canvas
      const targetCanvas = options.canvas || container.querySelector('canvas') || container;
      if (targetCanvas && !targetCanvas._cmsPalmGuardAttached) {
        targetCanvas._cmsPalmGuardAttached = true;
        targetCanvas.style.touchAction = 'none';

        // Filter out palm rests (width/height > 35px or multi-finger palm contacts)
        targetCanvas.addEventListener('pointerdown', (e) => {
          if (e.pointerType === 'touch' && (e.width > 35 || e.height > 35)) {
            // Palm detected: discard event to prevent accidental stray markings
            e.stopImmediatePropagation();
            e.preventDefault();
          }
        }, { capture: true, passive: false });
      }
    },

    toggleUserDropdown: function(e) {
      if (e) e.stopPropagation();
      const dropdown = document.getElementById('cms-user-dropdown');
      if (!dropdown) return;
      userDropdownOpen = !userDropdownOpen;
      dropdown.style.display = userDropdownOpen ? 'flex' : 'none';
      if (userDropdownOpen) {
        const drawer = document.getElementById('cms-sync-drawer');
        if (drawer) drawer.style.display = 'none';
        syncDrawerOpen = false;
      }
    },

    closeUserDropdown: function() {
      const dropdown = document.getElementById('cms-user-dropdown');
      if (dropdown) dropdown.style.display = 'none';
      userDropdownOpen = false;
    },

    updateAuthUi: function() {
      const clusterMount = document.getElementById('cms-auth-cluster-mount');
      if (clusterMount) {
        clusterMount.innerHTML = this.renderAuthClusterHtml();
      }
      const linksCenter = document.getElementById('cms-nav-links-center');
      if (linksCenter) {
        const current = this.currentToolId;
        linksCenter.innerHTML = TOOLS.map(t => {
          const isActive = t.id === current;
          const hasAccess = window.CMSAuth ? window.CMSAuth.canAccessTool(t.id) : true;
          if (!hasAccess) {
            return `
              <a href="javascript:void(0)" class="cms-nav-link locked" onclick="if(window.CMSAuth) CMSAuth.showToolLockModal('${t.id}')" title="${t.desc} (Locked on current plan)">
                <span>${t.icon}</span>
                <span>${t.name}</span>
              </a>
            `;
          }
          return `
            <a href="${t.url}" class="cms-nav-link ${isActive ? 'active' : ''}" data-tool-id="${t.id}" onclick="return window.handleCMSNavToolClick ? window.handleCMSNavToolClick('${t.id}','${t.url}',event) : true;" title="${t.desc}">
              <span>${t.icon}</span>
              <span>${t.name}</span>
            </a>
          `;
        }).join('');
      }
    },

    openPinSetupModal: function() {
      this.closeUserDropdown();
      if (typeof window.openAdmin === 'function') {
        window.openAdmin();
        return;
      }
      let pinModal = document.getElementById('cms-pin-modal-root');
      if (!pinModal) {
        document.body.insertAdjacentHTML('beforeend', `
          <div class="cms-auth-backdrop" id="cms-pin-modal-root" onclick="if(event.target===this) this.style.display='none'">
            <div class="cms-auth-card" style="max-width:340px;text-align:center;">
              <button type="button" class="cms-auth-close-btn" onclick="document.getElementById('cms-pin-modal-root').style.display='none'">✕</button>
              <div style="font-size:32px;margin-bottom:8px;">🔐</div>
              <h3 style="color:#fff;font-family:var(--cms-font-display);font-size:20px;margin-bottom:4px;">Pitch 4-Digit PIN</h3>
              <p style="font-size:12px;color:var(--cms-text-secondary);margin-bottom:16px;">This PIN protects your lineups and sessions from accidental touch edits pitchside.</p>
              <div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px;">
                <input type="password" id="cms-quick-pin" maxlength="4" style="width:140px;height:44px;font-size:24px;text-align:center;letter-spacing:10px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);color:#fff;" placeholder="••••" />
              </div>
              <button type="button" class="cms-auth-submit-btn" onclick="CMSNav.saveQuickPin()">Save 4-Digit PIN</button>
            </div>
          </div>
        `);
        pinModal = document.getElementById('cms-pin-modal-root');
      }
      pinModal.style.display = 'flex';
      const input = document.getElementById('cms-quick-pin');
      if (input) {
        input.value = localStorage.getItem('fhq_edit_pin') || '1234';
        setTimeout(() => input.focus(), 80);
      }
    },

    saveQuickPin: function() {
      const input = document.getElementById('cms-quick-pin');
      const val = (input?.value || '').trim();
      if (val.length !== 4 || isNaN(val)) {
        alert('PIN must be exactly 4 digits.');
        return;
      }
      localStorage.setItem('fhq_edit_pin', val);
      localStorage.setItem('fhq_adm_pin', val);
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
          firebase.firestore().collection('settings').doc('creds').set({ editPin: val, adminPin: val }, { merge: true }).catch(() => {});
          if (window.CMSAuth && window.CMSAuth.currentUser) {
            firebase.firestore().collection('users').doc(window.CMSAuth.currentUser.uid).set({ editPin: val, adminPin: val }, { merge: true }).catch(() => {});
          }
        } catch (e) {}
      }
      const pinModal = document.getElementById('cms-pin-modal-root');
      if (pinModal) pinModal.style.display = 'none';
      if (window.CMSBus) {
        window.CMSBus.notify('Pitch 4-digit PIN updated successfully! 🔐');
      } else {
        alert('✅ Pitch 4-digit PIN updated!');
      }
    },

    renderCommandPaletteHtml: function() {
      const current = this.currentToolId;
      const itemsHtml = TOOLS.map((t, idx) => {
        const isCurrent = t.id === current;
        const hasAccess = window.CMSAuth ? window.CMSAuth.canAccessTool(t.id) : true;
        const clickAction = hasAccess ? `window.location.href='${t.url}'` : `if(window.CMSAuth){CMSNav.closeCommandPalette();CMSAuth.showToolLockModal('${t.id}');}`;
        const lockBadge = !hasAccess ? `<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.08);color:var(--cms-text-secondary);margin-left:6px;">🔒 Locked</span>` : '';
        return `
          <div class="cms-cmd-item ${idx === 0 ? 'selected' : ''}" data-url="${t.url}" onclick="${clickAction}">
            <div class="cms-cmd-item-left">
              <span class="cms-cmd-item-icon">${t.icon}</span>
              <div>
                <div style="font-weight:700;">${t.name} ${isCurrent ? '<span style="color:var(--cms-accent-green);font-size:10px;margin-left:6px;">(Current)</span>' : ''} ${lockBadge}</div>
                <div style="font-size:11px;color:var(--cms-text-tertiary);">${t.desc}</div>
              </div>
            </div>
            <span class="cms-cmd-item-shortcut">${hasAccess ? 'Jump ↵' : 'Unlock 🔒'}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="cms-cmd-backdrop" id="cms-cmd-backdrop" onclick="if(event.target===this) CMSNav.closeCommandPalette()">
          <div class="cms-cmd-card" role="dialog" aria-modal="true">
            <div class="cms-cmd-search-wrap">
              <span style="font-size:18px;">🔍</span>
              <input type="text" id="cms-cmd-input" class="cms-cmd-input" placeholder="Switch to any tactical tool or studio..." oninput="CMSNav.filterCommandPalette(this.value)">
              <span class="cms-nav-kbd">ESC</span>
            </div>
            <div class="cms-cmd-list" id="cms-cmd-list">
              ${itemsHtml}
              <div class="cms-cmd-item" onclick="CMSNav.closeCommandPalette(); CMSNav.openCopyrightModal();">
                <div class="cms-cmd-item-left">
                  <span class="cms-cmd-item-icon">📜</span>
                  <div>
                    <div style="font-weight:700;">Copyright &amp; Legal Notice</div>
                    <div style="font-size:11px;color:var(--cms-text-tertiary);">100 Yards intellectual property, copyright protection &amp; licensing</div>
                  </div>
                </div>
                <span class="cms-cmd-item-shortcut">Legal 📜</span>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    openCommandPalette: function() {
      let backdrop = document.getElementById('cms-cmd-backdrop');
      if (!backdrop) {
        document.body.insertAdjacentHTML('beforeend', this.renderCommandPaletteHtml());
        backdrop = document.getElementById('cms-cmd-backdrop');
      }
      if (backdrop) {
        backdrop.style.display = 'flex';
        const input = document.getElementById('cms-cmd-input');
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    },

    closeCommandPalette: function() {
      const backdrop = document.getElementById('cms-cmd-backdrop');
      if (backdrop) {
        backdrop.style.display = 'none';
      }
    },

    renderCopyrightModalHtml: function() {
      return `
        <div class="cms-copyright-backdrop" id="cms-copyright-backdrop" onclick="if(event.target===this) CMSNav.closeCopyrightModal()">
          <div class="cms-copyright-dialog" role="dialog" aria-modal="true" aria-labelledby="cms-copyright-title">
            <!-- Header -->
            <div class="cms-copyright-header">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="cms-copyright-badge-icon">📜</div>
                <div>
                  <div id="cms-copyright-title" class="cms-copyright-title">COPYRIGHT &amp; LEGAL NOTICE</div>
                  <div class="cms-copyright-sub">100 Yards &bull; Football Coach &amp; Squad Management System</div>
                </div>
              </div>
              <button type="button" class="cms-copyright-close-btn" onclick="CMSNav.closeCopyrightModal()" aria-label="Close" title="Close dialog">✕</button>
            </div>

            <!-- Body -->
            <div class="cms-copyright-body">
              <!-- Shield Notice Hero -->
              <div class="cms-copyright-hero">
                <div class="cms-copyright-hero-icon">🛡️</div>
                <div>
                  <div class="cms-copyright-hero-headline">&copy; 2026 100 Yards. All Rights Reserved.</div>
                  <div class="cms-copyright-hero-text">
                    This software application, proprietary codebase, interactive tactical engines, user interface design, and related digital assets are protected by international copyright laws, trade secret legislation, and intellectual property conventions.
                  </div>
                </div>
              </div>

              <!-- Protected Modules Grid -->
              <div class="cms-copyright-sec-title">PROTECTED SUITE MODULES &amp; ARCHITECTURE</div>
              <div class="cms-copyright-modules-grid">
                <div class="cms-copyright-mod-item">
                  <span class="mod-icon">🏟️</span>
                  <div>
                    <strong>Squad &amp; Club Management</strong>
                    <span>Multi-team roster modeling, player registries &amp; self-serve onboarding</span>
                  </div>
                </div>
                <div class="cms-copyright-mod-item">
                  <span class="mod-icon">🧩</span>
                  <div>
                    <strong>Tactical Formation Visualizer</strong>
                    <span>Interactive 2D pitch board, tactical coordinate engine &amp; unit shifts</span>
                  </div>
                </div>
                <div class="cms-copyright-mod-item">
                  <span class="mod-icon">📹</span>
                  <div>
                    <strong>Tactical Video Analyzer</strong>
                    <span>Frame-accurate telestration, spotlight beams, 3D discs &amp; player halos</span>
                  </div>
                </div>
                <div class="cms-copyright-mod-item">
                  <span class="mod-icon">✂️</span>
                  <div>
                    <strong>Match Video Clipper</strong>
                    <span>Hardware-accelerated MP4 trimming, clip sequence hub &amp; reels</span>
                  </div>
                </div>
                <div class="cms-copyright-mod-item">
                  <span class="mod-icon">🎯</span>
                  <div>
                    <strong>Player Tracking System</strong>
                    <span>Tactical vision algorithms, speed/radar telemetry &amp; 3D perspective mapping</span>
                  </div>
                </div>
                <div class="cms-copyright-mod-item">
                  <span class="mod-icon">📋</span>
                  <div>
                    <strong>Session &amp; Drill Planner</strong>
                    <span>Periodization drill library, training timelines &amp; A4 PDF sheet generators</span>
                  </div>
                </div>
              </div>

              <!-- Legal Restrictions -->
              <div class="cms-copyright-sec-title">INTELLECTUAL PROPERTY &amp; USAGE RESTRICTIONS</div>
              <div class="cms-copyright-legal-box">
                <p><strong>1. Ownership:</strong> All copyright, title, patents, trademarks, and intellectual property rights in and to the Event Management System (EMS) software and all copies thereof are owned exclusively by <strong>100 Yards</strong>.</p>
                <p><strong>2. Restrictions:</strong> You may not, directly or indirectly, reverse-engineer, decompile, disassemble, modify, create derivative works of, decrypt, or attempt to extract the source code or algorithms of this suite.</p>
                <p><strong>3. Unauthorized Distribution:</strong> Sublicensing, renting, leasing, distributing, broadcasting, framing, or commercially reselling access to any module of this application without explicit written license from 100 Yards is strictly prohibited.</p>
                <p><strong>4. Trademarks:</strong> "100 Yards", the 100 Yards emblem, and "Event Management System" are registered or common-law trademarks of 100 Yards.</p>
              </div>

              <!-- Metadata Box -->
              <div class="cms-copyright-meta-grid">
                <div class="cms-copyright-meta-item">
                  <span class="meta-label">Software Release</span>
                  <span class="meta-val">CMS GA Edition v2026.11</span>
                </div>
                <div class="cms-copyright-meta-item">
                  <span class="meta-label">Publisher</span>
                  <span class="meta-val">100 Yards Digital Sports</span>
                </div>
                <div class="cms-copyright-meta-item">
                  <span class="meta-label">Licensing Status</span>
                  <span class="meta-val" style="color:#00e676;font-weight:700;">✓ Registered &amp; Protected</span>
                </div>
                <div class="cms-copyright-meta-item">
                  <span class="meta-label">Legal &amp; Inquiries</span>
                  <span class="meta-val">legal@100yards.com</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="cms-copyright-footer">
              <div class="cms-copyright-footer-brand">
                &copy; 2026 <strong>100 Yards</strong>. All Rights Reserved.
              </div>
              <button type="button" class="cms-copyright-ok-btn" onclick="CMSNav.closeCopyrightModal()">
                ✓ Close Notice
              </button>
            </div>
          </div>
        </div>
      `;
    },

    openCopyrightModal: function() {
      let modal = document.getElementById('cms-copyright-backdrop');
      if (!modal) {
        document.body.insertAdjacentHTML('beforeend', this.renderCopyrightModalHtml());
        modal = document.getElementById('cms-copyright-backdrop');
      }
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    },

    closeCopyrightModal: function() {
      const modal = document.getElementById('cms-copyright-backdrop');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    },

    filterCommandPalette: function(query) {
      const q = (query || '').toLowerCase().trim();
      const list = document.getElementById('cms-cmd-list');
      if (!list) return;
      const items = list.querySelectorAll('.cms-cmd-item');
      let firstVisible = null;

      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          item.style.display = 'flex';
          item.classList.remove('selected');
          if (!firstVisible) firstVisible = item;
        } else {
          item.style.display = 'none';
        }
      });

      if (firstVisible) {
        firstVisible.classList.add('selected');
      }
    },

    init: function() {
      // Global shortcut: Ctrl+K / Cmd+K
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          const backdrop = document.getElementById('cms-cmd-backdrop');
          if (backdrop && backdrop.style.display === 'flex') {
            this.closeCommandPalette();
          } else {
            this.openCommandPalette();
          }
        } else if (e.key === 'Escape') {
          this.closeCommandPalette();
          this.closeCopyrightModal();
          const drawer = document.getElementById('cms-sync-drawer');
          if (drawer) drawer.style.display = 'none';
          syncDrawerOpen = false;
          this.closeUserDropdown();
        }
      });

      // Close sync drawer or user dropdown when clicking outside
      document.addEventListener('pointerdown', (e) => {
        const drawer = document.getElementById('cms-sync-drawer');
        const pill = document.getElementById('cms-nav-sync-pill');
        if (drawer && syncDrawerOpen && !drawer.contains(e.target) && !pill.contains(e.target)) {
          drawer.style.display = 'none';
          syncDrawerOpen = false;
        }

        const userDropdown = document.getElementById('cms-user-dropdown');
        const userChip = document.getElementById('cms-nav-user-chip');
        if (userDropdown && userDropdownOpen && !userDropdown.contains(e.target) && !userChip?.contains(e.target)) {
          userDropdown.style.display = 'none';
          userDropdownOpen = false;
        }
      });

      // Auto-mount into mount element if present
      const autoMount = () => {
        const mount = document.getElementById('cms-suite-header-mount');
        if (mount && !document.getElementById('cms-universal-topbar')) {
          mount.innerHTML = this.renderHeaderHtml();
        }
        if (window.CMSStorage) {
          window.CMSStorage.applyPitchModeToPage();
          window.CMSStorage.getOfflineQueueCount().then(count => {
            this.updateSyncPill(navigator.onLine ? (count > 0 ? 'syncing' : 'online') : 'offline', count);
          });
        }
      };

      // Listen to storage sync events
      if (window.CMSStorage && typeof window.CMSStorage.onSyncStatusChange === 'function') {
        window.CMSStorage.onSyncStatusChange((status, count) => {
          this.updateSyncPill(status, count);
        });
      }

      // Listen to auth changes to update navigation header
      if (window.CMSAuth && typeof window.CMSAuth.onAuthChange === 'function') {
        window.CMSAuth.onAuthChange(() => this.updateAuthUi());
      }

      // Check current tool access immediately on boot
      if (window.CMSAuth && typeof window.CMSAuth.enforceCurrentToolAccess === 'function') {
        window.CMSAuth.enforceCurrentToolAccess();
      } else if (window.CMSAuth && typeof window.CMSAuth.canAccessTool === 'function') {
        if (!window.CMSAuth.canAccessTool(this.currentToolId)) {
          window.CMSAuth.showToolLockModal(this.currentToolId);
        }
      }

      // Universal click delegation for copyright notice triggers across all pages
      document.addEventListener('click', (e) => {
        if (e.target && e.target.closest && e.target.closest('.app-copyright, .copy-brand, [data-open-copyright]')) {
          e.preventDefault();
          this.openCopyrightModal();
        }
      });

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoMount);
      } else {
        autoMount();
      }
    },

    mountHeader: function(targetId) {
      const el = typeof targetId === 'string' ? document.getElementById(targetId) : targetId;
      if (el) {
        el.innerHTML = this.renderHeaderHtml();
      }
    }
  };

  // Universal Cross-Platform Studio Link Interceptor (Stops bypasses on <a target="_blank"> or direct href)
  document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    for (let i = 0; i < TOOLS.length; i++) {
      const tool = TOOLS[i];
      if (href.includes(tool.url)) {
        if (window.CMSAuth && typeof window.CMSAuth.canAccessTool === 'function' && !window.CMSAuth.canAccessTool(tool.id)) {
          e.preventDefault();
          e.stopPropagation();
          window.CMSAuth.showToolLockModal(tool.id);
          if (window.CMSBus) {
            const req = window.CMSAuth.getRequiredTierForTool(tool.id);
            window.CMSBus.notify(`🔒 ${tool.name} requires ${req.name} subscription plan.`);
          }
          return false;
        }
      }
    }
  }, true);

  window.handleCMSNavToolClick = function(toolId, url, event) {
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('.html');
    if (isIndex && ['dashboard', 'tournaments', 'matches', 'teams', 'players', 'formation'].includes(toolId)) {
      if (event) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
      }
      const tabName = toolId === 'dashboard' ? 'teams' : toolId;
      if (typeof window.showAdminTab === 'function') {
        window.showAdminTab(tabName);
        try {
          const newUrl = toolId === 'dashboard' ? 'index.html' : `index.html?tab=${toolId}`;
          window.history.pushState(null, '', newUrl);
        } catch (e) {}
        document.querySelectorAll('.cms-nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('data-tool-id') === toolId) link.classList.add('active');
        });
        const pill = document.querySelector('.cms-nav-active-tool-pill span:last-child');
        if (pill) {
          const toolObj = TOOLS.find(x => x.id === toolId);
          if (toolObj) pill.textContent = toolObj.name;
        }
        return false;
      }
    }
    return true;
  };

  window.toggleNavDropdown = function(id, e) {
    if (e) {
      if (e.stopPropagation) e.stopPropagation();
    }
    const el = document.getElementById(id);
    if (!el) return;
    const wasOpen = el.classList.contains('open');
    window.closeAllNavDropdowns();
    if (!wasOpen) el.classList.add('open');
  };

  window.closeAllNavDropdowns = function() {
    document.querySelectorAll('.nav-dropdown.open').forEach(el => el.classList.remove('open'));
  };

  window.doUniversalLogout = async function() {
    sessionStorage.removeItem('fhq_session_active');
    localStorage.removeItem('fhq_session_active');
    sessionStorage.removeItem('cms_user_session');
    localStorage.removeItem('cms_user_session');
    sessionStorage.removeItem('cms_signup_intent_tier');
    localStorage.removeItem('cms_auth_cached_user');
    localStorage.removeItem('cms_auth_cached_profile');
    localStorage.removeItem('cms_auth_tier_override');
    localStorage.removeItem('fhq_auth_type');

    if (window.CMSAuth && typeof window.CMSAuth.signOut === 'function') {
      try { await window.CMSAuth.signOut(); } catch (e) {}
    } else if (typeof doLogout === 'function') {
      try { await doLogout(); } catch (e) {}
    } else {
      window.location.href = 'index.html';
    }
  };

  document.addEventListener('pointerdown', function(e) {
    if (!e.target.closest('.nav-dropdown')) {
      window.closeAllNavDropdowns();
    }
  });

  window.openCopyrightModal = function() {
    CMSNav.openCopyrightModal();
  };
  window.closeCopyrightModal = function() {
    CMSNav.closeCopyrightModal();
  };

  window.CMSNav = CMSNav;
  CMSNav.init();

})(window, document);
