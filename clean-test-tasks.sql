-- 清除所有 test 任務

DELETE FROM submissions WHERE task_id IN (
  SELECT id FROM tasks WHERE title = 'test'
);

DELETE FROM tasks WHERE title = 'test';

-- 驗證
SELECT id, title, icon, points, type FROM tasks WHERE family_id = '00000000-0000-0000-0000-000000000001';
