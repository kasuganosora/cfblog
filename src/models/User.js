import { BaseModel } from './BaseModel.js';
import { executeOne } from '../utils/db.js';

export class User extends BaseModel {
  constructor(env) {
    super(env);
  }
  
  // 根据用户名获取用户
  async getByUsername(username) {
    return await this.findOne('users', 'username = ?', [username]);
  }
  
  // 根据邮箱获取用户
  async getByEmail(email) {
    return await this.findOne('users', 'email = ?', [email]);
  }
  
  // 验证用户密码
  async validatePassword(username, password) {
    const result = await this.getByUsername(username);
    if (!result.success || !result.result) {
      return { success: false, message: '用户不存在' };
    }
    
    const user = result.result;
    
    // 在实际应用中，这里应该使用安全的密码比较方法
    // 这里简化处理，实际应该使用 bcrypt 等密码哈希库
    if (user.password_hash === password) {
      // 移除密码哈希，不返回给客户端
      delete user.password_hash;
      return { success: true, user };
    }
    
    return { success: false, message: '密码错误' };
  }
  
  // 创建用户
  async createUser(userData) {
    const { username, email, password, displayName, role = 'contributor' } = userData;
    
    // 检查用户名和邮箱是否已存在
    const existingUserByUsername = await this.getByUsername(username);
    if (existingUserByUsername.success && existingUserByUsername.result) {
      return { success: false, message: '用户名已存在' };
    }
    
    const existingUserByEmail = await this.getByEmail(email);
    if (existingUserByEmail.success && existingUserByEmail.result) {
      return { success: false, message: '邮箱已存在' };
    }
    
    // 创建用户
    const newUserData = {
      username,
      email,
      password_hash: password, // 实际应用中应该使用哈希
      display_name: displayName,
      role,
      status: 1 // active
    };
    
    const result = await this.insert('users', newUserData);
    
    if (!result.success) {
      return { success: false, message: '创建用户失败', error: result.error };
    }
    
    // 获取新创建的用户
    const newUser = await this.getById('users', result.meta.lastRowId);
    
    if (!newUser.success || !newUser.result) {
      return { success: false, message: '获取新用户信息失败' };
    }
    
    // 移除密码哈希
    delete newUser.result.password_hash;
    
    return { 
      success: true, 
      message: '用户创建成功', 
      user: newUser.result 
    };
  }
  
  // 更新用户信息
  async updateUser(userId, userData) {
    const { username, email, displayName, bio, avatar } = userData;
    
    // 检查用户是否存在
    const existingUser = await this.getById('users', userId);
    if (!existingUser.success || !existingUser.result) {
      return { success: false, message: '用户不存在' };
    }
    
    // 如果更新用户名，检查是否已存在
    if (username && username !== existingUser.result.username) {
      const userWithSameUsername = await this.getByUsername(username);
      if (userWithSameUsername.success && userWithSameUsername.result) {
        return { success: false, message: '用户名已存在' };
      }
    }
    
    // 如果更新邮箱，检查是否已存在
    if (email && email !== existingUser.result.email) {
      const userWithSameEmail = await this.getByEmail(email);
      if (userWithSameEmail.success && userWithSameEmail.result) {
        return { success: false, message: '邮箱已存在' };
      }
    }
    
    // 准备更新数据
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (displayName) updateData.display_name = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    updateData.updated_at = new Date().toISOString();
    
    const result = await this.update('users', userId, updateData);
    
    if (!result.success) {
      return { success: false, message: '更新用户失败', error: result.error };
    }
    
    // 获取更新后的用户信息
    const updatedUser = await this.getById('users', userId);
    
    if (!updatedUser.success || !updatedUser.result) {
      return { success: false, message: '获取更新后的用户信息失败' };
    }
    
    // 移除密码哈希
    delete updatedUser.result.password_hash;
    
    return { 
      success: true, 
      message: '用户更新成功', 
      user: updatedUser.result 
    };
  }
  
  // 更新用户状态
  async updateUserStatus(userId, status) {
    const result = await this.update('users', userId, { 
      status, 
      updated_at: new Date().toISOString() 
    });
    
    if (!result.success) {
      return { success: false, message: '更新用户状态失败', error: result.error };
    }
    
    return { success: true, message: '用户状态更新成功' };
  }
  
  // 更新用户角色
  async updateUserRole(userId, role) {
    const result = await this.update('users', userId, { 
      role, 
      updated_at: new Date().toISOString() 
    });
    
    if (!result.success) {
      return { success: false, message: '更新用户角色失败', error: result.error };
    }
    
    return { success: true, message: '用户角色更新成功' };
  }
  
  // 获取用户列表
  async getUsers(options = {}) {
    const { page = 1, limit = 10, role, status } = options;
    
    let where = '1=1';
    const params = [];
    
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }
    
    if (status !== undefined) {
      where += ' AND status = ?';
      params.push(status);
    }
    
    return await this.findMany('users', where, params, {
      select: 'id, username, email, display_name, avatar, role, bio, status, created_at, updated_at',
      orderBy: 'created_at DESC',
      page,
      limit
    });
  }
}