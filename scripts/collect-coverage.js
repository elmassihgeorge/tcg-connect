#!/usr/bin/env node

/**
 * Coverage Collection Script
 * Aggregates coverage reports from all packages and generates combined report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGES = [
  'packages/shared',
  'apps/server',
  'apps/host',
  'apps/player'
];

const COVERAGE_DIR = path.join(__dirname, '..', 'coverage');
const COMBINED_COVERAGE_DIR = path.join(COVERAGE_DIR, 'combined');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runTests() {
  console.log('🧪 Running tests with coverage...\n');
  
  for (const pkg of PACKAGES) {
    const pkgPath = path.join(__dirname, '..', pkg);
    const pkgName = pkg.replace('/', '-');
    
    console.log(`Running tests for ${pkgName}...`);
    
    try {
      if (pkg.includes('apps/host') || pkg.includes('apps/player')) {
        // Frontend packages use Vitest
        execSync('npm run test:coverage', { 
          cwd: pkgPath, 
          stdio: 'inherit',
          env: { ...process.env, CI: 'true' }
        });
      } else {
        // Backend packages use Jest
        execSync('npm test -- --coverage', { 
          cwd: pkgPath, 
          stdio: 'inherit',
          env: { ...process.env, CI: 'true' }
        });
      }
      
      // Copy coverage reports to combined directory
      const srcCoverageDir = path.join(pkgPath, 'coverage');
      const destCoverageDir = path.join(COMBINED_COVERAGE_DIR, pkgName);
      
      if (fs.existsSync(srcCoverageDir)) {
        ensureDir(destCoverageDir);
        execSync(`cp -r "${srcCoverageDir}"/* "${destCoverageDir}"/`, { stdio: 'inherit' });
      }
      
    } catch (error) {
      console.error(`❌ Tests failed for ${pkgName}:`, error.message);
      process.exit(1);
    }
  }
}

function generateCombinedReport() {
  console.log('\n📊 Generating combined coverage report...\n');
  
  ensureDir(COMBINED_COVERAGE_DIR);
  
  // Create a simple HTML index for all coverage reports
  const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>TCGConnect - Combined Coverage Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .package { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    .package h2 { margin-top: 0; color: #333; }
    .coverage-link { display: inline-block; margin: 10px 10px 10px 0; padding: 10px 15px; 
                     background: #007cba; color: white; text-decoration: none; border-radius: 4px; }
    .coverage-link:hover { background: #005a87; }
    .stats { font-size: 14px; color: #666; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>TCGConnect - Combined Coverage Report</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  
  ${PACKAGES.map(pkg => {
    const pkgName = pkg.replace('/', '-');
    const displayName = pkg.charAt(0).toUpperCase() + pkg.slice(1).replace('/', ' ');
    
    return `
    <div class="package">
      <h2>${displayName}</h2>
      <a href="./${pkgName}/lcov-report/index.html" class="coverage-link">View Coverage Report</a>
      <div class="stats">
        <strong>Package:</strong> ${pkg}<br>
        <strong>Test Framework:</strong> ${pkg.includes('apps/host') || pkg.includes('apps/player') ? 'Vitest' : 'Jest'}
      </div>
    </div>
    `;
  }).join('')}
  
  <hr style="margin: 40px 0;">
  <p><strong>Coverage Thresholds:</strong></p>
  <ul>
    <li><strong>Shared Package:</strong> 85% (branches, functions, lines, statements)</li>
    <li><strong>Server:</strong> 75% global, 85% for game logic</li>
    <li><strong>Frontend Apps:</strong> 70% (branches, functions, lines, statements)</li>
  </ul>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(COMBINED_COVERAGE_DIR, 'index.html'), indexHtml);
  
  console.log(`✅ Combined coverage report generated at: ${COMBINED_COVERAGE_DIR}/index.html`);
}

function printSummary() {
  console.log('\n📈 Coverage Summary:\n');
  
  for (const pkg of PACKAGES) {
    const pkgName = pkg.replace('/', '-');
    const coverageJsonPath = path.join(COMBINED_COVERAGE_DIR, pkgName, 'coverage-summary.json');
    
    if (fs.existsSync(coverageJsonPath)) {
      try {
        const coverage = JSON.parse(fs.readFileSync(coverageJsonPath, 'utf8'));
        const total = coverage.total;
        
        console.log(`${pkg}:`);
        console.log(`  Lines: ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
        console.log(`  Functions: ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
        console.log(`  Branches: ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
        console.log(`  Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
        console.log('');
      } catch (error) {
        console.log(`${pkg}: Coverage data not available`);
      }
    } else {
      console.log(`${pkg}: Coverage report not found`);
    }
  }
}

function main() {
  console.log('🚀 TCGConnect Coverage Collection\n');
  
  // Clean previous coverage
  if (fs.existsSync(COVERAGE_DIR)) {
    execSync(`rm -rf "${COVERAGE_DIR}"`, { stdio: 'inherit' });
  }
  
  ensureDir(COVERAGE_DIR);
  
  runTests();
  generateCombinedReport();
  printSummary();
  
  console.log('🎉 Coverage collection complete!');
  console.log(`📁 Reports available at: ${COMBINED_COVERAGE_DIR}`);
}

if (require.main === module) {
  main();
}

module.exports = { main, runTests, generateCombinedReport, printSummary };