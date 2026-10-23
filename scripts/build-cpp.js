/**
 * Cross-platform C++ Compilation Script
 * Discipline: Design & Analysis of Algorithms (DAA)
 * 
 * Compiles bfs.cpp and dfs.cpp into standalone, high-performance native executables.
 * Automatically discovers g++ / clang++ in PATH or standard MinGW / WinLibs locations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const cppSourceDir = path.join(projectRoot, 'backend', 'src', 'algorithms', 'cpp');
const binDir = path.join(projectRoot, 'backend', 'bin');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const isWindows = process.platform === 'win32';
const exeExt = isWindows ? '.exe' : '';

function findCompiler() {
  if (process.env.CXX) return process.env.CXX;

  // Try g++ in PATH
  try {
    const res = spawnSync(isWindows ? 'where' : 'which', ['g++'], { encoding: 'utf8' });
    if (res.status === 0 && res.stdout.trim()) {
      return res.stdout.trim().split(/\r?\n/)[0];
    }
  } catch (err) {
    // continue fallback
  }

  // Try clang++ in PATH
  try {
    const res = spawnSync(isWindows ? 'where' : 'which', ['clang++'], { encoding: 'utf8' });
    if (res.status === 0 && res.stdout.trim()) {
      return res.stdout.trim().split(/\r?\n/)[0];
    }
  } catch (err) {
    // continue fallback
  }

  // Windows-specific search paths (WinLibs / MinGW)
  if (isWindows) {
    const localAppData = process.env.LOCALAPPDATA || '';
    const winLibsBase = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(winLibsBase)) {
      const dirs = fs.readdirSync(winLibsBase);
      for (const d of dirs) {
        if (d.includes('WinLibs') || d.includes('BrechtSanders')) {
          const candidate = path.join(winLibsBase, d, 'mingw64', 'bin', 'g++.exe');
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      }
    }

    const defaultPaths = [
      'C:\\mingw64\\bin\\g++.exe',
      'C:\\msys64\\mingw64\\bin\\g++.exe',
      'C:\\msys64\\ucrt64\\bin\\g++.exe',
      'C:\\MinGW\\bin\\g++.exe',
      'C:\\Program Files\\LLVM\\bin\\clang++.exe'
    ];

    for (const p of defaultPaths) {
      if (fs.existsSync(p)) return p;
    }
  }

  return 'g++';
}

const compiler = findCompiler();
console.log(`[DAA C++ Build] Using compiler: ${compiler}`);

const targets = [
  { src: 'bfs.cpp', out: `bfs${exeExt}` },
  { src: 'dfs.cpp', out: `dfs${exeExt}` }
];

const staticFlags = isWindows ? ['-static', '-static-libgcc', '-static-libstdc++'] : [];
const baseFlags = ['-O3', '-std=c++17', '-Wall', '-Wextra', ...staticFlags];

let failed = false;

for (const target of targets) {
  const sourcePath = path.join(cppSourceDir, target.src);
  const outputPath = path.join(binDir, target.out);

  console.log(`[DAA C++ Build] Compiling ${target.src} -> ${path.relative(projectRoot, outputPath)}...`);

  const compileArgs = [...baseFlags, sourcePath, '-o', outputPath];
  const result = spawnSync(compiler, compileArgs, { stdio: 'inherit' });

  if (result.status !== 0) {
    console.error(`[DAA C++ Build] Error: Failed to compile ${target.src}`);
    failed = true;
  } else {
    const stats = fs.statSync(outputPath);
    if (!isWindows) {
      try {
        fs.chmodSync(outputPath, 0o755);
      } catch (chmodErr) {
        // ignore if permissions couldn't be updated
      }
    }
    console.log(`[DAA C++ Build] Successfully built ${target.out} (${stats.size.toLocaleString()} bytes)`);
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log(`[DAA C++ Build] All native C++ graph algorithm binaries compiled successfully.`);
}
