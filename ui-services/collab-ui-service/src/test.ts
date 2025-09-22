// This code violates two ESLint rules:
// 1. 'no-unused-vars': The 'unusedVar' is declared but not used anywhere.
// 2. 'semi': Missing semicolon at the end of some lines.

function greet(name) {
  const unusedVar = 42; // Unused variable
  console.log("Hello " + name); // Missing semicolon
}

greet("Alice");
