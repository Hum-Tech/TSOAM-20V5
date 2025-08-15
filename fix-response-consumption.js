#!/usr/bin/env node

/**
 * Script to fix all unsafe response.json() calls in the codebase
 */

const fs = require('fs');
const path = require('path');

const clientDir = './client';

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let files = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and dist directories
      if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
        files = files.concat(findFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix unsafe response.json() calls in a file
function fixResponseCalls(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content;

  // Pattern 1: await response.json()
  const pattern1 = /await\s+response\.json\(\)/g;
  if (pattern1.test(content)) {
    newContent = newContent.replace(pattern1, 'await safeParseResponse(response)');
    modified = true;
  }

  // Pattern 2: response.json()
  const pattern2 = /(?<!await\s+)response\.json\(\)/g;
  if (pattern2.test(newContent)) {
    newContent = newContent.replace(pattern2, 'safeParseResponse(response)');
    modified = true;
  }

  // Pattern 3: const data = await someResponse.json()
  const pattern3 = /const\s+(\w+)\s*=\s*await\s+(\w+)\.json\(\)/g;
  if (pattern3.test(newContent)) {
    newContent = newContent.replace(pattern3, 'const $1 = await safeParseResponse($2)');
    modified = true;
  }

  // Add import if response parsing was modified and import doesn't exist
  if (modified && !content.includes('safeParseResponse')) {
    // Check if file already has imports from safeFetch
    if (content.includes('from "@/utils/safeFetch"') || content.includes('from "../utils/safeFetch"')) {
      // Add to existing import
      newContent = newContent.replace(
        /(import\s*{[^}]*)(}\s*from\s*["'][@\./]*utils\/safeFetch["'])/g,
        '$1, safeParseResponse$2'
      );
    } else {
      // Add new import at the top
      const importStatement = 'import { safeParseResponse } from "@/utils/safeFetch";\n';
      
      // Find the last import statement
      const importLines = newContent.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < importLines.length; i++) {
        if (importLines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex >= 0) {
        importLines.splice(lastImportIndex + 1, 0, importStatement.trim());
        newContent = importLines.join('\n');
      } else {
        newContent = importStatement + newContent;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }

  return false;
}

// Main execution
console.log('🔧 Fixing unsafe response.json() calls in client code...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━');

try {
  const files = findFiles(clientDir);
  let fixedFiles = 0;
  
  for (const file of files) {
    if (fixResponseCalls(file)) {
      fixedFiles++;
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 Fixed ${fixedFiles} files with unsafe response.json() calls`);
  
  if (fixedFiles > 0) {
    console.log('\n📝 What was fixed:');
    console.log('   • Replaced response.json() with safeParseResponse(response)');
    console.log('   • Added necessary imports to files');
    console.log('   • Prevented "Response body already consumed" errors');
    console.log('\n🚀 Next steps:');
    console.log('   1. npm run build');
    console.log('   2. Test the authentication flow');
  } else {
    console.log('✅ No unsafe response.json() calls found');
  }
  
} catch (error) {
  console.error('❌ Error fixing response calls:', error.message);
}
