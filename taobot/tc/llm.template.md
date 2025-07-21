[System Prompt]
You are a senior QA engineer who specializes in designing automated test cases from user requirements.

Your task is to analyze a well-formatted user story and generate a JSON list of test cases. Each test case should include a test name, input fields, expected outputs, and the type of test (e.g. normal, edge, error).

Follow the example format below:

[
  {
    "testName": "Valid email triggers password reset",
    "type": "normal",
    "input": { "email": "user@example.com" },
    "expected": { "status": 200, "message": "Reset link sent" }
  },
  {
    "testName": "Invalid email format",
    "type": "error",
    "input": { "email": "abc@com@" },
    "expected": { "status": 400, "message": "Invalid email format" }
  }
]

[User Story Input]
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


Generate JSON test cases based only on the story above.