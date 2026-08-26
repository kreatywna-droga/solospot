# UI Foundation API Reference — Web Factor Authoring Studio v1.1 (Sprint S2)

## Overview

Sprint S2 introduces the Visual Studio UI Framework & UI Foundation inside `packages/authoring-studio/src/ui/`.

All exported interfaces and functions operate strictly on pure data models without DOM, React, or Browser APIs.

---

## UI Foundation Export Registry

### 1. Dock & Layout System (`DockManager.ts`, `WorkspaceLayout.ts`, `PanelRegistry.ts`, `WorkspacePresets.ts`)
- `DockPosition`: Docking position enum (`left`, `right`, `top`, `bottom`, `center`, `floating`)
- `FloatingPanelState`: Floating window state descriptor
- `DockNode`: Split layout node model
- `DockLayoutState`: Complete dock layout model
- `createDockLayoutState(nodes)`: Creates dock layout state
- `activatePanelInDock(state, nodeId, panelId)`: Activates panel in dock node immutably
- `createWorkspaceLayoutModel(presetId, dockLayout)`: Creates main workspace layout descriptor
- `createPanelRegistryState(panels)`: Creates panel registry state
- `ALL_WORKSPACE_PRESETS`: Predefined layout presets (`PRESET_DEFAULT`, `PRESET_ANIMATION`)

### 2. Theme System (`ThemeContracts.ts`, `DesignTokens.ts`, `IconRegistry.ts`)
- `ThemeMode`: Theme mode (`dark`, `light`, `system`)
- `ColorScheme`: Color tokens interface
- `ThemeDescriptor`: Complete theme model
- `STANDARD_THEMES`: Predefined themes (`DARK_THEME_COLOR_SCHEME`, `LIGHT_THEME_COLOR_SCHEME`)
- `STANDARD_DESIGN_TOKENS`: Studio typography, spacing, radius, and shadow tokens
- `IconDescriptor`: Icon metadata descriptor
- `STANDARD_STUDIO_ICONS` / `getIconDescriptor(iconId)`: Icon registry

### 3. Command Palette & Search (`CommandPalette.ts`, `CommandRegistry.ts`)
- `StudioCommand`: Studio command descriptor
- `CommandRegistryState`: Command registry state
- `createCommandRegistryState(commands)`: Creates command registry state
- `registerStudioCommand(state, command)`: Registers studio command immutably
- `searchCommandPalette(commands, query)`: Executes global command palette search

### 4. Workspace Preferences & Settings (`UserSettings.ts`, `KeyboardProfiles.ts`, `LayoutPersistence.ts`)
- `UserSettingsModel`: User preferences descriptor
- `DEFAULT_USER_SETTINGS`: Default user settings model
- `updateUserSettings(settings, updates)`: Updates user settings immutably
- `KeyboardProfile`: Custom keyboard shortcuts profile descriptor
- `STANDARD_KEYBOARD_PROFILE`: Default keyboard profile
- `serializeWorkspaceLayout(userId, layout)`: Serializes workspace layout payload
- `deserializeWorkspaceLayout(serialized)`: Deserializes workspace layout payload
