import { executeQuery, executeOne, executeRun, paginate, getTotalPages } from '../utils/db.js';

export class BaseModel {
  constructor(env) {
    this.env = env;
  }
  
  // 执行查询
  async executeQuery(query, params = []) {
    return await executeQuery(this.env, query, params);
  }
  
  // 执行单行查询
  async executeOne(query, params = []) {
    return await executeOne(this.env, query, params);
  }
  
  // 执行插入/更新/删除操作
  async executeRun(query, params = []) {
    return await executeRun(this.env, query, params);
  }
  
  // 获取所有记录
  async getAll(table, options = {}) {
    const { 
      select = '*', 
      where = '', 
      params = [], 
      orderBy = 'created_at DESC',
      page = 1, 
      limit = 10 
    } = options;
    
    let query = `SELECT ${select} FROM ${table}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    query += ` ORDER BY ${orderBy}`;
    
    // 分页处理
    const paginatedQuery = paginate(query, page, limit);
    const result = await executeQuery(this.env, paginatedQuery, params);
    
    if (!result.success) {
      return result;
    }
    
    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM ${table}`;
    if (where) {
      countQuery += ` WHERE ${where}`;
    }
    
    const countResult = await executeOne(this.env, countQuery, params);
    
    if (!countResult.success) {
      return countResult;
    }
    
    const total = countResult.result.total;
    
    return {
      success: true,
      data: result.results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: getTotalPages(total, limit)
      }
    };
  }
  
  // 根据 ID 获取记录
  async getById(table, id, select = '*') {
    const query = `SELECT ${select} FROM ${table} WHERE id = ?`;
    const result = await executeOne(this.env, query, [id]);
    return result;
  }
  
  // 插入记录
  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    return await executeRun(this.env, query, values);
  }
  
  // 更新记录
  async update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    return await executeRun(this.env, query, [...values, id]);
  }
  
  // 删除记录
  async delete(table, id) {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    return await executeRun(this.env, query, [id]);
  }
  
  // 根据条件查找记录
  async findOne(table, where, params = [], select = '*') {
    const query = `SELECT ${select} FROM ${table} WHERE ${where}`;
    const result = await executeOne(this.env, query, params);
    return result;
  }
  
  // 根据条件查找多个记录
  async findMany(table, where, params = [], options = {}) {
    const { 
      select = '*', 
      orderBy = 'created_at DESC',
      page = 1, 
      limit = 10 
    } = options;
    
    let query = `SELECT ${select} FROM ${table} WHERE ${where}`;
    query += ` ORDER BY ${orderBy}`;
    
    // 分页处理
    const paginatedQuery = paginate(query, page, limit);
    const result = await executeQuery(this.env, paginatedQuery, params);
    
    if (!result.success) {
      return result;
    }
    
    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM ${table} WHERE ${where}`;
    const countResult = await executeOne(this.env, countQuery, params);
    
    if (!countResult.success) {
      return countResult;
    }
    
    const total = countResult.result.total;
    
    return {
      success: true,
      data: result.results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: getTotalPages(total, limit)
      }
    };
  }
}