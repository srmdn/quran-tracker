# Contributing

## Quick Rules

- Keep pull requests focused and reviewable.
- Humans own final code, tests, docs, and commits.
- Disclose meaningful AI assistance in PR descriptions.

## AI Contribution Policy

AI-assisted work is allowed but requires human accountability.

Required in each PR:
- AI tools/models used (if any)
- Files or sections materially influenced by AI
- Human validation performed (tests, review, security/license checks)

Prohibited in commit history:
- AI branding lines and AI co-author trailers
- Automated attribution text injected by AI tools (e.g. "Co-authored-by: Claude", "Generated with Claude Code")

Install the pre-commit hook to catch issues locally before push:

```sh
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Or run the check manually:

```sh
scripts/check-commit-attribution.sh
```

## Writing Conventions

Apply to commit messages, docs, README, and any written content:

- No em dashes (`—`). Use a colon, semicolon, or rewrite the sentence.
- No AI co-author trailers or AI branding in any written output.

## Testing

Run the test suite before every commit:

```sh
bun test
```

All tests must pass. Write tests for new logic in the same commit, not as a follow-up.

## Recovery if Attribution Check Fails

- Last commit only:

```sh
git commit --amend
```

- Earlier commits:

```sh
git rebase -i <base-commit>
```

Detailed runbook: `docs/AI-COMMIT-CLEANUP.md`
