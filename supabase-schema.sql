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
