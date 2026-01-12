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
      - heading "联系我们" [level=2] [ref=e13]
      - paragraph [ref=e14]: 如果您有任何问题或建议，请通过以下表单联系我们：
      - generic [ref=e15]:
        - generic [ref=e16]:
          - text: 姓名
          - textbox "姓名" [ref=e17]
        - generic [ref=e18]:
          - text: 邮箱
          - textbox "邮箱" [ref=e19]
        - generic [ref=e20]:
          - text: 主题
          - textbox "主题" [ref=e21]
        - generic [ref=e22]:
          - text: 内容
          - textbox "内容" [ref=e23]
        - button "提交" [ref=e24]
  - contentinfo [ref=e25]:
    - paragraph [ref=e26]: © 2026 Cloudflare Blog. Powered by Cloudflare Workers.
```