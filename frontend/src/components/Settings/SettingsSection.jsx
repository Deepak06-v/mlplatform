function SettingsSection({ title, icon: Icon, description, children, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          {Icon && <Icon className="w-5 h-5 text-indigo-500" />}
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        </div>
        {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-indigo-500" />}
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function SettingsRow({ label, tooltip, children }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0" title={tooltip}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export default SettingsSection;