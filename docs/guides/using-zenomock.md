# Hướng dẫn sử dụng ZenoMock (end-to-end)

Tài liệu thao tác playground + kịch bản tester cho **Phases 0–5** (đã ship).  
Dự án của **[GoldHoang](https://goldhoang.dev)** — playground: https://goldhoang.github.io/zenomock/

- Contract HTTP: [`../api/API_SPECIFICATION.md`](../api/API_SPECIFICATION.md)
- Thiết kế module: [`../features/`](../features/)
- **Chaos & Proxy (lý thuyết sâu, hay nhầm):** [`chaos-and-proxy-deep-dive.md`](./chaos-and-proxy-deep-dive.md)

---

## 1. ZenoMock là gì (trong 1 phút)

ZenoMock (**Zero Network Mock Engine**) là **mock engine local-first** + playground UI do GoldHoang thiết kế để học Tri-Mode, boundary testing, mock CRUD và chaos — chạy $0 trên GHCR + GitHub Pages.

| Bạn cần | ZenoMock giúp |
| :--- | :--- |
| FE chưa có BE / BE chậm | Tạo CRUD mock theo JSON Schema (in-memory) |
| Test form / encoding / XSS | Sinh chuỗi boundary (Zalgo, XSS, overflow, fuzz JSON) |
| Test loading / lỗi / body hỏng | Inject latency, HTTP 500, corrupted JSON |
| Test lỗi trên API gần thật | Allowlisted `/proxy` + chaos |
| Demo $0 trên GitHub Pages | Showroom tĩnh khi engine offline |

**Không phải:** database thật, auth multi-tenant, Postman thay thế toàn phần, hay reverse-proxy mở (không allowlist).

### Tri-Mode (cách mở app)

| Mode | Khi nào | API đi đâu |
| :--- | :--- | :--- |
| **Offline (Mode 1)** | `docker run` / `dotnet` trên `:8080`, mở UI cùng origin | Same-origin engine |
| **Showroom (Mode 2)** | Chỉ mở GitHub Pages, không chạy engine | Static JSON dưới `public/mock/` |
| **Hybrid (Mode 3)** | Pages UI + engine local `:8080` (CORS) | Live API local; fallback static nếu chết |

Smoke checklist: [`../deploy/tri-mode-smoke.md`](../deploy/tri-mode-smoke.md).

### Chạy nhanh Mode 1

```bash
docker run -p 8080:8080 ghcr.io/goldhoang/zenomock:latest
# hoặc
dotnet run --project src/ZenoMock.Api --urls http://localhost:8080
```

Mở http://localhost:8080 — banner phải báo engine sẵn sàng.

---

## 2. Phase 2 — Boundary Data Explorer

### Mục đích

Tạo **payload “ác”** để nhét vào form / API / layout của **app đang test** (thường là app thật trên local/staging), không phải để “đập” ZenoMock.

### Trong playground

1. Mở card **Boundary Data Explorer**.
2. Chọn tab: Zalgo · XSS/SQLi · Overflow · Fuzz JSON.
3. **Copy JSON** hoặc **Copy cURL** → mang sang app / terminal.

### Kịch bản tester cụ thể

**A. Form input / encoding**

1. Copy vài sample Zalgo hoặc overflow dài.
2. Dán vào ô tên sản phẩm / comment / tìm kiếm trên app thật.
3. Quan sát: UI có vỡ layout? API có 500? DB có lỗi charset?

**B. XSS / injection sanity**

1. Copy payload `<script>alert(1)</script>` (hoặc mẫu SQLi).
2. Submit form; expect HTML được escape, không execute script, không SQL lỗi lộ.

**C. Contract fuzz**

1. Tab **Fuzz JSON** → paste body mẫu → **Run fuzz**.
2. Copy `fuzzed` object → `POST` lên API staging (hoặc mock Schema ở Phase 3).
3. Expect: validation 400 rõ ràng, không crash process.

**Lưu ý Showroom:** GET boundary vẫn xem được từ static mock; Fuzz POST offline dùng mutator phía client.

---

## 3. Phase 3 — Schema & API Playground

### Mục đích

Đăng ký **entity + JSON Schema**, seed record **in-memory**, rồi `list / create / get-by-id` như API giả — để FE làm UI trước khi BE thật sẵn.

### Trong playground

1. Đặt `entity` (vd. `products`), chỉnh schema, optional `seedCount`.
2. **Register schema** → **List / Create / Get by id**.
3. Point client thật (`fetch` / axios `baseURL`) tới `http://localhost:8080`.

### Kịch bản cụ thể

**Sprint: màn Products, BE chậm 1 tuần**

1. Register:

```json
{
  "entity": "products",
  "seedCount": 5,
  "schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "price": { "type": "number" },
      "active": { "type": "boolean" }
    }
  }
}
```

2. FE gọi:

- `GET /api/v1/mock/products`
- `POST /api/v1/mock/products` body `{ "name": "Tea", "price": 2.5, "active": true }`
- `GET /api/v1/mock/products/{id}`

3. Khi BE thật sẵn: đổi `baseURL`, giữ cùng shape nếu contract khớp.

**Giới hạn:** mất data khi restart process; không auth; giới hạn số entity/record (xem API spec).

---

## 4. Phase 4 — Chaos Control Panel (chi tiết)

### Mục đích

**Cố ý làm hỏng** response của ZenoMock `/api/*` để kiểm tra client xử lý chậm / 500 / JSON vỡ — giống mạng flaky hoặc BE lỗi, nhưng **kiểm soát được**.

### Ba nút (slider)

| Slider | Hiệu ứng trên mỗi request `/api/*` (trừ chaos + health) |
| :--- | :--- |
| **Latency (ms)** | `Task.Delay` đúng số ms đã Apply trước khi xử lý tiếp |
| **Error 500 rate** | X% request bị short-circuit `500` + body `chaos-injected-500` |
| **Corrupted JSON rate** | Trong số request **không** bị 500 và trả 2xx JSON, X% body bị cắt/đổi quote/thiếu `}` |

**Luật cứng (đã siết):**

- **0%** → không bao giờ inject.
- **100%** → luôn inject.
- Giữa khoảng → random theo percent nguyên.
- **500 chạy trước** → nếu request đã 500 thì **không** corrupt.
- `/health` và `/api/v1/chaos/*` **không** bị chaos (để panel/probe diagnostics còn sống).
- Config chỉ trong **RAM process** — restart API về 0.

### Vai trò từng nút UI

| Nút | Việc làm |
| :--- | :--- |
| **Apply config** | Ghi slider → engine. **Bắt buộc** trước khi Probe phản ánh đúng ý bạn. |
| **Probe /boundary/xss** | `GET` một route `/api/*` thật để xem latency / status / body. Không tự Apply. |
| **Reset** | Đưa engine + slider về 0. |

Badge **unsaved** = slider khác config đang chạy trên engine → phải Apply lại.

### Quy trình test chuẩn (nên làm lần lượt)

**Test 1 — Latency**

1. Latency `1500`, 500 = 0%, corrupt = 0% → **Apply**.
2. **Probe** → toast ~1500ms, HTTP 200.
3. Trên app thật (nếu `baseURL` = ZenoMock): loading spinner / skeleton có hiện đủ lâu không.

**Test 2 — HTTP 500**

1. Latency 0, Error 500 = `100%` → Apply → Probe vài lần → **luôn** `HTTP 500`.
2. Đặt 40% → Probe 10 lần → khoảng 4 lần 500 (xấp xỉ).
3. App client: toast lỗi + retry; không white screen.

**Test 3 — Corrupted JSON**

1. 500 = `0%`, corrupt = `100%` → Apply → Probe → body không parse được JSON hợp lệ.
2. Client: `try/catch` quanh `response.json()`; fallback UI lỗi.

**Test 4 — Reset**

1. **Reset** → Apply không cần nếu Reset đã ghi engine.
2. Probe → ổn định 200, nhanh.

### Dùng chaos với Schema CRUD (kịch bản gần production)

1. Register `orders`, seed vài record (Phase 3).
2. FE list orders từ `GET /api/v1/mock/orders`.
3. Bật chaos 500 40% + latency 800ms → Apply.
4. Refresh list trên FE: một phần request fail/chậm → kiểm tra empty state, retry, không nháy layout.

### curl nhanh

```bash
curl -s -X POST http://localhost:8080/api/v1/chaos/config \
  -H "Content-Type: application/json" \
  -d "{\"latencyMs\":0,\"error500Rate\":1,\"corruptedJsonRate\":0}"

curl -s -w "\nHTTP %{http_code}\n" \
  http://localhost:8080/api/v1/boundary/strings/xss-payloads

curl -s -X POST http://localhost:8080/api/v1/chaos/reset
```

Collection: `tests/http/chaos.http`. Design nội bộ: [`../features/chaos/chaos-design.md`](../features/chaos/chaos-design.md).

### Sai lầm thường gặp

| Hiện tượng | Nguyên nhân |
| :--- | :--- |
| Kéo 100% nhưng Probe vẫn 200 | Quên **Apply** (badge unsaved) |
| Corrupt 100% vẫn thấy 500 | Đang để Error 500 > 0 — 500 thắng |
| Chaos “mất” sau vài phút | Restart container/`dotnet` — RAM wipe |
| Pages Showroom không inject | Đúng: cần Mode 1 hoặc Hybrid |

---

## 5. Phase 5 — Chaos proxy (đã ship)

> Đọc kỹ lý thuyết + SSRF + env production: [`chaos-and-proxy-deep-dive.md`](./chaos-and-proxy-deep-dive.md) (Phần B).

### Mục đích

Forward request qua ZenoMock tới **một upstream đã cấu hình** (`Proxy:UpstreamBaseUrl`), chỉ khi **host nằm trong allowlist**. Chaos Phase 4 cũng áp lên `/proxy/*` → test client với payload “gần thật” + lỗi giả.

**Production / Docker:** không cần “mở file trong container”. Override bằng biến môi trường `Proxy__UpstreamBaseUrl`, `Proxy__AllowedHosts__0`, … (file `appsettings.json` vẫn nằm trong image với default `httpbin.org`).

```text
Client → GET http://localhost:8080/proxy/api/v1/boundary/strings/xss-payloads
       → (Dev) http://127.0.0.1:8080/api/v1/boundary/strings/xss-payloads
       → (+ optional chaos)
```

### Cấu hình

| Môi trường | Upstream mặc định | Allowlist |
| :--- | :--- | :--- |
| Development | `http://127.0.0.1:8080` | `127.0.0.1`, `localhost` |
| Production / Docker | `https://httpbin.org` | `httpbin.org` |

Sửa `appsettings*.json` section `Proxy`. Allowlist rỗng = **deny all**.

### Trong playground

1. Card **Chaos Proxy** — xem upstream + allowed hosts.
2. Nhập path (Dev: `/api/v1/boundary/strings/xss-payloads`; httpbin: `/get`).
3. **Probe /proxy** — xem status, header `X-ZenoMock-Upstream`, body.
4. (Tuỳ chọn) Chaos Control → Apply 500 100% → Probe proxy → luôn 500 (short-circuit trước khi forward).

### Bảo vệ SSRF (tóm tắt)

- Chỉ host trong allowlist; scheme http/https; không userinfo; không follow redirect.
- Chặn cứng metadata (`169.254.169.254`, …).
- Không forward nested `/proxy/...`.
- Timeout + giới hạn body.

Chi tiết: [`../features/chaos/proxy-design.md`](../features/chaos/proxy-design.md). Collection: `tests/http/proxy.http`.

### Kịch bản tester

1. Point app tới `http://localhost:8080/proxy/...` thay vì gọi staging trực tiếp (staging host phải có trong allowlist + `UpstreamBaseUrl`).
2. Bật chaos 30–40% 500 → quan sát retry trên response proxied.
3. Thử host không allowlist → expect **403** `proxy-denied`.
4. Reset chaos khi xong.

---

## 6. Luồng một buổi test (gợi ý)

```text
1. Mode 1: bật engine :8080
2. Boundary → copy XSS/Zalgo → dán form app thật
3. Schema → register products → FE gắn baseURL mock
4. Chaos → Apply latency/500/corrupt → Probe + refresh FE
5. Proxy → Probe /proxy/... (+ chaos) trên upstream allowlist
6. Reset chaos trước khi commit / tắt máy
```

---

## 7. Sau Phase 5

Lộ trình polish / hardening / mở rộng: [`../roadmap/future-upgrades.md`](../roadmap/future-upgrades.md).

---

## 8. Liên kết nhanh

| Chủ đề | File |
| :--- | :--- |
| Phases / DoD | [`../roadmap/mvp-and-phases.md`](../roadmap/mvp-and-phases.md) |
| Future upgrades | [`../roadmap/future-upgrades.md`](../roadmap/future-upgrades.md) |
| Tri-Mode kiến trúc | [`../architecture/tri-mode-architecture.md`](../architecture/tri-mode-architecture.md) |
| API | [`../api/API_SPECIFICATION.md`](../api/API_SPECIFICATION.md) |
| Boundary design | [`../features/boundary/boundary-design.md`](../features/boundary/boundary-design.md) |
| Schema design | [`../features/schema/schema-design.md`](../features/schema/schema-design.md) |
| Chaos design | [`../features/chaos/chaos-design.md`](../features/chaos/chaos-design.md) |
| Proxy design | [`../features/chaos/proxy-design.md`](../features/chaos/proxy-design.md) |
| Deploy / smoke | [`../deploy/`](../deploy/) |
