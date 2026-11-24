import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync("token");
      if (saved) setToken(saved);
      setBooting(false);
    })();
  }, []);

  async function authenticate(path, email, password) {
    const { data } = await api.post(path, { email, password });
    await SecureStore.setItemAsync("token", data.token);
    setToken(data.token);
  }

  const login = (e, p) => authenticate("/auth/login", e, p);
  const register = (e, p) => authenticate("/auth/register", e, p);
  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, booting, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}