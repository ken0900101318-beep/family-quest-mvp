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
