# Vercel Deployment Guide

This project is optimized for deployment on Vercel. Follow these steps to ensure a smooth deployment.

## 1. Environment Variables

Configure the following environment variables in your Vercel project settings:

| Variable                        | Description                         | Example                    |
| ------------------------------- | ----------------------------------- | -------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL           | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key         | `eyJhbGc...`               |
| `DATABASE_URL`                  | Connection string for your database | `postgresql://...`         |
| `OLLAMA_API_BASE`               | (Optional) Ollama API base URL      | `http://...`               |
| `token_tiktok`                  | (Optional) TikTok API token         | `...`                      |
| `tiktok_pixel_id`               | (Optional) TikTok Pixel ID          | `...`                      |

## 2. Supabase Optimization

- Ensure your Supabase project allowed the Vercel deployment URL in the "Redirect URLs" section if you use OAuth.
- The project uses `@supabase/ssr` with Next.js App Router for optimal session management.

## 3. Production Optimizations

The project includes the following server-side optimizations:

- `poweredByHeader: false`: Removes the `X-Powered-By` header for security.
- `compress: true`: Enables Gzip compression for faster page loads.

## 4. Troubleshooting

If the build fails on Vercel:

1. Ensure all TypeScript types are correctly defined.
2. Verify that `pnpm-lock.yaml` is up to date.
3. Check the "Logs" tab in Vercel for specific compilation errors.
