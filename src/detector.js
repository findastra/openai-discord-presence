import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { isRecentTask, modelLabel, projectLabel } from './presence.js';

export function resolveProject(home, thread) {
  try {
    const state = JSON.parse(readFileSync(join(home, '.codex-global-state.json'), 'utf8'));
    const assigned = state['thread-project-assignments']?.[thread.id]?.projectId;
    const project = state['local-projects']?.[assigned || thread.project_id];
    return projectLabel(project?.name);
  } catch { return ''; }
}

// Project names come from the saved project assignment, never a workspace basename.
export function detectAstra(home = process.env.CODEX_HOME || join(homedir(), '.codex'), now = Date.now(), shareProject = false) {
  let db;
  try {
    const files = readdirSync(home).filter(n => /^state_\d+\.sqlite$/.test(n))
      .sort((a, b) => Number(b.match(/\d+/)[0]) - Number(a.match(/\d+/)[0]));
    if (!files.length) return { active: false, message: 'Codex not found. Use Manual mode for ChatGPT or another app.' };
    db = new DatabaseSync(join(home, files[0]), { readOnly: true });
    db.exec('PRAGMA query_only = ON; PRAGMA busy_timeout = 250;');
    const row = db.prepare(`SELECT model, updated_at${shareProject ? ', id, project_id' : ''} FROM threads
      WHERE archived = 0 AND source IN ('vscode', 'cli')
      AND (agent_path IS NULL OR agent_path = '/root')
      ORDER BY updated_at DESC LIMIT 1`).get();
    const active = isRecentTask(row, now);
    const model = active ? projectLabel(row.model) : '';
    const project = shareProject && active ? resolveProject(home, row) : '';
    return { active, model, project, message: active ? `Recent ${modelLabel(model)} activity detected in Codex.` : 'Waiting for recent activity in Codex.' };
  } catch {
    return { active: false, message: 'Automatic detection unavailable. Manual mode still works.' };
  } finally { db?.close(); }
}
