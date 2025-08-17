// src/utils/auth.js
export const isAuthenticated = () => {
  return !!localStorage.getItem("token"); // or check from context / cookies
};
