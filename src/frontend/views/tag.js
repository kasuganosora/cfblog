/**
 * Tag Detail View
 */

import { esc } from '../utils/helpers.js';
import { renderLayout } from './layout.js';

export function renderTag({ blogTitle, slug }) {
  return renderLayout({
    title: '标签: ' + slug,
    blogTitle,
    activePage: 'tags',
    pageData: { slug },
    pageScript: 'tag.js',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">标签: ${esc(slug)}</h1>
    <div id="posts-list"><p style="color:var(--muted)">加载中...</p></div>
  </div>
</div>`
  });
}
