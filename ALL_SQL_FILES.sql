-- ============================================
-- Family Quest MVP - 完整 SQL 檔案彙總
-- 創建時間：2026-03-28
-- ============================================

-- ============================================
-- 1. supabase-schema.sql - 資料庫結構定義
-- ============================================

-- ============================================
-- supabase-schema.sql
-- ============================================
-- ========================================
-- 家庭任務管理系統 - Supabase Schema
-- ========================================

-- 1. 家庭表（Family）
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用戶表（Users）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  pin TEXT NOT NULL,
  avatar TEXT,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, pin)
);

-- 3. 任務表（Tasks）
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

-- 4. 任務提交記錄（Submissions）
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

-- 5. 商品表（Products）
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎁',
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT,
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 購買記錄（Purchases）
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivered_by UUID REFERENCES users(id)
);

-- 7. 願望清單（Wishes）
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 任務申請（Task Requests）
CREATE TABLE task_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id)
);

-- 9. 公告表（Announcements）
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 點數交易記錄（Transactions）
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'adjust')),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 索引優化
-- ========================================

CREATE INDEX idx_users_family ON users(family_id);
CREATE INDEX idx_tasks_family ON tasks(family_id);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_task ON submissions(task_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_announcements_family ON announcements(family_id);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- 啟用 RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS 政策（簡化版：同家庭可存取）
-- 註：實際部署時需要更細緻的權限控制

-- Users: 同家庭可讀取
CREATE POLICY "Users can view same family members"
  ON users FOR SELECT
  USING (true);  -- 暫時允許所有讀取，之後改為 family_id 驗證

-- Tasks: 同家庭可讀寫
CREATE POLICY "Family can manage tasks"
  ON tasks FOR ALL
  USING (true);

-- Submissions: 同家庭可讀寫
CREATE POLICY "Family can manage submissions"
  ON submissions FOR ALL
  USING (true);

-- Products: 同家庭可讀寫
CREATE POLICY "Family can manage products"
  ON products FOR ALL
  USING (true);

-- Purchases: 同家庭可讀寫
CREATE POLICY "Family can manage purchases"
  ON purchases FOR ALL
  USING (true);

-- Wishes: 同家庭可讀寫
CREATE POLICY "Family can manage wishes"
  ON wishes FOR ALL
  USING (true);

-- Task Requests: 同家庭可讀寫
CREATE POLICY "Family can manage task requests"
  ON task_requests FOR ALL
  USING (true);

-- Announcements: 同家庭可讀寫
CREATE POLICY "Family can manage announcements"
  ON announcements FOR ALL
  USING (true);

-- Transactions: 同家庭可讀寫
CREATE POLICY "Family can manage transactions"
  ON transactions FOR ALL
  USING (true);

-- ========================================
-- 初始化測試數據
-- ========================================

-- 建立測試家庭
INSERT INTO families (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', '測試家庭');

-- 建立測試用戶
INSERT INTO users (id, family_id, name, role, pin, avatar, points, level) VALUES 
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '媽媽', 'parent', '1234', '👩', 0, 1),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '哥哥', 'child', '1111', '👦', 1250, 8),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '妹妹', 'child', '2222', '👧', 850, 5);

-- 建立測試任務
INSERT INTO tasks (id, family_id, title, icon, points, type, target_user_ids, created_by) VALUES 
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '勇者床鋪堡壘', '🛏️', 5, 'daily', 
   ARRAY['00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000013'::uuid], 
   '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '知識圖書館', '📚', 10, 'daily', 
   ARRAY['00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000013'::uuid], 
   '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '彩虹牙刷挑戰', '🌈', 50, 'longterm', 
   ARRAY['00000000-0000-0000-0000-000000000013'::uuid], 
   '00000000-0000-0000-0000-000000000011');

-- 建立預設商品
INSERT INTO products (family_id, name, icon, price, category, is_default) VALUES 
  ('00000000-0000-0000-0000-000000000001', '巧克力', '🍫', 20, '零食', true),
  ('00000000-0000-0000-0000-000000000001', '冰淇淋', '🍦', 30, '零食', true),
  ('00000000-0000-0000-0000-000000000001', '玩具車', '🚗', 100, '玩具', true),
  ('00000000-0000-0000-0000-000000000001', '晚睡半小時', '🌙', 50, '特權', true),
  ('00000000-0000-0000-0000-000000000001', '選電影', '🎬', 40, '特權', true),
  ('00000000-0000-0000-0000-000000000001', '遊戲時間', '🎮', 60, '特權', true);

-- ============================================
-- supabase-init-quick.sql
-- ============================================
-- ========================================
-- 快速初始化腳本（精簡版）
-- ========================================

-- 1. 家庭表
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用戶表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  pin TEXT NOT NULL,
  avatar TEXT,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, pin)
);

-- 3. 任務表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  description TEXT,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'challenge', 'longterm')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 任務提交記錄
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  points INTEGER,
  reject_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- 5. 商品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎁',
  price INTEGER NOT NULL,
  stock INTEGER DEFAULT 999,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 購買記錄
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- 7. 許願清單
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 任務申請
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

-- 9. 公告
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 交易記錄
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 索引（效能優化）
-- ========================================

CREATE INDEX idx_users_family ON users(family_id);
CREATE INDEX idx_tasks_family ON tasks(family_id);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_task ON submissions(task_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_announcements_family ON announcements(family_id);

-- ========================================
-- RLS（Row Level Security）- 暫時允許所有
-- ========================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON families FOR ALL USING (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all" ON submissions FOR ALL USING (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true);
CREATE POLICY "Allow all" ON purchases FOR ALL USING (true);
CREATE POLICY "Allow all" ON wishes FOR ALL USING (true);
CREATE POLICY "Allow all" ON task_requests FOR ALL USING (true);
CREATE POLICY "Allow all" ON announcements FOR ALL USING (true);
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true);

-- ========================================
-- 測試資料
-- ========================================

-- 測試家庭
INSERT INTO families (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', '測試家庭');

-- 測試用戶
INSERT INTO users (id, family_id, name, role, pin, avatar, points) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '媽媽', 'parent', '1234', '👩', 0),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '哥哥', 'child', '1111', '👦', 1250),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '妹妹', 'child', '2222', '👧', 850);

-- 測試任務
INSERT INTO tasks (id, family_id, title, icon, points, type) VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '勇者床鋪堡壘', '🛏️', 5, 'daily'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '知識圖書館', '📚', 10, 'daily'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '彩虹牙刷挑戰', '🌈', 50, 'challenge');

-- 測試待審核任務（3筆）
INSERT INTO submissions (task_id, user_id, status, points) VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000012', 'pending', 5),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000013', 'pending', 10),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000012', 'pending', 50);

-- 測試商品
INSERT INTO products (family_id, name, icon, price) VALUES
  ('00000000-0000-0000-0000-000000000001', '冰淇淋券', '🍦', 50),
  ('00000000-0000-0000-0000-000000000001', '電影票', '🎬', 200),
  ('00000000-0000-0000-0000-000000000001', '遊戲時間 30分', '🎮', 100);

-- ============================================
-- rebuild-database.sql
-- ============================================
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

-- ============================================
-- CLEAN_DATABASE.sql
-- ============================================
-- 🚨 最終清理：移除所有重複任務，只保留 3 個測試任務

-- 1. 完全刪除所有任務和相關資料
DELETE FROM submissions;
DELETE FROM tasks;

-- 2. 重新插入乾淨的 3 個測試任務
INSERT INTO tasks (id, family_id, title, icon, points, type, target_user_ids, status, description) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '勇者床鋪堡壘', '🛏️', 5, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '整理床鋪，成為整潔小勇者'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '知識圖書館', '📚', 10, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '每天閱讀30分鐘'),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '彩虹牙刷挑戰', '🌈', 50, 'challenge', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '連續21天刷牙兩次');

-- 3. 重新插入測試提交記錄
INSERT INTO submissions (task_id, user_id, status, points, created_at) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000012', 'pending', 5, NOW()),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000013', 'pending', 10, NOW()),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000012', 'pending', 50, NOW());

-- 4. 驗證結果
SELECT '✅ 總任務數：' || COUNT(*)::text as result FROM tasks;
SELECT '✅ 待審核數：' || COUNT(*)::text as result FROM submissions WHERE status = 'pending';
SELECT '---' as separator;
SELECT title, icon, points, type FROM tasks ORDER BY points;

-- ============================================
-- FINAL_FIX.sql
-- ============================================
-- 🚨 最終修復：完全清空並重建所有任務相關資料

-- 1. 完全刪除所有任務和提交記錄
DELETE FROM submissions;
DELETE FROM tasks;

-- 2. 只插入 3 個乾淨的測試任務
INSERT INTO tasks (id, family_id, title, icon, points, type, target_user_ids, status, description) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '勇者床鋪堡壘', '🛏️', 5, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '整理床鋪，成為整潔小勇者'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '知識圖書館', '📚', 10, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '每天閱讀30分鐘'),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '彩虹牙刷挑戰', '🌈', 50, 'challenge', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '連續21天刷牙兩次');

-- 3. 插入 3 筆測試提交記錄
INSERT INTO submissions (task_id, user_id, status, points, created_at) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000012', 'pending', 5, NOW()),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000013', 'pending', 10, NOW()),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000012', 'pending', 50, NOW());

-- 4. 驗證（應該只有 3 筆）
SELECT '✅ 任務數量：' || COUNT(*)::text FROM tasks;
SELECT '✅ 待審核：' || COUNT(*)::text FROM submissions WHERE status = 'pending';
SELECT '---' as separator;
SELECT id, title, icon, points, type FROM tasks ORDER BY created_at;

-- ============================================
-- clean-test-tasks.sql
-- ============================================
-- 清除所有 test 任務

DELETE FROM submissions WHERE task_id IN (
  SELECT id FROM tasks WHERE title = 'test'
);

DELETE FROM tasks WHERE title = 'test';

-- 驗證
SELECT id, title, icon, points, type FROM tasks WHERE family_id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- fix-tasks.sql
-- ============================================
-- 修復任務表結構並插入測試資料

-- 1. 確保 target_user_ids 欄位存在
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS target_user_ids UUID[] DEFAULT '{}';

-- 2. 刪除所有現有任務（避免重複）
DELETE FROM submissions WHERE task_id IN (
  SELECT id FROM tasks WHERE family_id = '00000000-0000-0000-0000-000000000001'
);
DELETE FROM tasks WHERE family_id = '00000000-0000-0000-0000-000000000001';

-- 3. 插入 3 個測試任務
INSERT INTO tasks (id, family_id, title, icon, points, type, target_user_ids, status, description) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '勇者床鋪堡壘', '🛏️', 5, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '整理床鋪，成為整潔小勇者'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '知識圖書館', '📚', 10, 'daily', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '每天閱讀30分鐘'),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '彩虹牙刷挑戰', '🌈', 50, 'challenge', '{00000000-0000-0000-0000-000000000012,00000000-0000-0000-0000-000000000013}', 'active', '連續21天刷牙兩次');

-- 4. 插入測試提交記錄
INSERT INTO submissions (task_id, user_id, status, points_awarded, submitted_at) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000012', 'pending', 5, NOW()),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000013', 'pending', 10, NOW()),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000012', 'pending', 50, NOW());

-- 5. 驗證
SELECT id, title, icon, points, type, target_user_ids, status FROM tasks WHERE family_id = '00000000-0000-0000-0000-000000000001';
