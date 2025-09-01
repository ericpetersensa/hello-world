# Hello World (Foundry VTT v13, AppV2)

A minimal v13 module using **ApplicationV2 + HandlebarsApplicationMixin**, ES modules, and no jQuery.

## Install (local dev)
1. Clone this repo anywhere on disk.
2. In Foundry's **Data** folder, create `Data/modules/hello-world` and copy this repo's contents there *or* symlink the folder.
3. Launch Foundry, open a World, then enable **Hello World (v13, AppV2)** under **Game Settings → Manage Modules**.
4. Click the **😀 Hello World** scene control (or run a Macro with:  
   `game.modules.get('hello-world')?.api.open()`).

## Notes
- Built for **v13** using the latest AppV2 patterns (DEFAULT_OPTIONS, PARTS, actions).
- Uses DOM APIs instead of jQuery per v13 requirements.
