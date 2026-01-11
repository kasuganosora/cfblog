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
    - heading "最新文章" [level=2] [ref=e13]
    - navigation [ref=e14]: 第 1 页，共 0 页
    - complementary [ref=e15]:
      - generic [ref=e16]:
        - heading "热门分类" [level=3] [ref=e17]
        - list
      - heading "热门标签" [level=3] [ref=e19]
      - generic [ref=e20]:
        - heading "搜索" [level=3] [ref=e21]
        - generic [ref=e22]:
          - textbox "搜索文章..." [ref=e23]
          - button "搜索" [ref=e24]
  - contentinfo [ref=e25]:
    - paragraph [ref=e26]: © 2026 Cloudflare Blog. Powered by Cloudflare Workers.
```