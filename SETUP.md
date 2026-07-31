# CWSP-WOLF Site — GitHub Pages Setup

## What's in this folder

```
wolf-site/
  index.html          Home
  about.html          About WOLF
  liaisons.html       For Liaisons
  ai-literacies.html  AI Literacies
  get-started.html    Get Started
  css/
    style.css         All styles
  SETUP.md            This file
```

## How to publish (one-time setup, ~5 minutes)

### 1. Create the repository

Go to github.com → click the **+** icon (top right) → **New repository**

- Repository name: `CWSP-WOLF`
- Visibility: **Public** (required for free GitHub Pages)
- Leave everything else unchecked
- Click **Create repository**

### 2. Upload the files

On the new repo page, click **uploading an existing file**.

Drag the entire contents of this `wolf-site` folder into the upload area — including the `css` subfolder. Make sure the folder structure is preserved (`css/style.css` should not end up at the root level).

Click **Commit changes**.

### 3. Enable GitHub Pages

Go to your repo → **Settings** → **Pages** (left sidebar)

Under **Source**, select:
- Branch: `main`
- Folder: `/ (root)`

Click **Save**.

### 4. Your site is live

After about 60 seconds, your site will be at:

```
https://YOUR-USERNAME.github.io/CWSP-WOLF/
```

GitHub will show the URL on the Pages settings page once it's ready.

---

## Updating the site

To update content after publishing:

1. Edit the HTML file on your computer
2. Go to your repo on github.com
3. Click the file you want to update
4. Click the **pencil icon** (Edit)
5. Paste the new content
6. Click **Commit changes**

The site updates within about 30 seconds.

---

## Adding Google Doc links

On the Liaisons page (`liaisons.html`), each resource has a placeholder link (`href="#"`). Replace each `#` with the shareable link to the corresponding Google Doc.

To get a shareable link from Google Docs:
- File → Share → **Copy link**
- Make sure sharing is set to **"Anyone with the link can view"**

---

## Custom domain (optional, later)

If you later want a custom domain (e.g., `wolfcwsp.com`):
1. Buy the domain from Namecheap or Google Domains (~$12/year)
2. In your repo Settings → Pages, enter the domain under **Custom domain**
3. Follow GitHub's DNS instructions (they walk you through it)

This is entirely optional — the github.io URL works fine as a permanent address.
