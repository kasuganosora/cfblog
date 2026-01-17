/**
 * Test Credentials
 * 测试用的登录凭证
 * 从数据库导入的测试数据
 */

const testCredentials = {
  // 管理员
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    expectedBehavior: {
      canAccessAdmin: true,
      canCreatePost: true,
      canEditPost: true,
      canDeletePost: true,
      canManageUsers: true,
      canManageSettings: true
    }
  },

  // 投稿者
  editor: {
    username: 'editor',
    password: 'editor123',
    role: 'contributor',
    expectedBehavior: {
      canAccessAdmin: true,
      canCreatePost: true,
      canEditPost: true,
      canDeletePost: false,
      canManageUsers: false,
      canManageSettings: false
    }
  },

  // 作者
  author1: {
    username: 'author1',
    password: 'author123',
    role: 'author',
    expectedBehavior: {
      canAccessAdmin: false,
      canCreatePost: true,
      canEditPost: true, // 只能编辑自己的文章
      canDeletePost: false,
      canManageUsers: false,
      canManageSettings: false
    }
  },

  // 普通用户
  user1: {
    username: 'user1',
    password: 'user123',
    role: 'user',
    expectedBehavior: {
      canAccessAdmin: false,
      canCreatePost: false,
      canEditPost: false,
      canDeletePost: false,
      canManageUsers: false,
      canManageSettings: false,
      canComment: true,
      canLikePost: true
    }
  },

  // 访客
  visitor: {
    role: 'visitor',
    expectedBehavior: {
      canAccessAdmin: false,
      canCreatePost: false,
      canEditPost: false,
      canDeletePost: false,
      canManageUsers: false,
      canManageSettings: false,
      canComment: false,
      canLikePost: true
    }
  }
};

export default testCredentials;
