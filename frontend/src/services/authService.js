import { api } from "../../services/api";

export const authService = {
  signup: (data) => api.post("/auth/signup", data),

  login: (data) => api.post("/auth/login", data),

  me: () => api.get("/auth/me"),
};
