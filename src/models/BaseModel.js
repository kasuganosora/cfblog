/**
 * BaseModel
 * Base class for all data models
 */

export class BaseModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Execute a query and return results
   */
  async query(sql, params = []) {
    try {
      const result = await this.db.prepare(sql).bind(...params).all();
      return result.results;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Execute a query and return first result
   */
  async queryFirst(sql, params = []) {
    try {
      const result = await this.db.prepare(sql).bind(...params).first();
      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Execute a query and return no results (INSERT, UPDATE, DELETE)
   */
  async execute(sql, params = []) {
    try {
      const result = await this.db.prepare(sql).bind(...params).run();
      return result;
    } catch (error) {
      console.error('Execute error:', error);
      throw error;
    }
  }

  /**
   * Get all records
   */
  async all(options = {}) {
    const { where = '', params = [], orderBy = '', limit = '' } = options;

    let sql = `SELECT * FROM ${this.tableName}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    return this.query(sql, params);
  }

  /**
   * Find by ID
   */
  async findById(id) {
    return this.queryFirst(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  /**
   * Find one record
   */
  async findOne(options = {}) {
    const { where = '', params = [], orderBy = '' } = options;

    let sql = `SELECT * FROM ${this.tableName}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    sql += ' LIMIT 1';

    return this.queryFirst(sql, params);
  }

  /**
   * Create a new record
   */
  async create(data) {
    // Filter out undefined values
    const filteredData = Object.entries(data)
      .filter(([key, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    const fields = Object.keys(filteredData).join(', ');
    const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
    const values = Object.values(filteredData);

    const sql = `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`;

    const result = await this.execute(sql, values);
    return this.findById(result.meta.last_row_id);
  }

  /**
   * Update a record
   */
  async update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    values.push(id);

    const sql = `UPDATE ${this.tableName} SET ${fields} WHERE id = ?`;

    await this.execute(sql, values);
    return this.findById(id);
  }

  /**
   * Delete a record
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    return this.execute(sql, [id]);
  }

  /**
   * Count records
   */
  async count(options = {}) {
    const { where = '', params = [] } = options;

    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }

    const result = await this.queryFirst(sql, params);
    return result ? result.count : 0;
  }

  /**
   * Paginate records
   */
  async paginate(options = {}) {
    const {
      where = '',
      params = [],
      orderBy = '',
      page = 1,
      limit = 10
    } = options;

    const offset = (page - 1) * limit;

    // Get total count
    const total = await this.count({ where, params });

    // Get records
    const records = await this.all({
      where,
      params,
      orderBy,
      limit: `${offset}, ${limit}`
    });

    return {
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
