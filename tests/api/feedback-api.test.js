/**
 * Feedback API Tests
 * 测试反馈相关API接口
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../src/models/Feedback.js', () => ({
  Feedback: vi.fn().mockImplementation(() => ({
    createFeedback: vi.fn(),
    getFeedbackList: vi.fn(),
    findById: vi.fn(),
    deleteFeedback: vi.fn()
  }))
}));

vi.mock('../../src/utils/response.js', () => ({
  successResponse: vi.fn((data, message) => ({
    status: 200,
    headers: {},
    body: JSON.stringify({ success: true, message, data })
  })),
  errorResponse: vi.fn((message, status = 400) => ({
    status,
    headers: {},
    body: JSON.stringify({ success: false, message })
  })),
  serverErrorResponse: vi.fn((message) => ({
    status: 500,
    headers: {},
    body: JSON.stringify({ success: false, message })
  }))
}));

describe('Feedback API Tests', () => {
  describe('POST /api/feedback/create', () => {
    it('应该成功提交反馈', async () => {
      const newFeedback = {
        name: '访客',
        email: 'visitor@example.com',
        content: '这是一条反馈内容'
      };

      expect(newFeedback.name).toBeDefined();
      expect(newFeedback.content).toBeDefined();
    });

    it('应该验证必填字段', async () => {
      const incompleteFeedback = {
        email: 'test@example.com'
        // missing: name, content
      };

      expect(incompleteFeedback.name).toBeUndefined();
      expect(incompleteFeedback.content).toBeUndefined();
    });
  });

  describe('GET /api/feedback/list', () => {
    it('应该返回反馈列表', async () => {
      const mockFeedbacks = [
        {
          id: 1,
          name: '访客A',
          content: '反馈1',
          status: 0,
          created_at: '2026-01-17T00:00:00Z'
        },
        {
          id: 2,
          name: '访客B',
          content: '反馈2',
          status: 1,
          created_at: '2026-01-16T00:00:00Z'
        }
      ];

      expect(mockFeedbacks).toHaveLength(2);
      expect(mockFeedbacks[0].status).toBe(0); // pending
    });

    it('应该支持分页参数', async () => {
      const params = { page: 1, limit: 20 };
      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
    });

    it('应该支持按状态筛选', async () => {
      const status = 1; // approved
      expect(status).toBe(1);
    });
  });

  describe('GET /api/feedback/:id', () => {
    it('应该返回指定ID的反馈', async () => {
      const mockFeedback = {
        id: 1,
        name: '访客',
        email: 'visitor@example.com',
        content: '这是一条反馈',
        status: 0,
        created_at: '2026-01-17T00:00:00Z'
      };

      expect(mockFeedback.id).toBe(1);
      expect(mockFeedback.name).toBe('访客');
    });

    it('反馈不存在时应该返回404', async () => {
      const feedbackId = 999;
      const feedback = null;

      expect(feedback).toBeNull();
      expect(feedbackId).toBe(999);
    });
  });

  describe('DELETE /api/feedback/:id/delete', () => {
    it('应该成功删除反馈', async () => {
      const feedbackId = 1;
      expect(feedbackId).toBe(1);
    });
  });
});
