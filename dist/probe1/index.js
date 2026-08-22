(() => {
  const t = (m) => { try { vendetta["ui.toasts"].showToast(m); } catch (e) {} };
  t("probe1: evaluado");
  return {
    onLoad() { t("probe1: onLoad ejecutado"); },
    onUnload() {},
    get Settings() { return () => null; },
  };
})();
