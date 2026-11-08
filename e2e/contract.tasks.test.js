import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call, TASKS, errShape } from './lib.js';

const isTask = (t) =>
  t && typeof t._id === 'string' && typeof t.title === 'string' &&
  ['todo', 'in_progress', 'done'].includes(t.status) && ['low', 'medium', 'high'].includes(t.priority) &&
  typeof t.createdAt === 'string' && typeof t.updatedAt === 'string';

let id;

test('GET /health → 200 {ok:true}', async () => {
  const r = await call(TASKS, 'GET', '/health');
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { ok: true });
});

test('POST /tasks → 201 Task', async () => {
  const r = await call(TASKS, 'POST', '/tasks', { body: { title: 'e2e task', description: 'd', priority: 'high' } });
  assert.equal(r.status, 201);
  assert.ok(isTask(r.json), r.text);
  assert.equal(r.json.status, 'todo'); // default
  id = r.json._id;
});

test('POST /tasks invalid → 400 error shape', async () => {
  for (const body of [{}, { title: '' }, { title: 'x'.repeat(121) }, { title: 'ok', status: 'nope' }, { title: 'ok', description: 'x'.repeat(1001) }]) {
    const r = await call(TASKS, 'POST', '/tasks', { body });
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 60));
    assert.ok(errShape(r.json), r.text);
  }
});

test('GET /tasks list shape + filters + pagination', async () => {
  const r = await call(TASKS, 'GET', '/tasks?status=todo&q=e2e&page=1&limit=5');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.items));
  assert.equal(typeof r.json.total, 'number');
  assert.equal(r.json.page, 1);
  assert.ok(r.json.items.length <= 5);
  r.json.items.forEach((t) => assert.ok(isTask(t)));
});

test('GET /tasks/:id → 200; unknown → 404; malformed → 400', async () => {
  assert.equal((await call(TASKS, 'GET', `/tasks/${id}`)).status, 200);
  const missing = await call(TASKS, 'GET', '/tasks/000000000000000000000000');
  assert.equal(missing.status, 404);
  assert.ok(errShape(missing.json));
  assert.equal((await call(TASKS, 'GET', '/tasks/not-an-id')).status, 400);
});

test('PATCH /tasks/:id → 200 Task, updates fields', async () => {
  const r = await call(TASKS, 'PATCH', `/tasks/${id}`, { body: { status: 'done' } });
  assert.equal(r.status, 200);
  assert.equal(r.json.status, 'done');
  assert.equal(r.json.title, 'e2e task');
  assert.equal((await call(TASKS, 'PATCH', `/tasks/${id}`, { body: { status: 'bogus' } })).status, 400);
});

test('DELETE /tasks/:id → 204 then 404', async () => {
  const r = await call(TASKS, 'DELETE', `/tasks/${id}`);
  assert.equal(r.status, 204);
  assert.equal((await call(TASKS, 'GET', `/tasks/${id}`)).status, 404);
});

test('unknown route → 404 error shape; bad JSON → 400', async () => {
  const r = await call(TASKS, 'GET', '/nope');
  assert.equal(r.status, 404);
  assert.ok(errShape(r.json));
  const bad = await call(TASKS, 'POST', '/tasks', { raw: '{bad', headers: { 'Content-Type': 'application/json' } });
  assert.equal(bad.status, 400);
});

test('oversized body (>10kb) rejected', async () => {
  const r = await call(TASKS, 'POST', '/tasks', { body: { title: 'x', description: 'y'.repeat(20000) } });
  assert.ok([400, 413].includes(r.status), `got ${r.status}`);
});
