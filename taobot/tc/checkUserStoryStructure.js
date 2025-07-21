function checkUserStoryStructure(storyMarkdown) {
  const requiredSections = [
    '## 🧩 User Story',
    '## 🧱 Preconditions',
    '## ✅ Acceptance Criteria',
    '## 📥 Input / Output Requirements',
  ];

  const missing = requiredSections.filter(section => !storyMarkdown.includes(section));

  if (missing.length > 0) {
    return {
      valid: false,
      reason: `Missing required sections: ${missing.join(', ')}`
    };
  }

  const hasAtLeastOneScenario = storyMarkdown.includes('Scenario 1');

  if (!hasAtLeastOneScenario) {
    return {
      valid: false,
      reason: 'No test scenarios found under Acceptance Criteria'
    };
  }

  return {
    valid: true,
    reason: 'Story is structurally complete.'
  };
}

// 用法示例
import * as fs from "fs";
const storyText = fs.readFileSync('./sample-story.md', 'utf8');
console.log(checkUserStoryStructure(storyText));