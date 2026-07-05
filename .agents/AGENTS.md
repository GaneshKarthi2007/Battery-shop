# Git Workflow & Development Guidelines

1. **Repository Workflow**:
   - Direct pushes to the `main` branch are no longer allowed.
   - All changes must follow the Pull Request (PR) process:
     - Create a feature branch from `main`.
     - Implement the required changes in the feature branch.
     - Submit a Pull Request (PR) for review.
     - The PR must be reviewed and approved before merging into the `main` branch.
     - Only reviewed and approved code should be checked into `main`.

2. **Testing Requirements**:
   - Every module or feature developed must include appropriate unit test cases.
   - Unit tests should cover the core business logic.
   - New features should not be merged without corresponding test coverage.
   - Ensure all tests pass before raising a Pull Request.

3. **Definition of Done**:
   - Feature implementation completed.
   - Unit test cases written and passing.
   - Code review completed.
   - Pull Request approved and merged into `main`.
