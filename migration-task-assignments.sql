-- ============================================
-- Task Assignments 表結構重構
-- 解決任務進度共用問題
-- ============================================

-- 步驟 1：建立任務指派表 (Task Assignments)
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 確保同一個任務不會重複指派給同一個人
  UNIQUE(task_id, user_id) 
);

-- 步驟 2：建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_assignments_user ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_task ON task_assignments(task_id);

-- 步驟 3：啟用 RLS 並加入基本政策
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family can manage assignments" ON task_assignments;
CREATE POLICY "Family can manage assignments"
  ON task_assignments FOR ALL
  USING (true);

-- 步驟 4：將現有任務的目標對象解開，寫入新的指派表中
INSERT INTO task_assignments (task_id, user_id, progress)
SELECT 
  id AS task_id, 
  unnest(target_user_ids) AS user_id, 
  COALESCE(progress, 0) AS progress
FROM tasks
WHERE target_user_ids IS NOT NULL 
  AND array_length(target_user_ids, 1) > 0
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 步驟 5：確認資料成功轉移後，清理 tasks 表的舊欄位
ALTER TABLE tasks 
  DROP COLUMN IF EXISTS target_user_ids,
  DROP COLUMN IF EXISTS progress;

-- 完成！現在每個用戶對每個任務都有獨立的進度追蹤了
