export function getUserId() {
  const existing = localStorage.getItem("userId");
  if (existing && existing.trim()) return existing.trim();
  localStorage.setItem("userId", "demo-user");
  return "demo-user";
}

export function setUserId(userId) {
  localStorage.setItem("userId", userId);
}

