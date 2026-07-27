# DNX Frontend — AI Life Services Platform

React + Vite + TypeScript + Redux Toolkit + RTK Query.

> Mirrors the **mobile** app's conventions so the two stay consistent: the
> `redux/api/*` slices are nearly identical, and the "screen" pattern becomes
> the "page" pattern (JSX-only component + logic hook + types + styles).

## Getting started

```bash
npm install
cp .env.example .env       # set VITE_API_BASE_URL to your backend
npm run dev                # http://localhost:5173
```

## Folder structure

```
src/
├── api/           # endpoints.ts (BASE_URL + all paths), apiConfig.ts (axios + axiosBaseQuery)
├── assets/        # images/
├── components/    # Reusable UI — one folder per component (Button example)
├── contexts/      # React contexts
├── hooks/         # Shared custom hooks
├── pages/         # One folder per page (5-file pattern)
├── redux/
│   ├── store.ts   # configureStore
│   ├── hooks.ts   # useAppDispatch / useAppSelector
│   ├── api/       # RTK Query slices, one folder per domain (auth, category, provider)
│   └── slices/    # Local-state slices (userSlice)
├── routes/        # index.tsx — React Router config + Protected route
├── styles/        # theme.css (design tokens as CSS variables), global.css
├── types/         # Global shared types
└── utils/         # theme.ts, constants.ts
```

## The page pattern (copy for every new page)

```
PageName/
├── PageName.tsx         # JSX ONLY — no data logic
├── usePageName.ts       # ALL state, effects, handlers, API calls
├── types.ts             # ALL interfaces
├── PageName.module.css  # ALL styles (scoped CSS module)
├── validation.ts        # (forms only)
└── index.ts             # barrel export
```

## Rules

- `.tsx` files hold JSX only — logic goes in `use*.ts`.
- All types in `types.ts`, all styles in `PageName.module.css`.
- No hardcoded colors/sizes — reference the CSS variables from `styles/theme.css`.
- Server data → RTK Query (`redux/api/*`). Local/global UI state → slice (`redux/slices/*`).
- Read the base URL only in `api/endpoints.ts` via `import.meta.env.VITE_*`.
- Import via the `@/` alias, never `../../..`.
- Use `useAppDispatch` / `useAppSelector`, never the plain react-redux hooks.

## Notes

- CSS Modules (`*.module.css`) are used for styles — scoped per component, no
  class-name collisions. Design tokens live once in `styles/theme.css`.
- For SEO-critical public provider pages later, consider migrating to Next.js;
  the `redux/api` + `components` layers port over unchanged.
```
