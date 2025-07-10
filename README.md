# garde-fou
Guarde-Fou: Wrap paid API calls and prevent unnecessary costly calls outside predefined scenarii

Garde-Fou (“guardrail” in French) is a lightweight, language-agnostic toolkit for wrapping any paid-API client to:

- **Enforce call quotas**  
  – Total-calls per instance (e.g. max 5 calls)  
- **Throttle by rate window**  
  – Sliding-window limits (e.g. 10 calls/min, 500 calls/day)  
- **Detect duplicates**  
  – Hash args/kwargs; block or warn on identical requests  
- **Plug in custom policies**  
  – Circuit-breakers, spend-budget checks, cache responses, etc.

---

## 📂 Repository Layout (Monorepo)

```
garde-fou/
├── python/ # Python package
│ ├── src/gardefou/ # core modules
│ ├── tests/
│ └── setup.py
├── typescript/ # TypeScript/JavaScript package
│ ├── src/
│ ├── tests/
│ └── package.json
├── .github/ # CI workflows for Python & TS
└── README.md # You are here
```
