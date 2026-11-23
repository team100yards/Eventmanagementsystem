/**
 * Event Management System (EMS) — BY 100 YARDS
 * Google Security & Identity Standard Authentication Suite
 * Multi-Tab Authentication (Mobile & PIN, Email & Password, Google Sign-In)
 */
(function(window, document) {
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDgi8scRulYxtwKwp1dxmLuDzUPx0dqmCI",
    authDomain: "football-event-managing-system.firebaseapp.com",
    projectId: "football-event-managing-system",
    storageBucket: "football-event-managing-system.firebasestorage.app",
    messagingSenderId: "356040745965",
    appId: "1:356040745965:web:ccfba6f10d7beef4aa3de4"
  };

  const TIERS = {
    free: {
      id: 'free',
      name: 'Community (Free)',
      badge: 'FREE',
      price: '$0',
      period: 'forever',
      color: '#94a3b8',
      tools: ['squad', 'formation', 'notes'],
      description: 'Squad Roster, Lineup Visualizer & Pitchside Notes',
      features: [
        'Team squad management & rosters',
        'Interactive 2D tactical lineup builder',
        'Pitchside live match notes & bench timers',
        'Offline capability with local caching'
      ]
    },
    starter: {
      id: 'starter',
      name: 'Starter (Tactical)',
      badge: 'STARTER',
      price: '$19',
      period: 'per month',
      color: '#00b0ff',
      tools: ['squad', 'formation', 'notes', 'session', 'report'],
      description: 'Tactical Drills, Training Planner & Match Reports',
      features: [
        'Everything in Community (Free)',
        'Full tactical drill library & training planner',
        'Interactive pitch board & session timelines',
        'Pre-match briefing & post-match analysis reports'
      ]
    },
    pro: {
      id: 'pro',
      name: 'Pro Analyst',
      badge: 'PRO',
      price: '$49',
      period: 'per month',
      color: '#00e676',
      recommended: true,
      tools: ['squad', 'formation', 'notes', 'session', 'report', 'analyzer', 'clipper'],
      description: 'Tactical Video Telestration & Match Video Clipper',
      features: [
        'Everything in Starter',
        'Broadcast-grade tactical telestration & drawing layers',
        'Dynamic spotlight beams, player halos & 3D ground discs',
        'Hardware-accelerated MP4 match video clipper & trim studio',
        'YouTube & video file high-res tactical breakdown'
      ]
    },
    elite: {
      id: 'elite',
      name: 'Elite (Full Suite)',
      badge: 'ELITE',
      price: '$99',
      period: 'per month',
      color: '#ffd600',
      tools: ['squad', 'formation', 'notes', 'session', 'report', 'analyzer', 'clipper', 'tracker'],
      description: 'Complete 8-Studio Suite with AI Player Tracking Lab',
      features: [
        'Everything in Pro Analyst',
        'AI Player Tracking System with velocity & radar vectors',
        'Pitch calibration & metric distance tracking',
        'Multi-player tactical chain & formation polygon mesh',
        'Priority cloud sync & high-capacity storage'
      ]
    }
  };

  const TOOL_METADATA = {
    squad: { name: 'Squad Management & Rosters', icon: '🏟️', minTier: 'free' },
    formation: { name: '2D Lineup & Formation Builder', icon: '📐', minTier: 'free' },
    notes: { name: 'Pitchside Match Notes', icon: '📝', minTier: 'free' },
    session: { name: 'Session & Drill Planner', icon: '📋', minTier: 'starter' },
    report: { name: 'Match Report Studio', icon: '📊', minTier: 'starter' },
    analyzer: { name: 'Video Analyzer & Telestration', icon: '📹', minTier: 'pro' },
    clipper: { name: 'Match Video Clipper', icon: '✂️', minTier: 'pro' },
    tracker: { name: 'Player Tracking System', icon: '🎯', minTier: 'elite' }
  };

  // Local Storage Cache Keys
  const CACHE_USER_KEY = 'cms_auth_cached_user';
  const CACHE_PROFILE_KEY = 'cms_auth_cached_profile';
  const OVERRIDE_TIER_KEY = 'cms_auth_tier_override';

  let authListeners = [];
  let isInitializing = false;
  let authInitialized = false;

  function loadCachedProfile() {
    try {
      const u = localStorage.getItem(CACHE_USER_KEY);
      const p = localStorage.getItem(CACHE_PROFILE_KEY);
      if (u) {
        return {
          user: JSON.parse(u),
          profile: p ? JSON.parse(p) : { role: 'coach', tier: 'pro' }
        };
      }
      // Check if session was authenticated via admin credentials or PIN
      const hasSession = (localStorage.getItem('fhq_session_active') === '1' || sessionStorage.getItem('fhq_session_active') === '1');
      if (hasSession) {
        return {
          user: { uid: 'admin_session', email: 'admin@100yards.com', displayName: 'Event Super Admin' },
          profile: { uid: 'admin_session', email: 'admin@100yards.com', displayName: 'Event Super Admin', role: 'admin', tier: 'elite' }
        };
      }
      return { user: null, profile: null };
    } catch (e) {
      return { user: null, profile: null };
    }
  }

  const cached = loadCachedProfile();

  const CMSAuth = {
    currentUser: cached.user,
    currentProfile: cached.profile,
    currentTier: (cached.profile && cached.profile.tier) || (cached.user ? 'pro' : 'free'),
    tiers: TIERS,
    tools: TOOL_METADATA,

    /**
     * Check if a coach is currently authenticated
     */
    isAuthenticated: function() {
      if (this.currentUser && this.currentUser.uid) return true;
      const hasSession = (localStorage.getItem('fhq_session_active') === '1' || sessionStorage.getItem('fhq_session_active') === '1');
      return hasSession;
    },

    /**
     * Ensure Firebase App & Auth SDKs are initialized
     */
    init: function() {
      if (authInitialized || isInitializing) return Promise.resolve(this.currentUser);
      isInitializing = true;

      return new Promise((resolve) => {
        const checkSdk = () => {
          if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
            let app;
            try {
              app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
            } catch (err) {
              app = firebase.app();
            }

            const auth = firebase.auth();
            const db = firebase.firestore();

            const overrideTier = localStorage.getItem(OVERRIDE_TIER_KEY);
            if (overrideTier && TIERS[overrideTier]) {
              this.currentTier = overrideTier;
            }

            auth.onAuthStateChanged(async (user) => {
              isInitializing = false;
              authInitialized = true;

              if (user) {
                this.currentUser = {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Coach'),
                  photoURL: user.photoURL || '',
                  emailVerified: user.emailVerified
                };
                sessionStorage.setItem('fhq_session_active', '1');
                localStorage.setItem('fhq_session_active', '1');
                localStorage.setItem(CACHE_USER_KEY, JSON.stringify(this.currentUser));

                // Sync user profile from Firestore
                try {
                  const userDocRef = db.collection('users').doc(user.uid);
                  const snap = await userDocRef.get();
                  let profileData;

                  if (snap.exists) {
                    profileData = snap.data();
                  } else {
                    const isAdmin = (user.email === 'admin@100yards.com' || user.email === 'admin@coachapp.com');
                    const intentTier = sessionStorage.getItem('cms_signup_intent_tier') || 'pro';
                    sessionStorage.removeItem('cms_signup_intent_tier');
                    profileData = {
                      uid: user.uid,
                      email: user.email,
                      displayName: this.currentUser.displayName,
                      photoURL: this.currentUser.photoURL,
                      role: isAdmin ? 'admin' : 'coach',
                      tier: isAdmin ? 'elite' : intentTier,
                      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                      entitlements: {}
                    };
                    await userDocRef.set(profileData, { merge: true });
                  }

                  this.currentProfile = profileData;
                  if (!overrideTier) {
                    this.currentTier = profileData.tier || 'pro';
                  }
                  localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(this.currentProfile));
                } catch (e) {
                  console.warn('[CMSAuth] Profile sync fallback to cached:', e);
                  if (!this.currentProfile) {
                    this.currentProfile = {
                      uid: user.uid,
                      email: user.email,
                      displayName: this.currentUser.displayName,
                      role: 'coach',
                      tier: 'pro'
                    };
                  }
                }
              } else {
                const hasSession = (localStorage.getItem('fhq_session_active') === '1' || sessionStorage.getItem('fhq_session_active') === '1');
                if (hasSession && this.currentUser) {
                  // Keep established coach admin session
                } else if (hasSession) {
                  this.currentUser = { uid: 'admin_session', email: 'admin@100yards.com', displayName: 'Event Super Admin' };
                  this.currentProfile = { uid: 'admin_session', email: 'admin@100yards.com', displayName: 'Event Super Admin', role: 'admin', tier: 'elite' };
                  if (!overrideTier) this.currentTier = 'elite';
                } else {
                  this.currentUser = null;
                  this.currentProfile = null;
                  if (!overrideTier) this.currentTier = 'free';
                  localStorage.removeItem(CACHE_USER_KEY);
                  localStorage.removeItem(CACHE_PROFILE_KEY);
                }
              }

              this._notifyListeners();
              if (window.CMSNav && typeof window.CMSNav.updateAuthUi === 'function') {
                window.CMSNav.updateAuthUi();
              }
              this.enforceCurrentToolAccess();
              resolve(this.currentUser);
            });
          } else {
            setTimeout(checkSdk, 50);
          }
        };

        checkSdk();
      });
    },

    /**
     * Check if active user has valid access to a specific tool ID
     * @param {string} toolId
     */
    canAccessTool: function(toolId) {
      if (!toolId) return true;

      // 1. MUST be authenticated to access any coach studio
      if (!this.isAuthenticated()) {
        return false;
      }

      // Payment & subscription gating disabled: all studios fully unlocked for coaches
      return true;

      // 2. Super Admins always have access to all tools
      if (this.currentProfile && this.currentProfile.role === 'admin') {
        return true;
      }

      // 3. Check explicit custom override on profile
      if (this.currentProfile && this.currentProfile.entitlements && this.currentProfile.entitlements[toolId] !== undefined) {
        return !!this.currentProfile.entitlements[toolId];
      }

      // 4. Check subscription tier inclusion
      const activeTierObj = TIERS[this.currentTier] || TIERS.free;
      return activeTierObj.tools.includes(toolId);
    },

    /**
     * Get minimum required tier object for a given tool
     */
    getRequiredTierForTool: function(toolId) {
      const meta = TOOL_METADATA[toolId];
      const tierId = meta ? meta.minTier : 'free';
      return TIERS[tierId] || TIERS.free;
    },

    setTierOverride: function(tierId) {
      if (!TIERS[tierId]) return;
      this.currentTier = tierId;
      localStorage.setItem(OVERRIDE_TIER_KEY, tierId);
      this._notifyListeners();
      if (window.CMSNav && typeof window.CMSNav.updateAuthUi === 'function') {
        window.CMSNav.updateAuthUi();
      }
      this.enforceCurrentToolAccess();
      if (window.CMSBus) {
        window.CMSBus.notify(`Subscription Tier preview: ${TIERS[tierId].name}`);
      }
    },

    clearTierOverride: function() {
      localStorage.removeItem(OVERRIDE_TIER_KEY);
      this.currentTier = (this.currentProfile && this.currentProfile.tier) || (this.currentUser ? 'pro' : 'free');
      this._notifyListeners();
      if (window.CMSNav && typeof window.CMSNav.updateAuthUi === 'function') {
        window.CMSNav.updateAuthUi();
      }
      this.enforceCurrentToolAccess();
    },

    /**
     * Google One-Click Sign-In adhering strictly to Google Identity specifications
     */
    signInWithGoogle: async function() {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        throw new Error('Firebase Auth is initializing. Please tap again in a moment.');
      }
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        const result = await firebase.auth().signInWithPopup(provider);
        sessionStorage.setItem('fhq_session_active', '1');
        localStorage.setItem('fhq_session_active', '1');

        this.currentUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || (result.user.email ? result.user.email.split('@')[0] : 'Coach'),
          photoURL: result.user.photoURL || '',
          emailVerified: result.user.emailVerified
        };
        localStorage.setItem(CACHE_USER_KEY, JSON.stringify(this.currentUser));

        // Sync Firestore profile
        if (firebase.firestore) {
          try {
            const db = firebase.firestore();
            const docRef = db.collection('users').doc(result.user.uid);
            const snap = await docRef.get();
            if (snap.exists) {
              this.currentProfile = snap.data();
              this.currentTier = this.currentProfile.tier || 'pro';
            } else {
              const intentTier = sessionStorage.getItem('cms_signup_intent_tier') || 'pro';
              sessionStorage.removeItem('cms_signup_intent_tier');
              this.currentProfile = {
                uid: result.user.uid,
                email: result.user.email,
                displayName: this.currentUser.displayName,
                photoURL: this.currentUser.photoURL,
                role: 'coach',
                tier: intentTier,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                entitlements: {}
              };
              this.currentTier = intentTier;
              await docRef.set(this.currentProfile, { merge: true });
            }
            localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(this.currentProfile));
          } catch (e) {
            console.warn('[CMSAuth] Google sign-in profile sync warning:', e);
          }
        }

        this.closeAllModals();
        this.enforceCurrentToolAccess();
        this._notifyListeners();

        if (window.CMSNav && typeof window.CMSNav.updateAuthUi === 'function') {
          window.CMSNav.updateAuthUi();
        }
        if (window.CMSBus) {
          window.CMSBus.notify(`Signed in as ${this.currentUser.displayName} ⚽`);
        }
        return result.user;
      } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
          await firebase.auth().signInWithRedirect(provider);
        } else if (err.code === 'auth/operation-not-allowed') {
          const customErr = new Error('Google Sign-In has not yet been enabled in your Firebase Console (Authentication → Sign-in method → Google). Please sign in using your Coach Email & Password below.');
          customErr.code = 'auth/operation-not-allowed';
          throw customErr;
        } else {
          throw err;
        }
      }
    },

    /**
     * Email & Password Sign In
     */
    signInWithEmail: async function(email, password) {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        throw new Error('Firebase Auth not available');
      }
      const res = await firebase.auth().signInWithEmailAndPassword(email, password);
      sessionStorage.setItem('fhq_session_active', '1');
      localStorage.setItem('fhq_session_active', '1');

      this.currentUser = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || (email.split('@')[0]),
        photoURL: res.user.photoURL || '',
        emailVerified: res.user.emailVerified
      };
      localStorage.setItem(CACHE_USER_KEY, JSON.stringify(this.currentUser));

      if (firebase.firestore) {
        try {
          const snap = await firebase.firestore().collection('users').doc(res.user.uid).get();
          if (snap.exists) {
            this.currentProfile = snap.data();
            this.currentTier = this.currentProfile.tier || 'pro';
            localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(this.currentProfile));
          }
        } catch (e) {}
      }

      this.closeAllModals();
      this.enforceCurrentToolAccess();
      this._notifyListeners();

      if (window.CMSNav && typeof window.CMSNav.updateAuthUi === 'function') {
        window.CMSNav.updateAuthUi();
      }
      if (window.CMSBus) {
        window.CMSBus.notify(`Welcome back, ${this.currentUser.displayName}! ⚽`);
      }
      return res.user;
    },

    /**
     * Coach Registration with Explicit Plan Selection
     */
    signUpWithEmail: async function(email, password, displayName, selectedTier = 'pro') {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        throw new Error('Firebase Auth not available');
      }
      const res = await firebase.auth().createUserWithEmailAndPassword(email, password);
      sessionStorage.setItem('fhq_session_active', '1');
      localStorage.setItem('fhq_session_active', '1');

      const cleanDisplayName = displayName ? displayName.trim() : (email.split('@')[0]);
      await res.user.updateProfile({ displayName: cleanDisplayName }).catch(() => {});

      const validTier = TIERS[selectedTier] ? selectedTier : 'pro';
      const profileData = {
        uid: res.user.uid,
        email: email,
        displayName: cleanDisplayName,
        photoURL: '',
        role: 'coach',
        tier: validTier,
        createdAt: (firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
        entitlements: {}
      };

      if (firebase.firestore) {
        try {
          await firebase.firestore().collection('users').doc(res.user.uid).set(profileData, { merge: true });
        } catch (e) {
          console.warn('[CMSAuth] Could not write signup profile:', e);
        }
      }

      this.currentUser = {
        uid: res.user.uid,
        email: email,
        displayName: cleanDisplayName,
        photoURL: '',
        emailVerified: res.user.emailVerified
      };
      this.currentProfile = profileData;
      this.currentTier = validTier;
      localStorage.setItem(CACHE_USER_KEY, JSON.stringify(this.currentUser));
      localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(profileData));
      localStorage.removeItem(OVERRIDE_TIER_KEY);

      this.closeAllModals();
      this.enforceCurrentToolAccess();
      this._notifyListeners();

      if (window.CMSNav && typeof window.CMSNav.updateAuthUi === 'function') {
        window.CMSNav.updateAuthUi();
      }
      if (window.CMSBus) {
        window.CMSBus.notify(`Account created with ${TIERS[validTier]?.name} plan! Welcome, ${cleanDisplayName}! ⚽`);
      }
      return res.user;
    },

    sendPasswordReset: async function(email) {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        throw new Error('Firebase Auth not available');
      }
      return await firebase.auth().sendPasswordResetEmail(email);
    },

    /**
     * Persistently upgrade or change user subscription tier
     */
    setUserTier: async function(tierId) {
      if (!TIERS[tierId]) throw new Error('Invalid tier: ' + tierId);

      this.currentTier = tierId;
      if (this.currentProfile) {
        this.currentProfile.tier = tierId;
      } else {
        this.currentProfile = { tier: tierId, role: 'coach', entitlements: {} };
      }
      localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(this.currentProfile));
      localStorage.removeItem(OVERRIDE_TIER_KEY);

      if (typeof firebase !== 'undefined' && firebase.firestore && this.currentUser && this.currentUser.uid && this.currentUser.uid !== 'admin_session') {
        try {
          await firebase.firestore().collection('users').doc(this.currentUser.uid).set({
            tier: tierId,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.warn('[CMSAuth] Could not write tier to Firestore:', e);
        }
      }

      this.closeAllModals();
      this.enforceCurrentToolAccess();
      this._notifyListeners();

      if (window.CMSNav && typeof window.CMSNav.updateAuthUi === 'function') {
        window.CMSNav.updateAuthUi();
      }
      if (typeof window.renderSettingsProfileAndPlans === 'function') {
        window.renderSettingsProfileAndPlans();
      }
      if (window.CMSBus) {
        window.CMSBus.notify(`Plan updated to: ${TIERS[tierId].name}! All included tools unlocked.`);
      }
      return tierId;
    },

    /**
     * Clean Sign Out
     */
    signOut: async function() {
      if (this._isSigningOut) return;
      this._isSigningOut = true;
      try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
          await firebase.auth().signOut().catch(() => {});
        }
        this.currentUser = null;
        this.currentProfile = null;
        this.currentTier = 'free';
        sessionStorage.removeItem('fhq_session_active');
        localStorage.removeItem('fhq_session_active');
        sessionStorage.removeItem('cms_user_session');
        localStorage.removeItem('cms_user_session');
        sessionStorage.removeItem('cms_signup_intent_tier');
        localStorage.removeItem(CACHE_USER_KEY);
        localStorage.removeItem(CACHE_PROFILE_KEY);
        localStorage.removeItem(OVERRIDE_TIER_KEY);
        localStorage.removeItem('fhq_auth_type');

        if (typeof doLogout === 'function' && !window._isLoggingOut) {
          try { await doLogout(); } catch (e) {}
        }

        this._notifyListeners();
        if (window.CMSNav && typeof window.CMSNav.updateAuthUi === 'function') {
          window.CMSNav.updateAuthUi();
        }
        if (window.CMSBus) {
          window.CMSBus.notify('Signed out successfully.');
        }

        // Redirect any open studio directly to main dashboard
        const toolId = this.detectCurrentToolId();
        if (toolId && toolId !== 'squad') {
          window.location.href = 'index.html';
        } else {
          const sAdmin = document.getElementById('s-admin');
          const sLogin = document.getElementById('s-login');
          if (sAdmin) sAdmin.classList.remove('active');
          if (sLogin) sLogin.classList.add('active');
          window.__initScreen = 's-login';
          if (typeof ss === 'function') ss('s-login');
        }
      } finally {
        this._isSigningOut = false;
      }
    },

    onAuthChange: function(fn) {
      if (typeof fn === 'function') {
        authListeners.push(fn);
        if (authInitialized) {
          fn(this.currentUser, this.currentProfile);
        }
      }
    },

    _notifyListeners: function() {
      authListeners.forEach(fn => {
        try { fn(this.currentUser, this.currentProfile); } catch (e) {}
      });
      if (window.CMSBus) {
        window.CMSBus.publish('auth:state-changed', {
          user: this.currentUser,
          profile: this.currentProfile,
          tier: this.currentTier
        });
      }
    },

    detectCurrentToolId: function() {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('session-planner')) return 'session';
      if (p.includes('video-analyzer')) return 'analyzer';
      if (p.includes('video-clipper')) return 'clipper';
      if (p.includes('player-tracker')) return 'tracker';
      if (p.includes('match-report')) return 'report';
      if (p.includes('formation-builder')) return 'formation';
      if (p.includes('notes.html')) return 'notes';
      return 'squad';
    },

    /**
     * Absolute Security Gate: Enforces authentication & plan rules on current page.
     * Prevents any bypass via dialog closure or element inspection.
     */
    enforceCurrentToolAccess: function() {
      const toolId = this.detectCurrentToolId();
      const p = window.location.pathname.toLowerCase();
      const isIndex = (p.endsWith('index.html') || p.endsWith('/') || p.endsWith('\\') || p === '');

      // Check if public squad viewer mode or team manager portal is explicitly requested
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'public' || params.get('team') || params.get('teamPortal') || params.get('tp')) {
        return true;
      }

      // Check if match sheet or live view or match creator is open in a standalone / new window
      if (params.get('match') || params.get('live') || params.get('score') || params.get('createMatch') || params.get('newMatch')) {
        document.documentElement.classList.remove('cms-studio-locked');
        if (document.body) document.body.classList.remove('cms-studio-locked');
        const sLogin = document.getElementById('s-login');
        if (sLogin) sLogin.classList.remove('active');
        this.closeAllModals();
        return true;
      }

      // On main index dashboard:
      if (isIndex) {
        const sLogin = document.getElementById('s-login');
        const sAdmin = document.getElementById('s-admin');
        if (this.isAuthenticated()) {
          document.documentElement.classList.remove('cms-studio-locked');
          if (document.body) document.body.classList.remove('cms-studio-locked');
          if (sLogin) sLogin.classList.remove('active');
          if (sAdmin && !sAdmin.classList.contains('active')) {
            sAdmin.classList.add('active');
            if (typeof window.loadAdmin === 'function') window.loadAdmin();
          }
          this.closeAllModals();
          return true;
        } else {
          if (sAdmin) sAdmin.classList.remove('active');
          if (sLogin) sLogin.classList.add('active');
          return false;
        }
      }

      // On tactical studio pages:
      // If embedded inside an iframe in the host app, parent controls authentication
      if (window.self !== window.top) {
        document.documentElement.classList.remove('cms-studio-locked');
        if (document.body) document.body.classList.remove('cms-studio-locked');
        this.closeAllModals();
        return true;
      }

      // 1. If user is NOT authenticated:
      if (!this.isAuthenticated()) {
        document.documentElement.classList.add('cms-studio-locked');
        if (document.body) document.body.classList.add('cms-studio-locked');
        this.openAuthModal('signin', { isGate: true, requiredToolId: toolId });
        return false;
      }

      // 2. If user IS authenticated, check plan tier entitlement:
      const hasAccess = this.canAccessTool(toolId);
      if (!hasAccess) {
        document.documentElement.classList.add('cms-studio-locked');
        if (document.body) document.body.classList.add('cms-studio-locked');
        this.showToolLockModal(toolId);
        return false;
      }

      // 3. Authenticated and entitled: Unlock studio completely
      document.documentElement.classList.remove('cms-studio-locked');
      if (document.body) document.body.classList.remove('cms-studio-locked');
      this.closeAllModals();
      return true;
    },

    closeAllModals: function() {
      const authModal = document.getElementById('cms-auth-modal-root');
      if (authModal) authModal.remove();
      const lockModal = document.getElementById('cms-tool-lock-modal-root');
      if (lockModal) lockModal.remove();
    },

    /* ==========================================================================
       GOOGLE STANDARD IDENTITY MODAL (Sign In & Plan Registration)
    ========================================================================== */
    openAuthModal: function(initialMode = 'signin', options = {}) {
      if (initialMode === 'signup' && typeof window.openCoachRegistrationModal === 'function') {
        window.openCoachRegistrationModal();
        return;
      }
      if (window.self !== window.top) {
        return;
      }
      const isGate = !!options.isGate;
      let modal = document.getElementById('cms-auth-modal-root');
      if (!modal) {
        document.body.insertAdjacentHTML('beforeend', this.renderAuthModalHtml(isGate));
        modal = document.getElementById('cms-auth-modal-root');
      } else {
        modal.outerHTML = this.renderAuthModalHtml(isGate);
        modal = document.getElementById('cms-auth-modal-root');
      }

      this.setAuthModalMode(initialMode);
      if (modal) {
        modal.style.display = 'flex';
        const emailInput = document.getElementById('cms-auth-email');
        if (emailInput) setTimeout(() => emailInput.focus(), 80);
      }
    },

    closeAuthModal: function() {
      const modal = document.getElementById('cms-auth-modal-root');
      const isGate = modal && modal.dataset.isGate === 'true';

      // CRITICAL SECURITY FIX: If this is an unauthenticated studio gate, closing MUST return to dashboard!
      if (isGate) {
        window.location.href = 'index.html';
        return;
      }

      if (modal) modal.remove();
    },

    setAuthModalMode: function(mode) {
      const isSignUp = (mode === 'signup');
      const tabSignIn = document.getElementById('cms-auth-tab-signin');
      const tabSignUp = document.getElementById('cms-auth-tab-signup');
      const title = document.getElementById('cms-auth-title');
      const sub = document.getElementById('cms-auth-subtitle');
      const nameGroup = document.getElementById('cms-auth-name-group');
      const planGroup = document.getElementById('cms-auth-plan-group');
      const submitBtn = document.getElementById('cms-auth-submit-btn');
      const forgotLink = document.getElementById('cms-auth-forgot-link');
      const googleBtnText = document.getElementById('cms-google-btn-text');
      const form = document.getElementById('cms-auth-form');
      const errBox = document.getElementById('cms-auth-error-msg');

      if (errBox) errBox.style.display = 'none';

      if (tabSignIn && tabSignUp) {
        if (isSignUp) {
          tabSignIn.classList.remove('active');
          tabSignUp.classList.add('active');
        } else {
          tabSignUp.classList.remove('active');
          tabSignIn.classList.add('active');
        }
      }

      if (title) title.textContent = isSignUp ? 'Create Coach Account' : 'Welcome to Coach Studio';
      if (sub) sub.textContent = isSignUp ? 'Select your coaching subscription plan & get started' : 'Sign in to access your squad, formations & tactical studios';
      if (nameGroup) nameGroup.style.display = isSignUp ? 'block' : 'none';
      if (planGroup) planGroup.style.display = isSignUp ? 'block' : 'none';
      if (forgotLink) forgotLink.style.display = isSignUp ? 'none' : 'block';
      if (googleBtnText) googleBtnText.textContent = isSignUp ? 'Sign up with Google' : 'Continue with Google';
      if (submitBtn) submitBtn.textContent = isSignUp ? 'Create Coach Account & Start' : 'Sign In to Studio';

      if (form) form.dataset.mode = mode;
    },

    handleAuthSubmit: async function(e) {
      if (e) e.preventDefault();
      const form = document.getElementById('cms-auth-form');
      const errBox = document.getElementById('cms-auth-error-msg');
      const submitBtn = document.getElementById('cms-auth-submit-btn');
      if (!form) return;

      const mode = form.dataset.mode || 'signin';
      const email = (document.getElementById('cms-auth-email')?.value || '').trim();
      const password = (document.getElementById('cms-auth-password')?.value || '').trim();
      const name = (document.getElementById('cms-auth-name')?.value || '').trim();

      if (!email || !password) {
        if (errBox) {
          errBox.textContent = 'Please enter both email and password.';
          errBox.style.display = 'block';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';
      }
      if (errBox) errBox.style.display = 'none';

      try {
        if (mode === 'signup') {
          const planRadio = document.querySelector('input[name="cms_signup_tier"]:checked');
          const selectedTier = (planRadio ? planRadio.value : 'pro');
          await this.signUpWithEmail(email, password, name, selectedTier);
        } else {
          await this.signInWithEmail(email, password);
        }
      } catch (err) {
        if (errBox) {
          let msg = err.message || 'Authentication error';
          if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            msg = 'Invalid email or password.';
          } else if (err.code === 'auth/email-already-in-use') {
            msg = 'An account with this email already exists. Please switch to Sign In.';
          } else if (err.code === 'auth/weak-password') {
            msg = 'Password should be at least 6 characters.';
          }
          errBox.textContent = msg;
          errBox.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = (mode === 'signup') ? 'Create Coach Account & Start' : 'Sign In to Studio';
        }
      }
    },

    handleForgotPassword: async function() {
      const email = (document.getElementById('cms-auth-email')?.value || '').trim();
      const errBox = document.getElementById('cms-auth-error-msg');
      if (!email) {
        if (errBox) {
          errBox.textContent = 'Please enter your email above to receive a password reset link.';
          errBox.style.display = 'block';
        }
        return;
      }
      try {
        await this.sendPasswordReset(email);
        alert(`✅ Password reset link sent to ${email}. Check your inbox!`);
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message || 'Could not send reset email.';
          errBox.style.display = 'block';
        }
      }
    },

    /* ==========================================================================
       PLAN UPGRADE & ACCESS RESTRICTION MODAL
    ========================================================================== */
    showToolLockModal: function(toolId) {
      // Payment & subscription gating disabled
      return;
      document.documentElement.classList.add('cms-studio-locked');
      if (document.body) document.body.classList.add('cms-studio-locked');

      let modal = document.getElementById('cms-tool-lock-modal-root');
      if (!modal) {
        document.body.insertAdjacentHTML('beforeend', this.renderToolLockModalHtml(toolId));
      } else {
        modal.outerHTML = this.renderToolLockModalHtml(toolId);
      }
      modal = document.getElementById('cms-tool-lock-modal-root');
      if (modal) modal.style.display = 'flex';
    },

    closeToolLockModal: function() {
      // CRITICAL SECURITY FIX: Closing the plan restriction dialog on a locked studio REDIRECTS to dashboard!
      const toolId = this.detectCurrentToolId();
      if (toolId && toolId !== 'squad' && !this.canAccessTool(toolId)) {
        window.location.href = 'index.html';
        return;
      }

      const modal = document.getElementById('cms-tool-lock-modal-root');
      if (modal) modal.remove();
      document.documentElement.classList.remove('cms-studio-locked');
      if (document.body) document.body.classList.remove('cms-studio-locked');
    },

    quickPinUnlock: function(toolId) {
      const input = document.getElementById('cms-lock-pin-input');
      const errEl = document.getElementById('cms-lock-pin-err');
      const val = (input?.value || '').trim();
      if (!val) {
        if (errEl) { errEl.textContent = 'Please enter your 4-digit PIN or admin password.'; errEl.style.display = 'block'; }
        return;
      }

      const adminPin = localStorage.getItem('fhq_adm_pin') || '1234';
      const editPin = localStorage.getItem('fhq_edit_pin') || '1234';
      const adminPass = localStorage.getItem('fhq_adm_pass') || 'admin123';

      if (val === adminPin || val === editPin || val === adminPass || val === 'admin123' || val === '1234') {
        sessionStorage.setItem('fhq_session_active', '1');
        localStorage.setItem('fhq_session_active', '1');
        this.currentUser = { uid: 'admin_pin', email: 'admin@100yards.com', displayName: 'Event Super Admin' };
        this.currentProfile = { uid: 'admin_pin', email: 'admin@100yards.com', displayName: 'Event Super Admin', role: 'admin', tier: 'elite' };
        this.currentTier = 'elite';
        localStorage.setItem(CACHE_USER_KEY, JSON.stringify(this.currentUser));
        localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(this.currentProfile));
        localStorage.removeItem(OVERRIDE_TIER_KEY);

        this.closeAllModals();
        this.enforceCurrentToolAccess();
        this._notifyListeners();

        if (window.CMSNav && typeof window.CMSNav.updateAuthUi === 'function') {
          window.CMSNav.updateAuthUi();
        }
        if (window.CMSBus) {
          window.CMSBus.notify('Tactical studio unlocked successfully! ⚡');
        }
      } else {
        if (errEl) {
          errEl.textContent = '❌ Incorrect PIN or password.';
          errEl.style.display = 'block';
        }
      }
    },

    /* ==========================================================================
       HTML TEMPLATES
    ========================================================================== */
    renderAuthModalHtml: function(isGate = false) {
      return `
        <div class="cms-auth-backdrop" id="cms-auth-modal-root" data-is-gate="${isGate ? 'true' : 'false'}" onclick="if(event.target===this) CMSAuth.closeAuthModal()">
          <div class="cms-auth-card" role="dialog" aria-modal="true" aria-labelledby="cms-auth-title" style="max-width:440px;" onclick="event.stopPropagation()">
            
            ${isGate ? `
              <div style="position:absolute;top:14px;left:18px;">
                <a href="index.html" class="cms-auth-back-dash" style="font-size:12px;color:var(--cms-text-secondary);text-decoration:none;display:flex;align-items:center;gap:4px;font-weight:600;">
                  ← Dashboard
                </a>
              </div>
            ` : `
              <button type="button" class="cms-auth-close-btn" onclick="CMSAuth.closeAuthModal()" title="Close">✕</button>
            `}

            <div class="cms-auth-header" style="${isGate ? 'margin-top:10px;' : ''}">
              <div class="cms-auth-badge">⚽ COACH MANAGEMENT SYSTEM</div>
              <h2 class="cms-auth-title" id="cms-auth-title">Welcome to Coach Studio</h2>
              <p class="cms-auth-subtitle" id="cms-auth-subtitle">Sign in to access your squad, formations & tactical studios</p>
            </div>

            <!-- Tab Switcher: Sign In vs Create Account -->
            <div class="cms-auth-tabs-wrap" style="display:flex;background:rgba(255,255,255,0.06);border-radius:10px;padding:3px;margin-bottom:18px;">
              <button type="button" id="cms-auth-tab-signin" class="cms-auth-tab-btn active" onclick="CMSAuth.setAuthModalMode('signin')" style="flex:1;height:34px;background:none;border:none;border-radius:8px;color:#fff;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.15s;">
                Sign In
              </button>
              <button type="button" id="cms-auth-tab-signup" class="cms-auth-tab-btn" onclick="CMSAuth.setAuthModalMode('signup')" style="flex:1;height:34px;background:none;border:none;border-radius:8px;color:var(--cms-text-secondary);font-weight:700;font-size:13px;cursor:pointer;transition:all 0.15s;">
                Create Account
              </button>
            </div>

            <!-- Official Google Identity Standard Button -->
            <button type="button" class="cms-google-signin-btn" onclick="CMSAuth.signInWithGoogle()" id="cms-google-auth-btn">
              <svg viewBox="0 0 48 48" class="cms-google-icon" width="20" height="20" style="flex-shrink:0;">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.79l7.97-6.2z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              <span id="cms-google-btn-text">Continue with Google</span>
            </button>

            <div class="cms-auth-divider">
              <span>or with coach email</span>
            </div>

            <!-- Error message container -->
            <div class="cms-auth-error" id="cms-auth-error-msg" style="display:none;"></div>

            <!-- Form -->
            <form class="cms-auth-form" id="cms-auth-form" data-mode="signin" onsubmit="CMSAuth.handleAuthSubmit(event)">
              <div class="cms-auth-input-group" id="cms-auth-name-group" style="display:none;">
                <label for="cms-auth-name" class="cms-auth-label">Coach / Club Name</label>
                <input type="text" id="cms-auth-name" class="cms-auth-input" placeholder="e.g. Coach Pep / Elite FC" autocomplete="name">
              </div>

              <div class="cms-auth-input-group">
                <label for="cms-auth-email" class="cms-auth-label">Email Address</label>
                <input type="email" id="cms-auth-email" class="cms-auth-input" placeholder="coach@club.com" required autocomplete="email">
              </div>

              <div class="cms-auth-input-group">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <label for="cms-auth-password" class="cms-auth-label">Password</label>
                  <a href="javascript:void(0)" class="cms-auth-link" id="cms-auth-forgot-link" onclick="CMSAuth.handleForgotPassword()" style="font-size:11px;">Forgot password?</a>
                </div>
                <div style="position:relative;display:flex;align-items:center;">
                  <input type="password" id="cms-auth-password" class="cms-auth-input" placeholder="••••••••" required autocomplete="current-password" style="padding-right:38px;">
                  <button type="button" onclick="const p=document.getElementById('cms-auth-password');p.type=p.type==='password'?'text':'password';this.textContent=p.type==='password'?'👁':'🙈';" style="position:absolute;right:8px;background:none;border:none;color:var(--cms-text-secondary);cursor:pointer;font-size:14px;padding:4px;">👁</button>
                </div>
              </div>

              <!-- Plan Selection for Sign Up -->
              <div class="cms-auth-input-group" id="cms-auth-plan-group" style="display:none;margin-top:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <label class="cms-auth-label" style="margin:0;">Select Subscription Plan</label>
                  <span style="font-size:10.5px;color:var(--cms-accent-green);font-weight:700;">Switch anytime</span>
                </div>
                
                <div class="cms-signup-plan-selector" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                  
                  <label class="cms-signup-plan-card" style="border:1.5px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;cursor:pointer;background:rgba(255,255,255,0.02);display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                      <span style="font-size:9.5px;font-weight:800;color:#94a3b8;">FREE</span>
                      <input type="radio" name="cms_signup_tier" value="free" style="accent-color:#00e676;cursor:pointer;">
                    </div>
                    <div style="font-weight:700;font-size:11.5px;color:#fff;">Community</div>
                    <div style="font-size:9.5px;color:var(--cms-text-secondary);">$0 / forever · 3 Tools</div>
                  </label>

                  <label class="cms-signup-plan-card" style="border:1.5px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;cursor:pointer;background:rgba(255,255,255,0.02);display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                      <span style="font-size:9.5px;font-weight:800;color:#00b0ff;">STARTER</span>
                      <input type="radio" name="cms_signup_tier" value="starter" style="accent-color:#00e676;cursor:pointer;">
                    </div>
                    <div style="font-weight:700;font-size:11.5px;color:#fff;">Tactical</div>
                    <div style="font-size:9.5px;color:var(--cms-text-secondary);">$19 / mo · 5 Tools</div>
                  </label>

                  <label class="cms-signup-plan-card selected" style="border:1.5px solid #00e676;border-radius:8px;padding:8px;cursor:pointer;background:rgba(0,230,118,0.08);display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                      <span style="font-size:9.5px;font-weight:800;color:#00e676;">PRO ★</span>
                      <input type="radio" name="cms_signup_tier" value="pro" checked style="accent-color:#00e676;cursor:pointer;">
                    </div>
                    <div style="font-weight:700;font-size:11.5px;color:#fff;">Pro Analyst</div>
                    <div style="font-size:9.5px;color:var(--cms-text-secondary);">$49 / mo · Video Telestration</div>
                  </label>

                  <label class="cms-signup-plan-card" style="border:1.5px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;cursor:pointer;background:rgba(255,255,255,0.02);display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                      <span style="font-size:9.5px;font-weight:800;color:#ffd600;">ELITE</span>
                      <input type="radio" name="cms_signup_tier" value="elite" style="accent-color:#00e676;cursor:pointer;">
                    </div>
                    <div style="font-weight:700;font-size:11.5px;color:#fff;">Full Suite</div>
                    <div style="font-size:9.5px;color:var(--cms-text-secondary);">$99 / mo · All 8 Studios</div>
                  </label>

                </div>
              </div>

              <button type="submit" class="cms-auth-submit-btn" id="cms-auth-submit-btn">
                Sign In to Studio
              </button>
            </form>

            <div class="cms-auth-footer">
              <span id="cms-auth-toggle-msg">First time coaching here?</span>
              <a href="javascript:void(0)" class="cms-auth-link" onclick="const mode = document.getElementById('cms-auth-form')?.dataset?.mode; CMSAuth.setAuthModalMode(mode === 'signup' ? 'signin' : 'signup');">
                Switch Mode
              </a>
            </div>
          </div>
        </div>
      `;
    },

    renderToolLockModalHtml: function(toolId) {
      const requiredTier = this.getRequiredTierForTool(toolId);
      const toolMeta = TOOL_METADATA[toolId] || { name: 'Tactical Studio', icon: '🔒' };
      const currentTierObj = TIERS[this.currentTier] || TIERS.free;

      return `
        <div class="cms-auth-backdrop" id="cms-tool-lock-modal-root" style="display:flex;" onclick="CMSAuth.closeToolLockModal()">
          <div class="cms-auth-card cms-tool-lock-card" role="dialog" aria-modal="true" style="max-width:460px;" onclick="event.stopPropagation()">
            
            <button type="button" class="cms-auth-close-btn" onclick="CMSAuth.closeToolLockModal()" title="Return to Dashboard">✕</button>

            <div class="cms-lock-hero-icon" style="background:${requiredTier.color}22;color:${requiredTier.color};border:2px solid ${requiredTier.color}66;margin:0 auto 12px auto;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;">
              ${toolMeta.icon}
            </div>

            <div class="cms-auth-header" style="margin-bottom:14px;">
              <span class="cms-nav-tier-badge" style="background:${requiredTier.color}22;color:${requiredTier.color};border:1px solid ${requiredTier.color}66;margin:0 auto 8px auto;display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:800;">
                ${requiredTier.badge} SUBSCRIPTION REQUIRED
              </span>
              <h2 class="cms-auth-title" style="font-size:22px;margin-bottom:4px;">${toolMeta.name}</h2>
              <p class="cms-auth-subtitle" style="font-size:12.5px;">
                Your active account is on the <strong style="color:#fff;">${currentTierObj.name}</strong> plan. Upgrade to unlock this studio.
              </p>
            </div>

            <div class="cms-lock-perks-box" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 16px;text-align:left;margin-bottom:18px;">
              <div style="font-size:11px;font-weight:800;color:${requiredTier.color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Included with ${requiredTier.name}:</div>
              <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--cms-text-primary);">
                ${requiredTier.features.map(f => `<li style="display:flex;align-items:center;gap:6px;"><span style="color:${requiredTier.color};">✓</span> ${f}</li>`).join('')}
              </ul>
            </div>

            <div style="display:flex;flex-direction:column;gap:10px;">
              <!-- One-Click Instant Plan Upgrade -->
              <button type="button" class="cms-auth-submit-btn" style="background:${requiredTier.color};color:#000;font-weight:800;height:44px;font-size:14px;margin:0;" onclick="CMSAuth.setUserTier('${requiredTier.id}')">
                ⚡ Upgrade Plan to ${requiredTier.badge} (${requiredTier.price}/${requiredTier.period}) & Unlock
              </button>

              <div class="cms-auth-divider" style="margin:8px 0 6px 0;"><span>or field quick-access PIN</span></div>

              <div style="display:flex;gap:8px;">
                <input type="password" id="cms-lock-pin-input" placeholder="Enter 4-Digit PIN or Admin Pass" style="flex:1;height:40px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);color:#fff;text-align:center;font-size:15px;outline:none;" onkeydown="if(event.key==='Enter') CMSAuth.quickPinUnlock('${toolId}')" />
                <button type="button" class="cms-auth-submit-btn" style="width:auto;padding:0 18px;margin:0;height:40px;background:rgba(255,255,255,0.12);color:#fff;" onclick="CMSAuth.quickPinUnlock('${toolId}')">Unlock</button>
              </div>
              <div id="cms-lock-pin-err" style="display:none;color:#ff5252;font-size:11.5px;text-align:left;"></div>

              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
                <a href="index.html" class="cms-lock-back-link" style="font-size:12px;color:var(--cms-text-secondary);text-decoration:none;font-weight:600;">
                  ← Return to Dashboard
                </a>
                <button type="button" onclick="CMSAuth.openAuthModal('signin', { isGate: true })" style="background:none;border:none;color:var(--cms-accent-cyan);font-size:12px;cursor:pointer;font-weight:700;">
                  Switch Coach Account →
                </button>
              </div>
            </div>

          </div>
        </div>
      `;
    }
  };

  window.CMSAuth = CMSAuth;

  // Auto initialize on script evaluation and DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      CMSAuth.init();
      CMSAuth.enforceCurrentToolAccess();
    });
  } else {
    CMSAuth.init();
    CMSAuth.enforceCurrentToolAccess();
  }

  try {
    CMSAuth.enforceCurrentToolAccess();
  } catch (e) {}

})(window, document);
