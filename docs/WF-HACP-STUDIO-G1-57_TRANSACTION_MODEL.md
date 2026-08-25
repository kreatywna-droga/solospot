# G1-57 Transaction Model

## Transaction Principles
1. **Single Commit Per Route Action**: Mutating multi-page router operations (`switchActiveRoute`, `addPageRoute`, `removePageRoute`, `addNavigationLink`, `removeNavigationLink`, `reorderNavigationLinks`, `updateRouteMetadata`) commit exactly 1 `HistoryStack` entry.
2. **Zero Commit on Preview & Export**: `exportMultiPageSiteHtml` and `getActiveRouteSnapshot` commit 0 `HistoryStack` entries.
3. **Rollback Safety**: Failures restore initial `MultiPageSiteDocument` state without memory leaks or partial commits.
