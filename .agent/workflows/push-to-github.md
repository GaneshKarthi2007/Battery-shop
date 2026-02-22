---
description: How to push the project to a GitHub repository
---

Follow these steps to upload your project to GitHub.

### Prerequisites
1. [Git](https://git-scm.com/) installed on your computer.
2. A GitHub account.
3. A new empty repository created on [GitHub](https://github.com/new).

### Steps

1. **Initialize Git Repository**
   Open your terminal in the project root and run:
   ```powershell
   git init
   ```

2. **Add Files to Staging**
   This will stage all your files (excluding those in `.gitignore`).
   ```powershell
   git add .
   ```

3. **Create First Commit**
   ```powershell
   git commit -m "Initial commit: Professional Battery Shop UI implementation"
   ```

4. **Add Remote Origin**
   Copy the Repo URL from GitHub and run:
   ```powershell
   git remote add origin YOUR_REPOSITORY_URL
   ```
   *(Example: `git remote add origin https://github.com/username/battery-shop-ui.git`)*

5. **Set Branch and Push**
   ```powershell
   git branch -M main
   git push -u origin main
   ```

### Verification
Visit your GitHub repository URL in the browser to see your files uploaded.
