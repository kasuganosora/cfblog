/**
 * Tags List View
 */

import { renderLayout } from './layout.js';

export function renderTags({ blogTitle }) {
  return renderLayout({
    title: '标签',
    blogTitle,
    activePage: 'tags',
    pageScript: 'tags.js',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">标签列表</h1>
    <div class="tag-page tag-cloud" id="tags-list"></div>
  </div>
</div>`
  });
}
