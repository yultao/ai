---
## 🧩 User Story
**As a** [user type],  
**I want to** [do something],  
**So that** [achieve some value].

---

## 🧱 Preconditions / Context
- [ ] 系统前提（如：用户已登录）
- [ ] 依赖模块（如：必须已有用户数据）
- [ ] 输入数据格式要求（如：email 必须为有效邮箱）

---

## ✅ Acceptance Criteria (建议使用 Given / When / Then)

### ✅ Scenario 1: [正常流程场景]
- Given: ...
- When: ...
- Then: ...

### ❌ Scenario 2: [边界或异常场景]
- Given: ...
- When: ...
- Then: ...

### ⚠️ Scenario 3: [业务逻辑特例]
- Given: ...
- When: ...
- Then: ...

---

## 📥 Input / Output Requirements
- Input Fields:
  - email: string, required, must be valid
- Output:
  - status: 200 / 400 / 404
  - message: string

---

## 🛠️ API Endpoint (如果适用)
- Method: `POST`
- URL: `/api/v1/password-reset`
- Sample Request:
  ```json
  { "email": "user@example.com" }
