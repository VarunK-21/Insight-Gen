export type UserProfile = {
  name: string;
  email: string;
  createdAt: number;
};

type StoredUser = UserProfile & {
  password: string;
};

const USERS_STORAGE_KEY = "insight_weaver_users";
const CURRENT_USER_KEY = "insight_weaver_current_user";

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function registerUser(payload: { name: string; email: string; password: string }): UserProfile {
  const users = getStoredUsers();
  const existing = users.find((user) => user.email.toLowerCase() === payload.email.toLowerCase());
  if (existing) {
    throw new Error("An account with this email already exists.");
  }
  const newUser: StoredUser = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    createdAt: Date.now(),
  };
  users.unshift(newUser);
  saveStoredUsers(users);
  setCurrentUser(newUser);
  return newUser;
}

export function authenticateUser(payload: { email: string; password: string }): UserProfile {
  const users = getStoredUsers();
  const user = users.find((item) => item.email.toLowerCase() === payload.email.toLowerCase());
  if (!user || user.password !== payload.password) {
    throw new Error("Invalid email or password.");
  }
  setCurrentUser(user);
  return user;
}

export function updatePassword(payload: { email: string; currentPassword: string; nextPassword: string }): void {
  const users = getStoredUsers();
  const index = users.findIndex((item) => item.email.toLowerCase() === payload.email.toLowerCase());
  if (index < 0) {
    throw new Error("Account not found.");
  }
  if (users[index].password !== payload.currentPassword) {
    throw new Error("Current password is incorrect.");
  }
  users[index] = { ...users[index], password: payload.nextPassword };
  saveStoredUsers(users);
  setCurrentUser(users[index]);
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}
