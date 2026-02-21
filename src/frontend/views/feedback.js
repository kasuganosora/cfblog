/**
 * Feedback Page View
 */

import { esc } from '../utils/helpers.js';
import { renderLayout } from './layout.js';

export function renderFeedback({ blogTitle, currentUser }) {
  const identityFields = currentUser
    ? `<div class="cmt-user-info">以 <b>${esc(currentUser.displayName)}</b> 身份留言</div>`
    : `<div class="fb-row">
        <label for="name">姓名</label>
        <input type="text" id="name" name="name" required data-testid="feedback-name-input">
      </div>
      <div class="fb-row">
        <label for="email">邮箱</label>
        <input type="email" id="email" name="email" data-testid="feedback-email-input">
      </div>`;

  return renderLayout({
    title: '留言板',
    blogTitle,
    activePage: 'feedback',
    pageData: { currentUser },
    pageScript: 'feedback.js',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">留言板</h1>
    <div id="message"></div>
    <form class="fb-form" data-testid="feedback-form" id="feedback-form">
      ${identityFields}
      <div class="fb-row">
        <label for="content">内容</label>
        <textarea id="content" name="content" required data-testid="feedback-content-input" rows="5"></textarea>
      </div>
      <button type="submit" class="fb-btn" data-testid="feedback-submit-button">提交</button>
    </form>
    <h2 style="margin-top:2rem;font-size:1.1rem">最新留言</h2>
    <div id="feedback-list"><p style="color:var(--muted)">留言提交后将由管理员审核</p></div>
  </div>
</div>`
  });
}
