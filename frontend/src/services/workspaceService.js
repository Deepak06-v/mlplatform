import { workspaceAPI } from "../../services/api";

export const workspaceService = {
  getCurrent: () => workspaceAPI.current(),
  reset: () => workspaceAPI.reset(),
};
