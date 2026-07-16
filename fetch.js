const input = `---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "howie-daily-helpers"
  text: "日常开发工具函数集"
  tagline: 一组无框架依赖的轻量 TypeScript 工具，涵盖类型判断、日志记录等
  actions:
    - theme: brand
      text: 查看 Core 文档
      link: /core/
    - theme: alt
      text: GitHub
      link: https://github.com/Lhy-study/howie-daily-helpers

features:
  - title: Core 核心工具
    details: 无框架依赖的纯 TS 基础工具，涵盖类型判断、日志记录等。文档详见 /core/。
---

`

const options = {
  method: 'POST',
  headers: {
    Authorization: 'Bearer 41568875441a4c088f1913f215659ad6.Qkpd4d8y4TxngNkE',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'embedding-3',
    input,
    dimensions: 2,
  }),
};

fetch('https://open.bigmodel.cn/api/paas/v4/embeddings', options)
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
