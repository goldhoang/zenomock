# Lộ trình nâng cấp & phát triển tiếp theo

Tài liệu này bổ sung [`mvp-and-phases.md`](./mvp-and-phases.md) sau khi Phases 0–5 (MVP learning slice + chaos proxy) đã có.  
Mục tiêu: hướng dẫn **polish → harden → mở rộng** mà không phá Tri-Mode / $0 infra.

---

## 1. Trạng thái hiện tại (baseline)

| Khu vực | Đã có |
| :--- | :--- |
| Tri-Mode | Offline · Showroom · Hybrid |
| Boundary | Generators + Explorer |
| Schema CRUD | In-memory mock |
| Chaos | Latency / 500 / corrupt JSON |
| Proxy | Allowlisted `/proxy` + SSRF guards cơ bản |
| Docs | API, features, guides, deploy smoke |

**Kết thúc “xây module”** → chuyển sang **polish UX + ổn định vận hành** trước khi thêm feature lớn.

---

## 2. Wave A — Polish UI/UX & chất lượng *(done — `chore/ui-ux-polish`)*

- Sticky section nav + smooth scroll / hash deep-links
- JSON syntax highlighting (`highlight.js`) trên preview blocks
- Footer & hero branding **GoldHoang** (`goldhoang.dev` / GitHub Pages)
- Focus-visible, scroll-margin, panel grid 2×2 / 4-col, toast/state consistency
- Docs: chaos & proxy deep-dive + guide/README polish
- Comment cleanup (giữ comment bảo mật / ordering / UX)

**DoD Wave A:** playground “demo-ready” 5 phút không cần đọc code.

---

## 3. Wave B — Hardening kỹ thuật

- Unit tests cho `ProxyTargetBuilder` / `ChaosChance` (0%/100%)
- Integration smoke trong CI (health + proxy 403 + boundary 200)
- Structured logging cho proxy deny / upstream timeout
- DNS / private-IP policy chặt hơn (optional opt-in)
- Dockerfile / GHCR tags (`latest` + semver) documented
- Rate-limit nhẹ trên `/proxy` (local abuse)

---

## 4. Wave C — Nâng cấp sản phẩm (chọn lọc)

| Ý tưởng | Ghi chú | Rủi ro |
| :--- | :--- | :--- |
| Persist schema/chaos ra file volume | Hữu ích Docker; vẫn local-first | Phức tạp hơn in-memory |
| OpenAPI import → schema seed | Gần Postman-lite | Scope lớn |
| Multi-upstream profiles | Nhiều `UpstreamBaseUrl` đặt tên | Config UX |
| Webhook / SSE mock | Demo realtime | Ngoài MVP |
| Auth demo (API key header) | Học bảo mật | Không làm “real IAM” |
| Seed packs (e-commerce, blog) | Onboarding nhanh | Nội dung |

Mỗi mục = PR riêng, cập nhật `/docs/api` + guide.

---

## 5. Non-goals vẫn giữ

- Multi-tenant SaaS / billing
- Public open proxy
- EF Core / Redis bắt buộc
- Claim stack chưa cài (Tailwind, v.v.)

---

## 6. Thứ tự gợi ý

```text
1) chore/ui-ux-polish     ← done
2) test/hardening-ci      ← Wave B tiếp theo
3) (optional) feat/* từ Wave C theo nhu cầu học
```

Cập nhật checklist DoD trong PR; roadmap phase số chỉ mở rộng khi có module mới rõ ràng.
