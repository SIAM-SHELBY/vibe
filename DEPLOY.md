# GitHub Pages Deployment

To deploy this Harry Potter themed alarm clock to GitHub Pages:

1. Make sure your main files (`index.html`, `style.css`, `script.js`) are in the root directory.
2. Commit all changes:
   ```
   git add .
   git commit -m "Prepare for GitHub Pages"
   ```
3. Push to GitHub:
   ```
   git push origin main
   ```
4. On GitHub, go to your repository settings > Pages.
5. Under "Source", select the `main` branch and `/ (root)` folder.
6. Save. Your site will be published at `https://SIAM-SHELBY.github.io/vibe/`.

No build step is needed for this static site.
