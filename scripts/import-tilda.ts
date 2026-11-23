/** Импорт каталога из Tilda: npm run import:tilda. Логика — в src/lib/import-tilda.ts (её же вызывает админка). */
import { runTildaImport } from "../src/lib/import-tilda";

runTildaImport()
  .then((r) => {
    console.log(`Получено из Tilda: ${r.total}`);
    console.log(`Создано: ${r.created}, обновлено: ${r.updated}, с ручными правками: ${r.locked}, отключено: ${r.deactivated}`);
    if (r.warnings.length) console.log(`Предупреждения (${r.warnings.length}):\n- ${r.warnings.join("\n- ")}`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });