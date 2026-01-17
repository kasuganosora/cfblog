/**
 * Test Data Fixtures
 * 测试数据 fixtures
 */

const testData = {
  users: {
    admin: {
      username: 'admin',
      password: 'admin123',
      email: 'admin@cfblog.test',
      role: 'admin'
    },
    contributor: {
      username: 'editor',
      password: 'editor123',
      email: 'editor@cfblog.test',
      role: 'contributor'
    },
    author: {
      username: 'author1',
      password: 'author123',
      email: 'author1@cfblog.test',
      role: 'author'
    }
  },

  posts: {
    published: {
      title: 'Test Published Post',
      slug: 'test-published-post',
      excerpt: 'This is a test published post excerpt.',
      content: 'This is the full content of a test published post.',
      status: 1
    },
    draft: {
      title: 'Test Draft Post',
      slug: 'test-draft-post',
      excerpt: 'This is a test draft post excerpt.',
      content: 'This is the full content of a test draft post.',
      status: 0
    },
    featured: {
      title: 'Test Featured Post',
      slug: 'test-featured-post',
      excerpt: 'This is a test featured post excerpt.',
      content: 'This is the full content of a test featured post.',
      featured: 1
    }
  },

  comments: {
    valid: {
      author: 'Test Commenter',
      email: 'commenter@test.com',
      content: 'This is a test comment content.',
      post_slug: 'test-published-post'
    },
    invalid: {
      author: '',
      email: 'invalid-email',
      content: ''
    }
  },

  languages: {
    'zh-cn': {
      name: '简体中文',
      direction: 'ltr'
    },
    'en-us': {
      name: 'English',
      direction: 'ltr'
    }
  },

  themes: {
    'default': {
      name: '默认主题',
      type: 'light'
    },
    'dark': {
      name: '深色主题',
      type: 'dark'
    }
  },

  pages: {
    home: '/',
    about: '/about',
    contact: '/contact',
    login: '/login',
    register: '/register',
    admin: '/admin',
    feedback: '/feedback',
    search: '/search'
  },

  api: {
    posts: '/api/posts',
    postDetail: (slug) => `/api/posts/${slug}`,
    userMe: '/api/user/me',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    search: '/api/search'
  },

  selectors: {
    // 通用选择器
    navigation: '[data-testid="navigation"]',
    footer: '[data-testid="footer"]',
    
    // 用户相关
    userMenu: '[data-testid="user-menu-button"]',
    logoutButton: '[data-testid="logout-button"]',
    
    // 文章相关
    postCard: '[data-testid="post-card"]',
    postTitle: '[data-testid="post-title"]',
    postContent: '[data-testid="post-content"]',
    postExcerpt: '[data-testid="post-excerpt"]',
    
    // 评论相关
    commentForm: '[data-testid="comment-form"]',
    commentList: '[data-testid="comment-list"]',
    
    // 分页
    pagination: '[data-testid="pagination"]',
    
    // 主题切换
    themeSwitcher: '[data-testid="theme-switcher"]',
    
    // 语言切换
    languageSwitcher: '[data-testid="language-switcher"]',
    
    // 表单
    loginForm: '[data-testid="login-form"]',
    registerForm: '[data-testid="register-form"]',
    searchForm: '[data-testid="search-form"]'
  },

  viewport: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 }
  }
};

export default testData;
