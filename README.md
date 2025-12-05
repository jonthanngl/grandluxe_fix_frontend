# Frontend (Grand Luxe Hotel)

This project is a static frontend for Grand Luxe Hotel. It fetches data from an API at `https://testpemweb.vercel.app`.

## Common issues

### CORS (Cross-Origin Resource Sharing)
If your browser console shows an error like:

    Access to fetch at 'https://testpemweb.vercel.app//rooms' from origin 'http://127.0.0.1:5500' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present

Then the backend is not allowing requests from your origin. Options:

- Fix the backend: enable CORS on the server (recommended). Allow your dev origin (`http://127.0.0.1:5500`) or use `Access-Control-Allow-Origin: *` for testing.
- Use a development proxy locally (quick workaround):

  1. Ensure Node.js is installed.
  2. Run a local CORS proxy (example using `local-cors-proxy`):

```powershell
npx local-cors-proxy --proxyUrl https://testpemweb.vercel.app
```

  This starts a proxy on `http://localhost:8010` by default. The frontend contains a small "Proxy: On/Off" toggle (bottom-right) — enable it to let the app retry requests through the proxy.

- Alternative: run a server-side proxy or configure your hosting to forward requests.

### Tailwind CDN warning
Using `https://cdn.tailwindcss.com` is fine for development, but for production install Tailwind as a build step (PostCSS or Tailwind CLI). See: https://tailwindcss.com/docs/installation

## Local development tips

- Open the frontend with Live Server (or any static server). Example using `live-server` or VS Code Live Server extension.
- If you enable the proxy toggle in the UI, the app will retry failed API requests via `http://localhost:8010`.
- To permanently change the API base URL, edit `script.js` and update `API_BASE_URL`.

## Files changed by helper
- `script.js`: added `safeFetch`, proxy toggle UI, and improved error messages for rooms/admin pages.
- `README.md`: this file.

If you want, I can also add a small script to auto-run a local proxy via `npm` tasks or a PowerShell helper. Want me to add that?