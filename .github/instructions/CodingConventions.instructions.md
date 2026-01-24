---
applyTo: '**/*.ts*'
---
Always use the ; statement separator.
Always use the , separator in type declarations and enum declarations.
Prefer destructuring over direct property access.
Use explicit return types for all functions and methods.
Prefer small functions outside of React components to inline functions inside React components. Also write these small functions in separate files, grouped by feature or functionality.
Do not log to the console in production code - you are allowed to use console.log for debugging during development, but make sure to remove these statements before committing your code. If a message needs to be conveyed to the user, use proper UI elements instead, like a transient notification or a modal dialog in case the user needs to take an action.
