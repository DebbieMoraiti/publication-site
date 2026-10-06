# Backup and rollback

The Git repository is the source for content JSON, uploaded media, site
configuration and code. Cloudflare holds deployed versions; Formspree holds
submissions. Pages CMS collaborator invitations and external account/DNS
settings are separate from the repository. Back up each service according
to its owner and retention needs; a Git backup alone does not include those
other records.

## Make and check a repository backup

- Keep a private, access-controlled Git backup outside the working directory.
  One method is `git clone --mirror <client-repository-url> <backup-directory>`.
  Check that the backup has the expected branches and commits. Repeat the
  backup before major changes and test restoration to a temporary private
  repository or location. Preserve uploaded images in Git; generated image
  variants and `dist/` can be rebuilt.
- Record the client repository URL, last good commit, Cloudflare Worker name,
  active deployment/version and domain in private operational notes. Export
  Formspree submissions if the client needs their own retained copy.
- Keep account recovery and DNS access details in a secure system outside Git.

## A CMS save breaks the build

Open the Cloudflare build log and identify the bad commit. Correct the JSON
or uploaded file in the client branch, run `npm run check` and `npm run build`,
and save/push the correction. A failed build does not itself promote a new
successful production version. Confirm the active live site, then review the
next preview before merging or saving another production change.

## A successful deployment is wrong

Use **Workers & Pages → your Worker → Deployments**, locate the last known
good deployed version, and choose its **Rollback** action. This immediately
changes the active deployment; verify the public domain after doing so.
Rollback is an operational recovery, not a Git source fix: revert or repair
the bad change in the client's repository too, so the next `main` build does
not reintroduce it. For a content-only mistake, restore the correct file from
a known good Git commit through a reviewed change.

Cloudflare's [rollback guide](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
describes the dashboard path and version limits. GitHub's
[repository backup guide](https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository)
describes Git backups and restoration. The default starter has static assets
only; if a future client adds Cloudflare data bindings, review the rollback
limits for those resources separately.
