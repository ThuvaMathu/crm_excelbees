---
trigger: always_on
---

### Security Constraints
* NEVER use the 'read_file' or 'view_file' tools on any file ending in .env, .pem, or .key.
* If you need to verify environment variables, DO NOT read the file. Instead, ask the user to confirm if a specific variable name exists.