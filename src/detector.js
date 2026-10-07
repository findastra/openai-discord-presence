import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { IDLE_MS, isRecentTask, modelLabel, projectLabel } from './presence.js';

export function resolveProject(home, thread) {
  try {
    const state = JSON.parse(readFileSync(join(home, '.codex-global-state.json'), 'utf8'));
    const assigned = state['thread-project-assignments']?.[thread.id]?.projectId;
    const project = state['local-projects']?.[assigned || thread.project_id];
    return projectLabel(project?.name);
  } catch { return ''; }
}

// Project name = the folder the chat works in (its last path part, never the full path).
// Chats without a chosen folder run in Codex's dated scratch folders (Documents\Codex\2026-10-03\lau);
// those fall back to the chat's saved Codex project name. The home folder isn't a project.
export function folderProject(cwd, userHome = homedir()) {
  const path = String(cwd ?? '').replace(/^\\\\\?\\/, '').replace(/[\\/]+$/, '');
  if (!path || /[\\/]Codex[\\/]\d{4}-\d{2}-\d{2}([\\/]|$)/i.test(path)) return '';
  if (path.toLowerCase() === userHome.replace(/[\\/]+$/, '').toLowerCase()) return '';
  return projectLabel(path.split(/[\\/]/).pop());
}

export function detectAstra(home = process.env.CODEX_HOME || join(homedir(), '.codex'), now = Date.now(), shareProject = false) {
  let db;
  try {
    const files = readdirSync(home).filter(n => /^state_\d+\.sqlite$/.test(n))
      .sort((a, b) => Number(b.match(/\d+/)[0]) - Number(a.match(/\d+/)[0]));
    if (!files.length) return { active: false, message: 'Codex not found. Use Manual mode for ChatGPT or another app.' };
    db = new DatabaseSync(join(home, files[0]), { readOnly: true });
    db.exec('PRAGMA query_only = ON; PRAGMA busy_timeout = 250;');
    // Older Codex versions have no effort column; they still get a card, just without the level.
    const hasEffort = db.prepare('PRAGMA table_info(threads)').all().some(c => c.name === 'reasoning_effort');
    const row = db.prepare(`SELECT model, updated_at${hasEffort ? ', reasoning_effort' : ''}${shareProject ? ', id, project_id, cwd' : ''} FROM threads
      WHERE archived = 0 AND source IN ('vscode', 'cli')
      AND (agent_path IS NULL OR agent_path = '/root')
      ORDER BY updated_at DESC LIMIT 1`).get();
    const active = isRecentTask(row, now);
    const model = active ? projectLabel(row.model) : '';
    const effort = active ? projectLabel(row.reasoning_effort ?? '') : '';
    const project = shareProject && active ? (folderProject(row.cwd) || resolveProject(home, row)) : '';
    // All recently active chats, newest first, each counted once.
    let projects = [];
    if (shareProject && active) {
      const recent = db.prepare(`SELECT id, project_id, cwd FROM threads
        WHERE archived = 0 AND source IN ('vscode', 'cli') AND (agent_path IS NULL OR agent_path = '/root')
        AND updated_at >= ? ORDER BY updated_at DESC LIMIT 25`).all(Math.floor((now - IDLE_MS) / 1000));
      projects = [...new Set(recent.map(r => folderProject(r.cwd) || resolveProject(home, r)).filter(Boolean))];
    }
    return { active, model, effort, project, projects, message: active ? `Recent ${modelLabel(model)} activity detected in Codex.` : 'Waiting for recent activity in Codex.' };
  } catch {
    return { active: false, message: 'Automatic detection unavailable. Manual mode still works.' };
  } finally { db?.close(); }
}
