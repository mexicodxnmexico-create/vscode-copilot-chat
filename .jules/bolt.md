## 2024-03-24 - Optimize sequential SDK model mapping to concurrent execution
**Learning:** Sequential async iterations over `Set` objects can introduce significant latency blockages, especially when making network/database lookups. Iterating with `for...of` forces sequential awaiting.
**Action:** Convert the `Set` to an array using `Array.from()` and use `.map()` paired with `Promise.all()` to achieve concurrent async execution, which resolves the O(n) latency scaling issue into an O(1) concurrent latency profile.
