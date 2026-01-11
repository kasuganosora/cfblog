# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - heading "Cloudflare Blog" [level=1] [ref=e3]:
      - link "Cloudflare Blog" [ref=e4] [cursor=pointer]:
        - /url: /
    - navigation [ref=e5]:
      - link "首页" [ref=e6] [cursor=pointer]:
        - /url: /
      - link "分类" [ref=e7] [cursor=pointer]:
        - /url: /categories
      - link "标签" [ref=e8] [cursor=pointer]:
        - /url: /tags
      - link "留言" [ref=e9] [cursor=pointer]:
        - /url: /feedback
      - link "登录" [ref=e10] [cursor=pointer]:
        - /url: /login
  - main [ref=e11]:
    - generic [ref=e12]:
      - 'heading "搜索结果: Cloudflare" [level=2] [ref=e13]'
      - generic [ref=e14]:
        - textbox "搜索文章..." [ref=e15]: Cloudflare
        - button "搜索" [ref=e16]
      - paragraph [ref=e17]: 没有找到相关文章
    - navigation [ref=e18]: 第 1 页，共 0 页
  - contentinfo [ref=e19]:
    - paragraph [ref=e20]: © 2026 Cloudflare Blog. Powered by Cloudflare Workers.
```