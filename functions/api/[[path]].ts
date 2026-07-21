// ============================================================
// API 代理 Functions/api/[path].ts
// ============================================================
export async function onRequest(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  // 删除前缀 /api
  url.pathname = url.pathname.replace(/^\/api/, "");
  const newReq = new Request(url, request);
  return env.API_WORKER.fetch(newReq);
}