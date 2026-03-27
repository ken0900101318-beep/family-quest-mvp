# 🚨 緊急修復：任務消失問題

## 問題

Console 錯誤：`column tasks.target_user_ids does not exist`

資料庫的 tasks 表缺少 `target_user_ids` 欄位！

## 原因

Supabase 資料庫表結構不完整，可能是：
1. 初始化 SQL 沒有正確執行
2. 或表結構被意外修改

## 解決方案

### 方案1：重新執行 Schema（推薦）

1. 登入 Supabase: https://supabase.com/dashboard/project/mnaqdossobzodcyafruy

2. 進入 SQL Editor

3. 刪除舊的 tasks 表並重建：

```sql
-- 刪除舊表（會一併刪除所有資料）
DROP TABLE IF EXISTS task_requests CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- 重建 tasks 表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  description TEXT,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'challenge', 'longterm')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  target_user_ids UUID[] DEFAULT '{}',  -- 這個欄位缺失！
  progress INTEGER DEFAULT 0,
  target INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 重建 submissions 表
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  points_awarded INTEGER
);

-- 重建 task_requests 表
CREATE TABLE task_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 建立索引
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_submissions_task_id ON submissions(task_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_task_requests_user_id ON task_requests(user_id);

-- 插入測試任務
INSERT INTO tasks (id, family_id, title, icon, points, type, target_user_ids, status) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '勇者床鋪堡壘', '🛏️', 5, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '知識圖書館', '📚', 10, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active'),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '彩虹牙刷挑戰', '🌈', 50, 'challenge', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active');

-- 插入測試提交記錄
INSERT INTO submissions (task_id, user_id, status, points_awarded, submitted_at) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000012', 'pending', 5, NOW()),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000013', 'pending', 10, NOW()),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000012', 'pending', 50, NOW());
```

4. 執行後重新載入網站

### 方案2：只加入缺失的欄位

如果不想刪除現有資料，執行這個：

```sql
-- 加入缺失的欄位
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS target_user_ids UUID[] DEFAULT '{}';

-- 更新現有任務的 target_user_ids（全部指派給哥哥和妹妹）
UPDATE tasks SET target_user_ids = '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}' WHERE target_user_ids = '{}';
```

## 驗證

執行後檢查：

```sql
-- 檢查欄位是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'target_user_ids';

-- 檢查任務數量
SELECT COUNT(*) FROM tasks WHERE family_id = '00000000-0000-0000-0000-000000000001';
```

應該顯示：
- column_name: target_user_ids, data_type: ARRAY
- 任務數量：至少 3 筆

## 結果

修復後，網站應該：
- ✅ 任務管理顯示 3 個任務
- ✅ 兒童端任務廣場顯示任務
- ✅ Console 不再有 "column does not exist" 錯誤
