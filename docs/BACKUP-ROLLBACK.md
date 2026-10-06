# Backup and rollback

The Git repository is the source of truth for publication content, configuration, uploaded media and code. Generated output in `dist/` and responsive image variants can be rebuilt.

## Repository backup

Before major changes, keep a private Git backup or mirror outside the working directory. Record the last known good commit and the active deployment in private operational notes.

Uploaded source images live in Git; generated variants do not need separate backup.

## A content or CMS change breaks the build

1. Open the GitHub Actions or deployment build log.
2. Identify the first failing commit or validation error.
3. Correct the JSON/content/image source.
4. Run `npm run check` and `npm run build`.
5. Push the correction and verify the preview before continuing.

A failed build does not replace the last successful GitHub Pages deployment.

## A successful deployment is wrong

Revert or repair the bad Git commit, then let the deployment workflow publish the corrected build. If Cloudflare is used later, its deployment rollback can be used as an operational recovery, but the Git source must still be fixed so the issue is not reintroduced.

Do not store credentials, account recovery data or DNS secrets in this repository.
