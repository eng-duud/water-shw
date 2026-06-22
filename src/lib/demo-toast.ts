import { isDemoMode } from "./demo-mode";

export function demoAlert(successMessage: string) {
  if (isDemoMode()) {
    alert(`🔶 ${successMessage}\n\n⚠️ هذا النظام للعرض فقط. لم يتم حفظ البيانات في قاعدة البيانات.`);
  } else {
    alert(successMessage);
  }
}
