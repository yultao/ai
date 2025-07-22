---
## 🧩 User Story
**As a registered user,  
**I want to reset my password via email,  
**So that I can regain access to my account.

---

## 🧱 Preconditions / Context
- User must be registered
- Email field must not be empty

---

## ✅ Acceptance Criteria (建议使用 Given / When / Then)

### ✅ Scenario 1: Valid Email [正常流程场景]
- Given the user is registered with email user@example.com  
- When the user submits the reset request with this email  
- Then the system should return status 200 and send a reset link

### ❌ Scenario 2: Non-existent email [边界或异常场景]
- Given the user enters an email not in the system  
- Then return 404 and display "User not found"

### ⚠️ Scenario 3: Scenario: Invalid format [业务逻辑特例]
- When the email field is malformed (like "abc@com@")  
- Then return 400 and show "Invalid email format"

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
