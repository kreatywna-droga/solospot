# G1-58 State Machine

```mermaid
stateDiagram-v2
    [*] --> CART_EMPTY: createCartSession()
    CART_EMPTY --> CART_POPULATED: addProductToCart()
    CART_POPULATED --> CART_DRAWER_OPEN: openCartDrawer()
    CART_DRAWER_OPEN --> CART_ROUTE_ACTIVE: navigateToCart()
    CART_ROUTE_ACTIVE --> CHECKOUT_SHIPPING: beginCheckout()
    CHECKOUT_SHIPPING --> PAYMENT_BOUNDARY: validateCheckoutTransition()
    PAYMENT_BOUNDARY --> ORDER_INTENT_CREATED: createOrderIntent()
    ORDER_INTENT_CREATED --> [*]: Handed off to /api/store/checkout
```
