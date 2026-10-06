import { describe, expect, it } from 'vitest';
import { renderMarkdown, renderArticleCards, toIsoDate, shareImage } from '../../src/frontend/utils/content.js';
import { renderPost } from '../../src/frontend/views/post.js';
import { renderHome } from '../../src/frontend/views/home.js';
import { renderTag } from '../../src/frontend/views/tag.js';
import { renderFeedback } from '../../src/frontend/views/feedback.js';

describe('server-rendered article HTML', () => {
  it('converts stored UTC datetimes to ISO 8601', () => {
    expect(toIsoDate('2026-09-05 10:27:02')).toBe('2026-09-05T10:27:02.000Z');
  });

  it('renders markdown text and drops unsafe URLs and raw HTML', () => {
    const html = renderMarkdown('# 标题\n\n正文一段\n\n[坏链接](javascript:alert(1))\n\n<script>alert(1)</script>');
    expect(html).toContain('<h1>标题</h1>');
    expect(html).toContain('正文一段');
    expect(html).toContain('href="#"');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('javascript:');
  });

  it('puts post links in the homepage HTML', () => {
    const html = renderHome({
      blogTitle: '露娜的咖啡店',
      siteUrl: 'https://blog.hime.at',
      posts: [{
        id: 1,
        slug: 'thinkbot-note',
        title: 'ThinkBot 笔记',
        excerpt: '可恢复的任务引擎',
        published_at: '2026-09-05 10:27:02',
        author_name: '露娜',
        content: '正文',
        view_count: 3,
      }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      categories: [{ id: 2, slug: 'dev', name: '开发', post_count: 1 }],
      tags: [{ id: 3, slug: 'agent', name: 'Agent', post_count: 1 }],
    });
    expect(html).toContain('href="/post/thinkbot-note"');
    expect(html).toContain('ThinkBot 笔记');
    expect(html).toContain('href="/category/dev"');
    expect(html).toContain('<h1 class="pg-title">露娜的咖啡店</h1>');
    expect(html).toContain('<title>露娜的咖啡店 - 开发相关的笔记</title>');
    expect(html).toContain('露娜的咖啡店：开发相关的笔记。');
    expect(html).not.toContain('首页 -');
    expect(html).toContain('href="/tag/agent"');
    expect(html).not.toContain('加载中');
  });

  it('puts the article body in the post HTML', () => {
    const html = renderPost({
      blogTitle: '露娜的咖啡店',
      slug: 'thinkbot-note',
      currentUser: null,
      siteUrl: 'https://blog.hime.at',
      post: {
        title: 'ThinkBot 笔记',
        excerpt: '摘要',
        content: '## 小节\n\n这里是正文',
        published_at: '2026-09-05 10:27:02',
        updated_at: '2026-09-05 10:27:02',
        author_name: '露娜',
        status: 1,
        view_count: 4,
        tags: [{ slug: 'agent', name: 'Agent' }],
      },
    });
    expect(html).toContain('<h1 data-testid="post-title">ThinkBot 笔记</h1>');
    expect(html).toContain('<h2>小节</h2>');
    expect(html).toContain('这里是正文');
    expect(html).toContain('2026-09-05T10:27:02.000Z');
    expect(html).toContain('href="/tag/agent"');
    expect(html).toContain('BreadcrumbList');
    expect(html).toContain('og-default.png');
    expect(html).not.toContain('加载中');
    expect(html).not.toContain('内容加载中');
  });

  it('uses the first article image and lists related posts', () => {
    const html = renderPost({
      blogTitle: '露娜的咖啡店',
      slug: 'thinkbot-note',
      currentUser: null,
      siteUrl: 'https://blog.hime.at',
      category: { slug: 'dev', name: '开发' },
      related: [{ slug: 'other-note', title: '另一篇' }],
      post: {
        title: 'ThinkBot 笔记',
        excerpt: '摘要',
        content: '正文 ![示意图](/static/uploads/diagram.png)',
        published_at: '2026-09-05 10:27:02',
        author_name: '露娜',
        status: 1,
        tags: [{ slug: 'agent', name: 'Agent' }],
      },
    });
    expect(html).toContain('https://blog.hime.at/static/uploads/diagram.png');
    expect(html).toContain('href="/category/dev"');
    expect(html).toContain('另一篇');
    expect(shareImage({ content: '![图](https://cdn.example/a.png)' }, 'https://blog.hime.at'))
      .toBe('https://cdn.example/a.png');
  });

  it('keeps thin tag archives and the feedback form out of the index', () => {
    const tagHtml = renderTag({
      blogTitle: '露娜的咖啡店',
      slug: 'ble',
      siteUrl: 'https://blog.hime.at',
      tag: { name: 'BLE', slug: 'ble' },
      posts: [{ id: 1, slug: 'one', title: '仅此一篇', excerpt: '短' }],
      pagination: { total: 1 },
    });
    expect(tagHtml).toContain('noindex');
    const feedback = renderFeedback({ blogTitle: '露娜的咖啡店', currentUser: null });
    expect(feedback).toContain('noindex');
  });

  it('lists every supplied post as a crawlable card', () => {
    const html = renderArticleCards([
      { id: 1, slug: 'one', title: '第一篇', excerpt: '甲' },
      { id: 2, slug: 'two', title: '第二篇', excerpt: '乙' },
    ]);
    expect(html).toContain('href="/post/one"');
    expect(html).toContain('href="/post/two"');
  });
});
