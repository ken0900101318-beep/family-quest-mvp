-- 完整重建資料庫（修正所有欄位名稱）

-- ========== 1. 刪除所有舊表（保留 families, users, products） ==========
DROP TABLE IF EXISTS task_requests CASCADE;
DROP TABLE IF EXISTS wishes CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;

-- ========== 2. 重建 tasks 表 ==========
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  description TEXT,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'challenge', 'longterm')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  target_user_ids UUID[] DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  target INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ========== 3. 重建 submissions 表 ==========
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  points INTEGER,
  reject_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id)
);

-- ========== 4. 重建 purchases 表 ==========
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivered_by UUID REFERENCES users(id)
);

-- ========== 5. 重建 wishes 表 ==========
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  estimated_points INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id)
);

-- ========== 6. 重建 task_requests 表 ==========
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

-- ========== 7. 重建 transactions 表 ==========
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== 8. 重建 announcements 表 ==========
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== 9. 建立索引 ==========
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_submissions_task_id ON submissions(task_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_wishes_user_id ON wishes(user_id);
CREATE INDEX idx_task_requests_user_id ON task_requests(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_announcements_family_id ON announcements(family_id);

-- ========== 10. 插入測試任務 ==========
INSERT INTO tasks (id, family_id, title, icon, points, type, target_user_ids, status, description) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '勇者床鋪堡壘', '🛏️', 5, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '整理床鋪，成為整潔小勇者'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '知識圖書館', '📚', 10, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '每天閱讀30分鐘'),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '彩虹牙刷挑戰', '🌈', 50, 'challenge', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '連續21天刷牙兩次');

-- ========== 11. 插入測試提交記錄 ==========
INSERT INTO submissions (task_id, user_id, status, points, created_at) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000012', 'pending', 5, NOW()),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000013', 'pending', 10, NOW()),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000012', 'pending', 50, NOW());

-- ========== 12. 驗證 ==========
SELECT 'Tasks count:' as check_name, COUNT(*)::text as result FROM tasks
UNION ALL
SELECT 'Submissions count:', COUNT(*)::text FROM submissions
UNION ALL
SELECT 'Products count:', COUNT(*)::text FROM products;
