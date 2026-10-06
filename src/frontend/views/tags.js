/**
 * Tags List View
 */

import { renderTagCloud } from '../utils/content.js';
import { renderLayout } from './layout.js';

export function renderTags({ blogTitle, tags = null, siteUrl }) {
  const list = tags == null ? '' : renderTagCloud(tags);
  const ssr = tags == null ? '' : ' data-ssr="1"';

  return renderLayout({
    title: '标签',
    blogTitle,
    activePage: 'tags',
    pageScript: 'tags.js',
    seo: {
      canonicalUrl: siteUrl ? `${siteUrl}/tags` : undefined,
      siteUrl,
      description: '标签',
    },
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">标签列表</h1>
    <div class="tag-page tag-cloud" id="tags-list"${ssr}>${list}</div>
  </div>
</div>`
  });
}
