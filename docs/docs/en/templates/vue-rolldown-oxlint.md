# Vue + Rolldown + Oxc Template (Experimental)

This template integrates Rolldown and Oxc for faster builds and stronger static analysis capabilities.

## Technology Stack

- **Rolldown**: Rust implementation of Vite, replaces standard Vite
- **Oxc**: High-performance Rust-based code checking tool
- **Vue 3 + TypeScript**: Modern Vue development experience
- **Element Plus + UnoCSS**: UI component library and atomic CSS

## Important Note

This template uses `vite.config.ts` configuration file, but actually uses Rolldown build tool (replaced via `"vite": "npm:rolldown-vite@latest"`).

## Run

```bash
pnpm install
pnpm dev
```

## Notes

This template is experimental and may be less stable than Rsbuild/standard Vite. Choose according to your needs.
