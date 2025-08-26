Update your art

Upload new image to Cloudinary → copy the Secure URL.

Edit public/art.json (title/year/price/tags, and put the URL in "image").

Save, then in PowerShell:

git add .
git commit -m "Add new artwork"
git push


Netlify redeploys automatically.

Mark a piece as sold (private, only you see it)

In public/art.json, set "sold": true.

On the site click Owner (top-right) and enter your code:

universe and me are all aligned

Nice quick polish (optional)

Change the header text in src/App.jsx (“My Art Portfolio”).

Drop a favicon.ico into public/.

Add pages (About / Contact) or tabs (Paintings / Prints) — say the word and I’ll add them.

Quick fixers (if anything acts up)

Doesn’t show new art? Check art.json commas/quotes → push again → Netlify redeploy.

SSL warning? Netlify → Site → Domain management → Verify DNS → Renew/Provision certificate → Enforce HTTPS.

Domain weirdness? Ensure Zoho DNS has one CNAME: www → xotten.netlify.app