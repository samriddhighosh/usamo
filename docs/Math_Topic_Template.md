# USAMO Guide Topic Template

Use this template to add new math topics. Create two files:

- An MDX module in the correct content section folder
- A matching .problems.json file with problem lists

## 1) MDX Module Template

```mdx
---
id: topic-id-here
title: Topic Title Here
author: USAMO Guide Team
description: One sentence summary for SEO and previews.
prerequisites: ["optional-prereq-id"]
---
+
+## Overview
+
+Briefly explain what the topic covers and where it appears in contests.
+
+## Key Ideas
+
+- Bullet 1 with a short explanation.
+- Bullet 2 with a short explanation.
+- Bullet 3 with a short explanation.
+
+## Worked Example
+
+Include at least one worked example. Use inline math like $a^2+b^2$ and
+display math like:
+
+$$
+\sum_{k=1}^n k = \frac{n(n+1)}{2}
+$$
+
+## Common Pitfalls
+
+- List common mistakes and how to avoid them.
+
+## Practice Problems
+
+<Problems problems="practice" />
+```

## 2) Problems JSON Template

```json
{
  "MODULE_ID": "topic-id-here",
  "practice": [
    {
      "uniqueId": "amc10-2019a-12",
      "name": "Problem 12",
      "url": "https://artofproblemsolving.com/wiki/index.php/2019_AMC_10A_Problems/Problem_12",
      "source": "AMC 10",
      "difficulty": "Normal",
      "isStarred": true,
      "tags": ["Algebra", "Functions"],
      "solutionMetadata": {
        "kind": "none"
      }
    }
  ]
}
```

## Notes

- The `id` in frontmatter must match `MODULE_ID` in the problems JSON.
- `source` must be one of: AMC 8, AMC 10, AMC 12, AIME, USAMO, AoPS Wiki, MAA, Custom.
- Use `solutionMetadata.kind = "none"` for AoPS-sourced contest problems.
- Keep tags consistent across modules (case-sensitive).
