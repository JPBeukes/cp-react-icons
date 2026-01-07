# Icon Browser

A simple icon browser for copying React icons (Feather icons) as PNG or SVG with customizable resolution and colors.

## Development

```bash
pnpm install
pnpm run dev
```

## Build

```bash
pnpm run build
```

## PostHog Analytics Setup

This project uses PostHog for analytics tracking. To enable analytics:

1. Create a `.env` file in the root directory (copy from `.env.example`)
2. Get your PostHog API key from [PostHog Settings](https://posthog.com/settings/project)
3. Add your API key to the `.env` file:
   ```
   PUBLIC_POSTHOG_KEY=your_posthog_project_api_key_here
   ```

If you're using a self-hosted PostHog instance, you can also set:

```
PUBLIC_POSTHOG_HOST=https://your-posthog-instance.com
```

The analytics will automatically track:

- Icon copies (with format, size, and styling details)
- Search queries and results
- Settings changes (colors, sizes, padding, etc.)
- UI interactions (sidebar, pagination, mobile menu)
- Keyboard shortcuts
- Icon pack selections
