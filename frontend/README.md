# MultiVasta Frontend

This is a React + Vite frontend for the MultiVasta marketplace.

## Setup

1. Open a terminal in `d:\Desktop\Multivasta\frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend first from `d:\Desktop\Multivasta\server`:
   ```bash
   npm start
   ```
4. Start the React frontend:
   ```bash
   npm run dev
   ```

## Notes

- The frontend uses `VITE_API_BASE=/api` and forwards requests to `http://localhost:3000`.
- The backend must be running on `localhost:3000` for data to load.
- Product data is loaded from the `/api/products` endpoint.
