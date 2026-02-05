# Financial Dashboard

This is a financial dashboard built with Next.js, Tailwind CSS, and Papaparse. It visualizes Cash Flow (CF), Profit & Loss (PL), and Balance Sheet (BS) data from CSV files.

## Features

- **3 Main Tabs**: Cash Flow, Profit & Loss, Balance Sheet.
- **CSV Driven**: Data is loaded dynamically from CSV files located in the `public/data/` directory.
- **Excel-like Interface**: Sticky headers and columns for easy viewing of large datasets.
- **Visual Cues**: Negative numbers are automatically highlighted in red.

## How to Update Data

To update the dashboard data, simply replace the CSV files in the `public/data` folder:

1. `public/data/cf.csv` - For Cash Flow
2. `public/data/pl.csv` - For Profit & Loss
3. `public/data/bs.csv` - For Balance Sheet

**Note:** Ensure the CSV format matches the existing structure (First column as category, subsequent columns as time periods).

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment on Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Go to [Vercel](https://vercel.com) and sign up/login.
3. Click "Add New Project" and import your repository.
4. Keep the default settings and click "Deploy".
