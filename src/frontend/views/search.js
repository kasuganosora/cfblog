/**
 * Search Page View
 */

import { esc } from '../utils/helpers.js';
import { renderLayout } from './layout.js';

export function renderSearch({ blogTitle, keyword }) {
  return renderLayout({
    title: '搜索',
    blogTitle,
    pageData: { keyword },
    pageScript: 'search.js',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">搜索</h1>
    <form class="search-box" data-testid="search-form" method="GET" action="/search">
      <input type="text" name="keyword" value="${esc(keyword)}" placeholder="输入关键词..." data-testid="search-input">
      <button type="submit" data-testid="search-button">搜索</button>
    </form>
    <div data-testid="search-results" id="results"></div>
  </div>
</div>`
  });
}
