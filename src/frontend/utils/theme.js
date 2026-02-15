/**
 * Theme Management Utility
 * Supports multiple themes and runtime switching
 */

// Available themes
const AVAILABLE_THEMES = {
  'default': {
    name: 'Default',
    displayName: '默认主题',
    description: '清爽简洁的默认主题',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1f2937',
      border: '#e5e7eb',
    }
  },
  'dark': {
    name: 'Dark',
    displayName: '深色主题',
    description: '护眼深色主题',
    colors: {
      primary: '#3b82f6',
      secondary: '#4b5563',
      background: '#1a1a1a',
      text: '#f3f4f6',
      border: '#2d3748',
    }
  },
};

const DEFAULT_THEME = 'default';

// Get theme from API
async function getThemeFromAPI(env) {
  try {
    const response = await fetch('/api/settings/blog');
    if (!response.ok) return DEFAULT_THEME;
    
    const data = await response.json();
    return data.theme || DEFAULT_THEME;
  } catch (e) {
    console.error('Failed to fetch theme:', e);
    return DEFAULT_THEME;
  }
}

// Get user's saved theme from localStorage (returns null if not set)
function getUserTheme() {
  try {
    const saved = localStorage.getItem('cfblog_theme');
    if (saved && AVAILABLE_THEMES[saved]) {
      return saved;
    }
  } catch (e) {
    // localStorage not available
  }
  return null;
}

// Set user's preferred theme
function setUserTheme(theme) {
  if (AVAILABLE_THEMES[theme]) {
    try {
      localStorage.setItem('cfblog_theme', theme);
      applyTheme(theme);
      return true;
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }
  return false;
}

// Apply theme to page
function applyTheme(theme) {
  const themeData = AVAILABLE_THEMES[theme];
  if (!themeData) return;

  const root = document.documentElement;
  
  // Set CSS variables
  const colors = themeData.colors;
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-border', colors.border);
  
  // Set theme class on body
  document.body.className = document.body.className.replace(/theme-\S+/g, '');
  document.body.classList.add(`theme-${theme}`);
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', colors.background);
  }
}

// Get theme data
function getThemeData(theme) {
  return AVAILABLE_THEMES[theme] || AVAILABLE_THEMES[DEFAULT_THEME];
}

// Get available themes
function getAvailableThemes() {
  return AVAILABLE_THEMES;
}

// Initialize theme
async function initTheme(env) {
  // Check user's saved preference first
  const userTheme = getUserTheme();

  // If user has a saved preference, use it
  if (userTheme) {
    applyTheme(userTheme);
    return userTheme;
  }

  // Otherwise try to get theme from API (server setting)
  const apiTheme = await getThemeFromAPI(env);
  applyTheme(apiTheme);
  return apiTheme;
}

// Export for use in frontend
if (typeof window !== 'undefined') {
  window.CFBlogTheme = {
    init: initTheme,
    set: setUserTheme,
    get: getUserTheme,
    getAvailable: getAvailableThemes,
    apply: applyTheme,
  };
}

export {
  initTheme,
  setUserTheme,
  getUserTheme,
  getThemeData,
  getAvailableThemes,
  DEFAULT_THEME,
  AVAILABLE_THEMES,
};
