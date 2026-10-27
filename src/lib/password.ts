// keeping in sync with the password settings in the supabase dashboard
export const PASSWORD_RULES = [
  { label: "8+ characters", test: (password: string) => password.length >= 8 },
  { label: "Lowercase", test: (password: string) => /[a-z]/.test(password) },
  { label: "Uppercase", test: (password: string) => /[A-Z]/.test(password) },
  { label: "Number", test: (password: string) => /\d/.test(password) },
  { label: "Symbol", test: (password: string) => /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/.test(password) },
];

export const PASSWORD_HINT =
  "Your password needs 8+ characters with a lowercase and an uppercase letter, a number and a symbol.";

export const strongEnough = (password: string) => PASSWORD_RULES.every((rule) => rule.test(password));
