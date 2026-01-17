/**
 * Template Engine
 * Loads and renders HTML templates with support for themes and i18n
 */

class TemplateEngine {
  constructor(env) {
    this.env = env;
    this.cache = new Map();
  }

  /**
   * Load a template file
   * @param {string} name - Template name (e.g., 'home', 'post')
   * @param {string} theme - Theme name (e.g., 'default', 'dark')
   */
  async loadTemplate(name, theme = 'default') {
    const cacheKey = `${theme}:${name}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Try to load from theme directory
      const module = await import(`../themes/${theme}/${name}.html`);
      const template = module.default || module;
      
      // Cache for production
      if (this.env === 'production') {
        this.cache.set(cacheKey, template);
      }
      
      return template;
    } catch (e) {
      console.error(`Failed to load template: ${theme}/${name}.html`, e);
      // Fallback to default theme
      if (theme !== 'default') {
        return this.loadTemplate(name, 'default');
      }
      throw e;
    }
  }

  /**
   * Render template with data
   * @param {string} name - Template name
   * @param {Object} data - Template data
   * @param {string} theme - Theme name
   */
  async render(name, data = {}, theme = 'default') {
    const template = await this.loadTemplate(name, theme);
    let html = template;
    
    // Simple template variable replacement
    // Format: {{variableName}}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, this.escapeHtml(value));
    }
    
    // Handle {{#if condition}} blocks
    html = this.processConditionals(html, data);
    
    // Handle {{#each array}} blocks
    html = this.processLoops(html, data);
    
    return html;
  }

  /**
   * Process {{#if}} conditionals
   */
  processConditionals(html, data) {
    // Simple implementation: {{#if variable}}...{{/if}}
    return html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
      return data[variable] ? content : '';
    });
  }

  /**
   * Process {{#each}} loops
   */
  processLoops(html, data) {
    // Simple implementation: {{#each array}}...{{/each}}
    return html.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, variable, content) => {
      const array = data[variable];
      if (!Array.isArray(array)) return '';
      return array.map(item => {
        let itemHtml = content;
        // Replace {{item.property}} with actual values
        for (const [key, value] of Object.entries(item)) {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          itemHtml = itemHtml.replace(regex, this.escapeHtml(value));
        }
        return itemHtml;
      }).join('');
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return text;
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default TemplateEngine;
