# How to create the demo account (no coding required)

You **do not** need PuTTY, a terminal, or any coding. You only need:

1. **DigitalOcean dashboard** (in your browser)
2. **Your live site** (in your browser)

---

## Step 1: Set the secret in DigitalOcean

1. Log in to [DigitalOcean](https://cloud.digitalocean.com).
2. Open your **App** (FertilityOS).
3. Go to **Settings** → **App-Level Environment Variables** (or the env vars for your website component).
4. Click **Edit** or **Add variable**.
5. Add:
   - **Name:** `SEED_DEMO_SECRET`
   - **Value:** any secret phrase you choose (e.g. `myDemoSecret2024`).  
     Keep it private; you will use it once in the next step.
6. Save. Trigger a **Redeploy** so the new variable is applied (e.g. from the App’s **Actions** or **Deploy** tab).

---

## Step 2: Run the demo seed in your browser

After the app has finished redeploying:

1. Open your browser (Chrome, Edge, Firefox, etc.).
2. In the address bar, type your site URL, then add the path and your secret:
   ```
   https://www.thefertilityos.com/api/admin/seed-demo?secret=myDemoSecret2024
   ```
   Replace `myDemoSecret2024` with the exact value you set for `SEED_DEMO_SECRET`.
3. Press Enter.
4. You should see a page saying **“Demo account ready”** and a **“Go to Sign in”** button.
5. Click **Go to Sign in** (or go to https://www.thefertilityos.com/login).
6. Sign in with:
   - **Email:** `thefertilityos@gmail.com`
   - **Password:** `demo`

---

## If login still says "Invalid email or password"

1. Open the seed URL again: `https://www.thefertilityos.com/api/admin/seed-demo?secret=YOUR_SECRET`
2. You **must** see the page titled **"Demo account ready"** (with Email: thefertilityos@gmail.com, Password: demo).  
   - If you see **"Seed not configured"** → `SEED_DEMO_SECRET` is not set in DigitalOcean. Add it and redeploy, then try the URL again.  
   - If you see **"Forbidden"** → the `?secret=` value does not match `SEED_DEMO_SECRET`. Copy the value from DigitalOcean and try again.  
3. After you see "Demo account ready", try signing in again with **thefertilityos@gmail.com** / **demo**.

---

## Summary

- **No PuTTY** – not needed.
- **No terminal or commands** – you only use the browser and the DigitalOcean website.
- **Secret** – set `SEED_DEMO_SECRET` in DigitalOcean, then open the link with `?secret=YOUR_SECRET` once to create the demo account.
