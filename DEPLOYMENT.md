
# MedScan AI Deployment

## 1. Deploy the API on Render

1. Create a new **Web Service** from this repository.
2. Use the repository `render.yaml`, or set:
   - Root directory: `server`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Health check path: `/api/health`
3. Add environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=<long-random-secret>`
   - `FRONTEND_URL=https://<your-vercel-domain>`
   - `GEMINI_API_KEY=<optional>`
4. Copy the deployed Render URL, for example `https://medscan-ai-api.onrender.com`.

## 2. Deploy the client on Vercel

1. Import the same repository into Vercel.
2. Set the project root directory to `client`.
3. Vercel will use:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add this environment variable:
   - `VITE_API_URL=https://<your-render-domain>/api`
5. Deploy the project.
6. Update Render's `FRONTEND_URL` with the final Vercel URL, then redeploy the API.

The client uses the local Vite proxy when `VITE_API_URL` is omitted and uses the Render API URL in production. The JSON database and uploaded files use local disk storage, which is suitable for a demo but should be migrated to PostgreSQL and object storage before real patient data is used.
