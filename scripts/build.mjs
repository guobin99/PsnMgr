/**
 * 构建入口（替代裸 `tsc --noEmit && vite build`）
 *
 * 解决的问题：
 *   esbuild 在 transform 较大文件时会先把内容写入 os.TempDir() 的临时文件，
 *   由 Go 二进制在结束时删除。Windows 上 360/Defender 的实时防护会短暂持有
 *   该文件句柄，导致删除失败并中断构建：
 *     [vite:esbuild-transpile] remove C:\...\Temp\esbuild-xxx: Access is denied.
 *
 * 应对：
 *   1) 把 TEMP / TMP / TMPDIR 固定到项目内 .tmp/build，避开系统 Temp 目录；
 *   2) 命中该错误时自动重试（安全软件释放句柄后即可通过）。
 *
 * 用法：
 *   node scripts/build.mjs          # tsc --noEmit && vite build
 *   node scripts/build.mjs dev      # vite dev
 *   node scripts/build.mjs preview  # vite preview
 */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = path.join(root, '.tmp', 'build');
const node = process.execPath;
const mode = process.argv[2] || 'build';
const passthrough = process.argv.slice(3);

mkdirSync(tmpDir, { recursive: true });

const env = {
  ...process.env,
  TEMP: tmpDir,
  TMP: tmpDir,
  TMPDIR: tmpDir,
};

// 仅在“临时文件被占用”这类可恢复错误上重试，类型错误等真正的问题立即失败
const LOCK_PATTERN = /(Access is denied|EPERM|EBUSY|resource busy|operation not permitted)/i;
const ESBUILD_TEMP_PATTERN = /esbuild-[0-9a-f]{16,}/i;
const MAX_ATTEMPTS = 4;

function runOnce(args, { stream }) {
  return new Promise((resolve) => {
    const child = spawn(node, args, {
      cwd: root,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let output = '';
    const collect = (chunk) => {
      output += chunk.toString();
      if (stream) stream.write(chunk);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', (err) => resolve({ code: 1, output: `${output}${err}` }));
    child.on('close', (code) => resolve({ code: code ?? 1, output }));
  });
}

async function runStep(label, args, stream) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    stream.write(`\n> ${label}${attempt > 1 ? `（第 ${attempt} 次尝试）` : ''}\n`);
    const result = await runOnce(args, { stream });
    if (result.code === 0) return result;

    const lockedByTempFile =
      LOCK_PATTERN.test(result.output) && /esbuild/i.test(result.output);
    if (lockedByTempFile && attempt < MAX_ATTEMPTS) {
      stream.write(
        '\n[build] 临时文件被安全软件/其他进程占用，1.5 秒后重试…\n' +
          '        建议在 360 / Windows Defender 中为该目录添加信任，可彻底避免。\n',
      );
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    return result;
  }
}

function cleanup() {
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* 清理失败不影响构建结果 */
  }
}

const tscBin = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

let exitCode = 0;

if (mode === 'build') {
  const tsc = await runStep('tsc --noEmit', [tscBin, '--noEmit'], process.stdout);
  if (tsc.code !== 0) {
    process.stderr.write('\n[build] 类型检查未通过，已终止构建。\n');
    exitCode = tsc.code;
  } else {
    const vite = await runStep('vite build', [viteBin, 'build', ...passthrough], process.stdout);
    if (vite.code !== 0) {
      process.stderr.write(
        '\n[build] 打包失败。若仍是 "Access is denied" 且指向 esbuild 临时文件，\n' +
          '        请把 E:\\zhimen\\2026Ant\\PsnMgr 与 %LOCALAPPDATA%\\Temp 加入安全软件白名单。\n',
      );
    }
    exitCode = vite.code;
  }
  cleanup();
} else if (mode === 'dev') {
  // 长驻进程，直接透传输出，不做重试
  const args = [viteBin, '--host', '127.0.0.1', ...passthrough];
  exitCode = (await runOnce(args, { stream: process.stdout })).code;
} else if (mode === 'preview') {
  const args = [viteBin, 'preview', '--host', '127.0.0.1', ...passthrough];
  exitCode = (await runOnce(args, { stream: process.stdout })).code;
} else {
  process.stderr.write(`未知模式: ${mode}（可用: build / dev / preview）\n`);
  exitCode = 1;
}

process.exit(exitCode);
