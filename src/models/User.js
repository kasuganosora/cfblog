/**
 * User Model
 * Handles user data operations
 */

import { BaseModel } from './BaseModel.js';
import { hashPassword, verifyPassword } from '../utils/auth.js';

export class User extends BaseModel {
  constructor(db) {
    super(db);
    this.tableName = 'users';
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    return this.queryFirst(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
      [username]
    );
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return this.queryFirst(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    const { username, email, password, displayName, role, bio, avatar, status } = userData;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await this.create({
      username,
      email,
      password_hash: passwordHash,
      display_name: displayName,
      avatar,
      role: role || 'member',
      bio,
      status: status !== undefined ? status : 1
    });

    // Remove password hash from response
    const { password_hash: _password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  async updateUser(id, userData) {
    const { username, email, displayName, bio, avatar, role, status } = userData;

    const updateData = {};

    if (username !== undefined) {
      const existing = await this.queryFirst(
        'SELECT id FROM users WHERE username = ? AND id != ?', [username, id]
      );
      if (existing) throw new Error('Username already exists');
      updateData.username = username;
    }

    if (email !== undefined) {
      const existing = await this.queryFirst(
        'SELECT id FROM users WHERE email = ? AND id != ?', [email, id]
      );
      if (existing) throw new Error('Email already exists');
      updateData.email = email;
    }

    if (displayName !== undefined) updateData.display_name = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    updateData.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const user = await this.update(id, updateData);

    // Remove password hash from response
    const { password_hash: _ph2, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change password
   */
  async changePassword(id, oldPassword, newPassword) {
    const user = await this.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    if (!(await verifyPassword(oldPassword, user.password_hash))) {
      throw new Error('Incorrect password');
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);

    await this.update(id, {
      password_hash: passwordHash,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    return true;
  }

  /**
   * Verify user credentials
   */
  async verifyCredentials(username, password) {
    const user = await this.findByUsername(username);

    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (user.status !== 1) {
      throw new Error('Invalid username or password');
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      throw new Error('Invalid username or password');
    }

    // Remove password hash from response
    const { password_hash: _ph3, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user list with filters
   */
  async getUserList(options = {}) {
    const { page = 1, limit = 10, role, status } = options;

    let where = [];
    let params = [];

    if (role) {
      where.push('role = ?');
      params.push(role);
    }

    if (status !== undefined) {
      where.push('status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? where.join(' AND ') : '';

    const result = await this.paginate({
      where: whereClause,
      params,
      orderBy: 'created_at DESC',
      page,
      limit
    });

    // Remove password hashes from results
    const dataWithoutPasswords = result.data.map(user => {
      const { password_hash: _password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      data: dataWithoutPasswords,
      pagination: result.pagination
    };
  }

  /**
   * Update user status
   */
  async updateStatus(id, status) {
    return this.updateUser(id, { status });
  }

  /**
   * Update user role
   */
  async updateRole(id, role) {
    const validRoles = ['admin', 'contributor', 'member'];

    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    return this.updateUser(id, { role });
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    // Check if user exists
    const user = await this.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    // Delete user
    await this.delete(id);

    return true;
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const totalUsers = await this.count();
    const activeUsers = await this.count({ where: 'status = ?', params: [1] });
    const adminCount = await this.count({ where: 'role = ?', params: ['admin'] });
    const contributorCount = await this.count({ where: 'role = ?', params: ['contributor'] });
    const memberCount = await this.count({ where: 'role = ?', params: ['member'] });

    return {
      total: totalUsers,
      active: activeUsers,
      admin: adminCount,
      contributor: contributorCount,
      member: memberCount
    };
  }
}
