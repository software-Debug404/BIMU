import { runCombatTests } from './combat.test.mjs';

const report = await runCombatTests();
for (const result of report.results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
}
console.log(`\n${report.passed}/${report.total} testes passaram.`);
if (report.passed !== report.total) process.exitCode = 1;
