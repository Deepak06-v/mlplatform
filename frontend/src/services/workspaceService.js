import { workspaceAPI } from "../../services/api";

export const workspaceService = {
  getCurrent: () => workspaceAPI.current(),
  reset: () => workspaceAPI.reset(),
  getState: () => workspaceAPI.state(),
  getSection: (section) => workspaceAPI.section(section),
  updateSection: (section, data, statusKey) =>
    workspaceAPI.updateSection(section, data, statusKey),
};
