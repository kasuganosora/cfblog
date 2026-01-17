/**
 * Post Detail Page - 文章详情页面对象
 */

class PostDetailPage {
  constructor(page) {
    this.page = page;
  }

  async goto(slug) {
    await this.page.goto(`/post/${slug}`);
    await this.page.waitForLoadState('networkidle');
  }

  // 获取文章标题
  async getTitle() {
    return await this.page.textContent('[data-testid="post-title"]');
  }

  // 获取文章内容
  async getContent() {
    return await this.page.textContent('[data-testid="post-content"]');
  }

  // 获取文章元数据
  async getMetadata() {
    return await this.page.$$eval('[data-testid="post-meta"]', meta => {
      const author = meta.querySelector('[data-testid="post-author"]')?.textContent;
      const date = meta.querySelector('[data-testid="post-date"]')?.textContent;
      const views = meta.querySelector('[data-testid="post-views"]')?.textContent;
      return { author, date, views };
    });
  }

  // 获取标签
  async getTags() {
    return await this.page.$$eval('[data-testid="post-tags"] a', tags => {
      return tags.map(tag => ({
        name: tag.textContent,
        slug: tag.getAttribute('href')
      }));
    });
  }

  // 获取分类
  async getCategory() {
    return await this.page.$eval('[data-testid="post-category"] a', cat => ({
      name: cat.textContent,
      slug: cat.getAttribute('href')
    }));
  }

  // 获取评论列表
  async getComments() {
    return await this.page.$$eval('[data-testid="comment-item"]', comments => {
      return comments.map(comment => ({
        author: comment.querySelector('[data-testid="comment-author"]')?.textContent,
        content: comment.querySelector('[data-testid="comment-content"]')?.textContent,
        date: comment.querySelector('[data-testid="comment-date"]')?.textContent
      }));
    });
  }

  // 提交评论
  async submitComment({ author, email, content }) {
    await this.page.fill('[name="author"]', author);
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="content"]', content);
    await this.page.click('[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  // 点赞文章
  async likePost() {
    await this.page.click('[data-testid="like-button"]');
    await this.page.waitForTimeout(500); // 等待动画完成
  }

  // 分享文章
  async sharePost(platform) {
    await this.page.click(`[data-testid="share-${platform}"]`);
  }

  // 返回首页
  async goHome() {
    await this.page.click('[data-testid="home-link"]');
    await this.page.waitForLoadState('networkidle');
  }

  // 编辑文章（如果有权限）
  async editPost() {
    const editButton = await this.page.$('[data-testid="edit-post-button"]');
    if (editButton) {
      await editButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  // 删除文章（如果有权限）
  async deletePost() {
    const deleteButton = await this.page.$('[data-testid="delete-post-button"]');
    if (deleteButton) {
      await deleteButton.click();
      // 确认删除
      await this.page.click('[data-testid="confirm-delete"]');
      await this.page.waitForLoadState('networkidle');
    }
  }
}

export default PostDetailPage;
