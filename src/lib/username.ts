// mirrors handle_new_user() in the accounts migration, minus the suffix it adds when a name is taken
export const usernameFromEmail = (email: string) => {
  const name = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  return name.length >= 3 ? name : "player";
};
