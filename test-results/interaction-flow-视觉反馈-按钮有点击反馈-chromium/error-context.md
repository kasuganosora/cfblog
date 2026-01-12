# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - heading "Cloudflare Blog" [level=1] [ref=e3]:
      - link "Cloudflare Blog" [ref=e4] [cursor=pointer]:
        - /url: /
    - navigation [ref=e5]:
      - link "首页" [ref=e6] [cursor=pointer]:
        - /url: /
      - link "关于" [ref=e7] [cursor=pointer]:
        - /url: /about
  - main [ref=e8]:
    - generic [ref=e9]:
      - heading "留言反馈" [level=2] [ref=e10]
      - paragraph [ref=e11]: 欢迎留下您的意见和建议！
      - generic [ref=e12]:
        - generic [ref=e13]:
          - text: 姓名
          - textbox "姓名" [active] [ref=e14]
        - generic [ref=e15]:
          - text: 邮箱
          - textbox "邮箱" [ref=e16]
        - generic [ref=e17]:
          - text: 内容
          - textbox "内容" [ref=e18]
        - button "提交" [ref=e19]
  - contentinfo [ref=e20]:
    - paragraph [ref=e21]: © 2026 Cloudflare Blog
```