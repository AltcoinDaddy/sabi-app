# Agent Guidelines & Project Instructions (AGENTS.md)

This file configures the behavior and skill awareness for AI coding agents operating in this workspace.

## 🛠️ Project Tech Stack
- **Framework**: TanStack Start (React 19)
- **Routing**: TanStack Router (File-based, Type-safe)
- **Styling**: Tailwind CSS v4, Shadcn UI
- **Build Tool**: Vite

---

## 🏗️ Architecture & Best Practices

### 1. Routing (TanStack Router)
- **File-Based Routing**: All routes must be placed inside `src/routes/`. 
- **Type Safety**: Never manually cast types for navigation. Rely on the inferred route tree (`routeTree.gen.ts`). Always use the `<Link />` component or `useNavigate()` hook from `@tanstack/react-router`.
- **Search Parameters**: Use Zod for validating search params. Define a `validateSearch` schema for any route that requires query string parsing. Search params are type-safe out-of-the-box.
- **Route Generation**: Run `npm run generate-routes` if you manually add/change routes and need to update the generated tree immediately, though the Vite plugin typically handles this automatically in dev.

### 2. Server Logic (TanStack Start)
- **Server Functions**: Use `createServerFn` for server-side logic (data fetching, mutations, API calls). Do **not** use Next.js `"use server"` pragmas.
- **Explicit Boundaries**: Always keep server-only work behind explicitly defined `createServerFn` blocks. Validate inputs securely using `.validator(schema)`.
- **Route Loaders**: Use the `loader` property in route definitions. Fetch data inside the loader (often by calling a server function) and consume it in the component using `Route.useLoaderData()`.
- **SSR Mode**: TanStack Start is isomorphic and renders SSR by default. Use `ssr: true` (or `false` for SPA mode) in the `createFileRoute` options to selectively adjust server-side rendering for specific pages.

### 3. User Interface (Shadcn UI & Tailwind)
- **Shadcn Components**: The full suite of Shadcn UI components has been pre-installed in `src/components/ui/`. Eagerly use them (e.g., `Button`, `Card`, `Dialog`) instead of building primitive components from scratch.
- **Styling**: We use Tailwind CSS v4. Standard Tailwind utilities apply.
- **Theming**: The app uses CSS variables (configured in `src/styles.css`) for consistent theming (`bg-background`, `text-foreground`, etc). Stick to these semantic variables.

### 4. Intent & Agent Skills
To load or refresh specific granular skills for TanStack libraries on-demand, you can run the following agent workflows via the `@tanstack/intent` CLI:
- List all available skills: `npx -y @tanstack/intent list`
- Load TanStack Router Core skills: `npx -y @tanstack/intent load @tanstack/router-core#router-core`
- Load TanStack Start Core skills: `npx -y @tanstack/intent load @tanstack/start-client-core#start-core`

---

## 📜 Development Workflow
- **Start Dev Server**: `npm run dev`
- **Build for Production**: `npm run build`
- **Preview Production**: `npm run preview`
