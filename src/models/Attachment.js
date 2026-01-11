import { BaseModel } from './BaseModel.js';
import { generateFileKey } from '../utils/storage.js';

export class Attachment extends BaseModel {
  constructor(env) {
    super(env);
  }
  
  // 上传附件
  async uploadAttachment(attachmentData) {
    const { 
      originalName, 
      file, 
      mimeType, 
      fileSize, 
      uploaderId, 
      postId, 
      description = '',
      folder = 'attachments'
    } = attachmentData;
    
    // 生成唯一文件键
    const fileName = generateFileKey(originalName, folder);
    
    // 上传文件到 R2
    const r2Result = await this.uploadFileToR2(fileName, file, mimeType);
    
    if (!r2Result.success) {
      return { success: false, message: '文件上传失败', error: r2Result.error };
    }
    
    // 保存附件信息到数据库
    const newAttachmentData = {
      original_name: originalName,
      file_name: fileName,
      file_path: fileName,
      mime_type: mimeType,
      file_size: fileSize,
      uploader_id: uploaderId,
      post_id: postId,
      description
    };
    
    const result = await this.insert('attachments', newAttachmentData);
    
    if (!result.success) {
      // 如果数据库插入失败，删除已上传的文件
      await this.deleteFileFromR2(fileName);
      return { success: false, message: '保存附件信息失败', error: result.error };
    }
    
    // 获取新创建的附件
    const newAttachment = await this.getById('attachments', result.meta.lastRowId);
    
    return { 
      success: true, 
      message: '附件上传成功', 
      attachment: newAttachment.result 
    };
  }
  
  // 获取附件详情
  async getAttachmentById(id) {
    return await this.getById('attachments', id);
  }
  
  // 获取附件列表
  async getAttachments(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      uploaderId, 
      postId, 
      mimeType 
    } = options;
    
    let where = '1=1';
    const params = [];
    
    if (uploaderId) {
      where += ' AND uploader_id = ?';
      params.push(uploaderId);
    }
    
    if (postId) {
      where += ' AND post_id = ?';
      params.push(postId);
    }
    
    if (mimeType) {
      where += ' AND mime_type LIKE ?';
      params.push(`%${mimeType}%`);
    }
    
    return await this.findMany('attachments', where, params, {
      select: 'id, original_name, file_name, file_path, mime_type, file_size, uploader_id, post_id, description, download_count, created_at, updated_at',
      orderBy: 'created_at DESC',
      page,
      limit
    });
  }
  
  // 更新附件信息
  async updateAttachment(id, attachmentData) {
    // 检查附件是否存在
    const existingAttachment = await this.getById('attachments', id);
    if (!existingAttachment.success || !existingAttachment.result) {
      return { success: false, message: '附件不存在' };
    }
    
    // 准备更新数据
    const updateData = {};
    if (attachmentData.description !== undefined) updateData.description = attachmentData.description;
    if (attachmentData.postId !== undefined) updateData.post_id = attachmentData.postId;
    updateData.updated_at = new Date().toISOString();
    
    const result = await this.update('attachments', id, updateData);
    
    if (!result.success) {
      return { success: false, message: '更新附件失败', error: result.error };
    }
    
    // 获取更新后的附件信息
    const updatedAttachment = await this.getById('attachments', id);
    
    return { 
      success: true, 
      message: '附件更新成功', 
      attachment: updatedAttachment.result 
    };
  }
  
  // 删除附件
  async deleteAttachment(id) {
    // 检查附件是否存在
    const existingAttachment = await this.getById('attachments', id);
    if (!existingAttachment.success || !existingAttachment.result) {
      return { success: false, message: '附件不存在' };
    }
    
    const attachment = existingAttachment.result;
    
    // 从 R2 删除文件
    const r2Result = await this.deleteFileFromR2(attachment.file_path);
    if (!r2Result.success) {
      console.error('Failed to delete file from R2:', r2Result.error);
      // 继续删除数据库记录，但记录错误
    }
    
    // 从数据库删除附件记录
    const result = await this.delete('attachments', id);
    
    if (!result.success) {
      return { success: false, message: '删除附件记录失败', error: result.error };
    }
    
    return { success: true, message: '附件删除成功' };
  }
  
  // 获取附件文件
  async getAttachmentFile(filePath) {
    try {
      const object = await this.env.BLOG_STORAGE.get(filePath);
      
      if (!object) {
        return {
          success: false,
          error: '文件不存在'
        };
      }
      
      return {
        success: true,
        data: object.body,
        contentType: object.httpMetadata.contentType,
        size: object.size,
        etag: object.etag
      };
    } catch (error) {
      console.error('R2 get file error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 增加下载次数
  async incrementDownloadCount(id) {
    const query = 'UPDATE attachments SET download_count = download_count + 1 WHERE id = ?';
    return await this.executeRun(query, [id]);
  }
  
  // 获取附件统计信息
  async getAttachmentStats() {
    try {
      // 总文件数
      const totalFilesResult = await this.executeOne('SELECT COUNT(*) as total FROM attachments');
      const totalFiles = totalFilesResult.success ? totalFilesResult.result.total : 0;
      
      // 总文件大小
      const totalSizeResult = await this.executeOne('SELECT SUM(file_size) as total_size FROM attachments');
      const totalSize = totalSizeResult.success ? totalSizeResult.result.total_size : 0;
      
      // 按类型统计
      const typeStatsResult = await this.executeQuery(`
        SELECT 
          CASE 
            WHEN mime_type LIKE 'image/%' THEN 'images'
            WHEN mime_type LIKE 'video/%' THEN 'videos'
            WHEN mime_type LIKE 'audio/%' THEN 'audio'
            WHEN mime_type LIKE 'text/%' OR mime_type = 'application/pdf' THEN 'documents'
            ELSE 'others'
          END as file_type,
          COUNT(*) as count,
          SUM(file_size) as size
        FROM attachments
        GROUP BY 
          CASE 
            WHEN mime_type LIKE 'image/%' THEN 'images'
            WHEN mime_type LIKE 'video/%' THEN 'videos'
            WHEN mime_type LIKE 'audio/%' THEN 'audio'
            WHEN mime_type LIKE 'text/%' OR mime_type = 'application/pdf' THEN 'documents'
            ELSE 'others'
          END
      `);
      
      const typeStats = typeStatsResult.success ? typeStatsResult.results : [];
      
      return {
        success: true,
        stats: {
          totalFiles,
          totalSize,
          typeStats
        }
      };
    } catch (error) {
      console.error('Get attachment stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 上传文件到 R2
  async uploadFileToR2(key, file, mimeType) {
    try {
      const object = await this.env.BLOG_STORAGE.put(key, file, {
        httpMetadata: {
          contentType: mimeType,
        },
      });
      
      return {
        success: true,
        key: object.key,
        etag: object.etag,
        size: object.size
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 从 R2 删除文件
  async deleteFileFromR2(key) {
    try {
      await this.env.BLOG_STORAGE.delete(key);
      
      return {
        success: true,
        message: '文件删除成功'
      };
    } catch (error) {
      console.error('R2 delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}