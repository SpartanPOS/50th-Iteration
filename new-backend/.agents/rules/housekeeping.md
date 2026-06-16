---
trigger: always_on
---

- **Auto-Cleanup**: After every write to a file, delete any extra empty lines, (max of 1 in a row)
- **Dependency Auditing**: Scan for unused imports and update your package.json
- **Documentation**: Automatically update the `docs/architecture.md` file whenever major physics parameters are altered.
