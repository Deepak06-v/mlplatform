let _notify = null;

export const notificationService = {
  init(notify) {
    _notify = notify;
  },

  success(title, message) {
    _notify?.success(title, message);
  },

  error(title, message) {
    _notify?.error(title, message);
  },

  warning(title, message) {
    _notify?.warning(title, message);
  },

  info(title, message) {
    _notify?.info(title, message);
  }
};

export default notificationService;
