// same rule as the check on profiles.username
export const USERNAME = /^[a-z0-9_]{3,24}$/;

export const cleanUsername = (value: string) => value.toLowerCase().replace(/[^a-z0-9_]/g, "");

// mirrors handle_new_user() in the accounts migration, minus the suffix it adds when a name is taken
export const usernameFromEmail = (email: string) => {
  const name = cleanUsername(email.split("@")[0]).slice(0, 20);
  return name.length >= 3 ? name : "player";
};
