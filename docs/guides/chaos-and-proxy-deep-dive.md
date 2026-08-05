# Chaos & Proxy — lý thuyết, ngữ cảnh, cách dùng

Tài liệu sâu (tiếng Việt) cho hai chủ đề hay gây nhầm: **Chaos injection** và **Allowlisted Proxy**.  
Hướng dẫn thao tác playground đầy đủ: [`using-zenomock.md`](./using-zenomock.md).  
Contract: [`../api/API_SPECIFICATION.md`](../api/API_SPECIFICATION.md).

> Tác giả dự án: **[GoldHoang](https://goldhoang.dev)** · playground: [goldhoang.github.io/zenomock](https://goldhoang.github.io/zenomock/)

---

## Phần A — Chaos: “cố ý làm hỏng API”

### A1. Lý thuyết (chaos engineering thu nhỏ)

Trong hệ thống thật, mạng chậm, server 500, body JSON hỏng là chuyện thường.  
Client (web/mobile) phải:

- hiện loading đủ lâu khi chậm;
- hiện lỗi / retry khi 500;
- không crash khi `JSON.parse` fail.

**Chaos trong ZenoMock** không phải “random phá production”. Đây là **van điều khiển** trên mock engine: bạn chọn tỷ lệ lỗi, bấm Apply, rồi quan sát app của bạn.

### A2. Ngữ cảnh dùng

| Tình huống | Vì sao dùng Chaos |
| :--- | :--- |
| FE vừa xong màn list | Kiểm tra empty/error state khi API 500 |
| Loading spinner | Bật latency 1–2s xem UX có đứng hình không |
| Parser / type guard | Bật corrupt JSON xem app có white-screen không |

Chaos chỉ áp trên engine local (`:8080`). GitHub Pages Showroom **không** inject live chaos.

### A3. Ba nút điều khiển

| Slider | Ý nghĩa | 0% / 100% |
| :--- | :--- | :--- |
| Latency | Delay mỗi request `/api/*` và `/proxy/*` | 0 = không delay |
| Error 500 | Short-circuit trả 500 trước khi chạy handler | 100% = luôn 500 |
| Corrupted JSON | Làm hỏng body 2xx JSON | 100% = luôn vỡ (nếu không bị 500 trước) |

**Thứ tự mỗi request:** delay → (có thể) 500 → gọi handler / proxy → (có thể) corrupt.

**Không bị chaos:** `/health`, `/api/v1/chaos/*`, `/api/v1/proxy/config`.

### A4. Apply vs Probe (hay quên)

- Slider chỉ là **bản nháp** trên UI.
- **Apply config** mới ghi vào RAM process.
- Badge `unsaved` = chưa Apply → Probe bị chặn.
- **Reset** = đưa engine về 0.

### A5. Cách check nhanh

1. 500 = 100% → Apply → Probe → luôn HTTP 500.
2. Reset → Probe → HTTP 200.
3. 500 = 0%, corrupt = 100% → Apply → Probe → body không parse được.
4. `/health` vẫn OK khi đang chaos.

Config production/Docker: chaos vẫn chỉnh qua UI hoặc `POST /api/v1/chaos/config` — không cần sửa file; mất khi restart container.

---

## Phần B — Proxy: “đi nhờ” qua ZenoMock tới API khác

### B1. Lý thuyết

**Proxy** = trạm trung gian. Client không gọi thẳng staging; gọi ZenoMock; ZenoMock gọi tiếp upstream rồi trả về.

```text
App  →  localhost:8080/proxy/...  →  Upstream (staging / httpbin / loopback)
                ↑
         có thể gắn Chaos ở đây
```

**Ý nghĩa:** Chaos Phase 4 vốn chỉ phá API do ZenoMock tự phục vụ. Proxy mở rộng: phá luôn traffic **tới API gần thật**, miễn host nằm trong allowlist.

### B2. Không phải open proxy

Nếu ai cũng forward được tới IP bất kỳ → **SSRF** (server bị lợi dụng gọi metadata cloud / intranet).  
ZenoMock chỉ forward khi:

- host ∈ `Proxy:AllowedHosts`;
- scheme http/https;
- không redirect;
- không metadata host;
- không nested `/proxy/proxy/...`;
- có timeout + giới hạn body.

### B3. Config ở đâu khi “không còn appsettings”?

File `appsettings.json` **vẫn nằm trong Docker image**. Khi chạy production:

| Cách | Ví dụ |
| :--- | :--- |
| Default trong image | `https://httpbin.org` |
| Override bằng env | `Proxy__UpstreamBaseUrl=https://staging.example.com` |
| Allowlist env | `Proxy__AllowedHosts__0=staging.example.com` |

```bash
docker run -p 8080:8080 \
  -e Proxy__UpstreamBaseUrl=https://staging.example.com \
  -e Proxy__AllowedHosts__0=staging.example.com \
  ghcr.io/goldhoang/zenomock:latest
```

Development (`dotnet run`): mặc định upstream = `http://127.0.0.1:8080` (tự gọi lại boundary) để demo không cần mạng ngoài.

### B4. Cách ghép URL

```text
GET /proxy/{path}?query
→ {UpstreamBaseUrl}/{path}?query
```

Ví dụ Dev:

`/proxy/api/v1/boundary/strings/xss-payloads`  
→ `http://127.0.0.1:8080/api/v1/boundary/strings/xss-payloads`

### B5. Cách dùng + check

1. `GET /api/v1/proxy/config` — xem upstream + allowlist.
2. Probe path hợp lệ → 200 + header `X-ZenoMock-Proxy`, `X-ZenoMock-Upstream`.
3. `/proxy/proxy/evil` → 403.
4. Chaos 100% 500 + Probe proxy → 500 (chaos trước khi forward).
5. App thật: đổi `baseURL` thành `http://localhost:8080/proxy`, upstream trỏ staging đã allowlist.

### B6. Phân biệt nhanh

| Module | Việc làm |
| :--- | :--- |
| Schema mock | ZenoMock **tự tạo** data |
| Chaos | ZenoMock **làm hỏng** response đi qua nó |
| Proxy | ZenoMock **đi lấy** response từ chỗ khác, rồi (tuỳ) chaos |

---

## Phần C — Kịch bản một buổi (áp dụng)

1. Mode 1: bật engine `:8080`.
2. Boundary: copy XSS → dán form app.
3. Schema: mock `products` cho FE.
4. Chaos: latency + 500 trên mock list.
5. Proxy: trỏ upstream staging (env) → chaos trên traffic proxied.
6. Reset chaos trước khi tắt máy.

HTTP collections: `tests/http/chaos.http`, `tests/http/proxy.http`.
