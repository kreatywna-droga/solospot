# G1-58 Transaction Model

## Transaction Principles
1. **Single Commit Per Route Navigation**: `navigateToCart` and `beginCheckout` commit exactly 1 `HistoryStack` entry via `MultiPageNavigationRouterEngine`.
2. **Zero Commit on Drawer Toggle & Calculations**: `openCartDrawer`, `closeCartDrawer`, `calculateCartTotals`, and `getCartItemCount` commit 0 `HistoryStack` entries.
3. **Integer Cents Precision**: All monetary operations work in integer cents to eliminate floating-point rounding errors.
