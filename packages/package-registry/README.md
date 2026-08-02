# @web-factor/package-registry

Manifest model, validator, and dependency graph analyzer for WEB FACTOR ecosystem:
- Manifest Model (PackageManifest, PackageMetadata, PackageDependency, PackageCapability, VersionConstraint)
- Manifest Validator (SemVer format, required fields, unique IDs, capability validation)
- Dependency Graph (Graph representation, cycle detection, topological sort, dependency reports)
- Registry Report Generator (Package lists, capabilities, warnings, Markdown & JSON export)
- CLI Foundation (`package-registry validate`, `graph`, `report`)
