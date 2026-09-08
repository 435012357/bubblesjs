# Electron

Create a desktop application through the official electron-vite scaffolder. Select Others → `Electron ↗` in the CLI. The template argument preserves the current source spelling: `create-eletron-vite`.

## Create a Project

See [Quick Start](/en/guide/start/quick-start) for environment requirements and ensure pnpm is available.

```bash
pnpm create bubbles@latest desktop-app --template create-eletron-vite
```

This option delegates to the following upstream command, where you select an application template interactively:

```bash
pnpm create electron-vite@latest desktop-app
```

## Install and Run

Enter the generated project, install dependencies, and inspect its scripts:

```bash
cd desktop-app
pnpm install
pnpm run
```

Follow the upstream development instructions; run `pnpm dev` if the generated project provides a `dev` script. Build, preview, and platform packaging commands are defined by the generated `package.json`.

## Template Source

The Electron option runs an external scaffolder and has no local `template-*` directory in this repository. Framework choices, dependency versions, and packaging configuration depend on the electron-vite template downloaded at creation time.
