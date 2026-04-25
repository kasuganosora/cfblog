/**
 * BaseModel
 * Base class for all data models
 */

export class BaseModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Validate a field/column name to prevent SQL injection.
   * Only allows alphanumeric characters and underscores.
   * Must start with a letter or underscore (not a digit).
   */
  _validateFieldName(field) {
    if (typeof field !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      throw new Error(`Invalid field name: ${field}`);
    }
    return field;
  }

  /**
   * Safely quote a SQL identifier (column/table name) to prevent injection.
   * @param {string} col - Column or table name
   * @returns {string} Quoted identifier
   */
  _quoteField(col) {
    return '"' + col.replace(/"/g, '""') + '"';
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
   * Build a safe WHERE condition with field name validation.
   * @param {string} field - Column name (validated)
   * @param {string} operator - SQL operator
   * @param {*} value - Parameter value (bound via placeholder)
   * @returns {{ condition: string, params: Array }} Safe condition string and params
   */
  where(field, operator, value) {
    this._validateFieldName(field);
    const allowedOperators = ['=', '!=', '<', '>', '<=', '>=', '<>', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', 'IS', 'IS NOT'];
    const normalizedOp = operator.toUpperCase();
    if (!allowedOperators.includes(normalizedOp) && !allowedOperators.includes(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    const quotedField = this._quoteField(field);

    // Guard against empty array for IN / NOT IN — would produce invalid SQL
    if ((normalizedOp === 'IN' || normalizedOp === 'NOT IN') && Array.isArray(value) && value.length === 0) {
      // Produce a condition that is always false (no rows match)
      return { condition: '1 = 0', params: [] };
    }

    // Handle IN / NOT IN with multiple placeholders
    if (normalizedOp === 'IN' || normalizedOp === 'NOT IN') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => '?').join(', ');
        return { condition: `${quotedField} ${operator} (${placeholders})`, params: value };
      }
      // Single non-array value: treat like a regular equality
      return { condition: `${quotedField} ${operator} (?)`, params: [value] };
    }

    return { condition: `${quotedField} ${operator} ?`, params: [value] };
  }

  /**
   * Build a safe ORDER BY clause with column name and direction validation.
   * @param {string} column - Column name (validated)
   * @param {string} direction - 'ASC' or 'DESC' (validated)
   * @returns {string} Safe ORDER BY expression
   */
  buildOrderBy(column, direction = 'ASC') {
    this._validateFieldName(column);
    const dir = direction.toUpperCase();
    if (dir !== 'ASC' && dir !== 'DESC') {
      throw new Error(`Invalid order direction: ${direction}. Must be ASC or DESC.`);
    }
    return `${this._quoteField(column)} ${dir}`;
  }

  /**
   * Get all records
   */
  async all(options = {}) {
    const { where = '', params = [], orderBy = '', limit = '', offset = '' } = options;

    let sql = `SELECT * FROM ${this.tableName}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }
    if (offset) {
      sql += ` OFFSET ${parseInt(offset)}`;
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
      .filter(([_key, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    // Validate all field names to prevent SQL injection
    for (const field of Object.keys(filteredData)) {
      this._validateFieldName(field);
    }

    const fields = Object.keys(filteredData).map(f => this._quoteField(f)).join(', ');
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
    // Validate all field names to prevent SQL injection
    for (const field of Object.keys(data)) {
      this._validateFieldName(field);
    }

    const fields = Object.keys(data).map(key => `${this._quoteField(key)} = ?`).join(', ');
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
   * Uses SQLite (D1) LIMIT/OFFSET syntax instead of MySQL LIMIT offset, count
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

    // Get records using SQLite-compatible LIMIT/OFFSET
    const records = await this.all({
      where,
      params,
      orderBy,
      limit: `${limit}`,
      offset: `${offset}`
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