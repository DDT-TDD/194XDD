# 194XDD

A web-based arcade shooter game.

## Overview
194XDD is an HTML5 Canvas-based arcade shooter featuring dynamic gameplay, multiple stages, boss fights, powerups, and escalating difficulty.

## How to Run
There are multiple ways to run the game locally.

### Method 1: Using the provided C# Launcher (Windows)
The project includes a lightweight C# launcher that acts as a local web server to serve the game files.
1. Compile the launcher using the C# compiler:
   ```cmd
   csc.exe Launcher.cs
   ```
2. Run the generated executable:
   ```cmd
   194XDD.exe
   ```

### Method 2: Standard Local Web Server
Because the game uses ES Modules, it must be served over `http://` or `https://` (opening `index.html` directly via `file://` will not work).
You can use any local web server, for example:
- **Node.js**: `npx http-server`
- **Python 3**: `python -m http.server 8000`
- **VS Code**: Use the "Live Server" extension.

Navigate to the provided localhost URL to play.

## Release Notes
Please see the `RELEASE_NOTES.md` file for details on version updates and recent fixes.
