-- ============================================
-- 资料库全面优化脚本
-- 执行日期：2026-03-30
-- ============================================

-- ========================================
-- 第一部分：检查并修复缺失栏位
-- ========================================

-- 1. 确认 transactions 表有 source 和 source_id
DO $$ 
BEGIN
    -- 检查 source 栏位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'source'
    ) THEN
        ALTER TABLE transactions ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
        RAISE NOTICE 'Added source column to transactions';
    END IF;
    
    -- 检查 source_id 栏位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'source_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN source_id UUID;
        RAISE NOTICE 'Added source_id column to transactions';
    END IF;
END $$;

-- 2. 确认 purchases 表状态值正确
DO $$
BEGIN
    -- 检查是否有 'completed' 状态（应该是 'delivered'）
    IF EXISTS (
        SELECT 1 FROM purchases WHERE status = 'completed'
    ) THEN
        UPDATE purchases SET status = 'delivered' WHERE status = 'completed';
        RAISE NOTICE 'Updated purchases status from completed to delivered';
    END IF;
END $$;

-- ========================================
-- 第二部分：索引优化
-- ========================================

-- 删除可能重复的索引
DROP INDEX IF EXISTS idx_users_family;
DROP INDEX IF EXISTS idx_tasks_family;
DROP INDEX IF EXISTS idx_submissions_user;
DROP INDEX IF EXISTS idx_submissions_task;
DROP INDEX IF EXISTS idx_submissions_status;
DROP INDEX IF EXISTS idx_purchases_user;
DROP INDEX IF EXISTS idx_transactions_user;
DROP INDEX IF EXISTS idx_announcements_family;

-- 重新创建优化的索引
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_pin ON users(family_id, pin); -- 登入查询优化

CREATE INDEX IF NOT EXISTS idx_tasks_family_id ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status) WHERE status = 'active'; -- 部分索引，只索引活跃任务

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_pending ON submissions(status, created_at) WHERE status = 'pending'; -- 待审核查询优化

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC); -- 时间排序优化

CREATE INDEX IF NOT EXISTS idx_announcements_family_id ON announcements(family_id);

CREATE INDEX IF NOT EXISTS idx_products_family_status ON products(family_id, status) WHERE status = 'active';

-- ========================================
-- 第三部分：查询性能优化
-- ========================================

-- 分析表以更新统计资讯
ANALYZE users;
ANALYZE tasks;
ANALYZE submissions;
ANALYZE purchases;
ANALYZE transactions;
ANALYZE products;
ANALYZE announcements;
ANALYZE wishes;

-- ========================================
-- 第四部分：资料完整性检查
-- ========================================

-- 检查孤立记录（没有对应父记录的记录）
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    -- 检查 submissions 中的孤立 task_id
    SELECT COUNT(*) INTO orphan_count
    FROM submissions s
    WHERE NOT EXISTS (SELECT 1 FROM tasks t WHERE t.id = s.task_id);
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'Found % orphaned submissions (task_id not exists)', orphan_count;
    END IF;
    
    -- 检查 purchases 中的孤立 product_id
    SELECT COUNT(*) INTO orphan_count
    FROM purchases p
    WHERE NOT EXISTS (SELECT 1 FROM products pr WHERE pr.id = p.product_id);
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'Found % orphaned purchases (product_id not exists)', orphan_count;
    END IF;
END $$;

-- ========================================
-- 第五部分：清理和维护
-- ========================================

-- 删除重复的 submissions（同一用户、同一任务、同一天、多个pending）
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY task_id, user_id, DATE(created_at), status
        ORDER BY created_at DESC
    ) as rn
    FROM submissions
    WHERE status = 'pending'
)
DELETE FROM submissions
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- ========================================
-- 第六部分：性能监控视图
-- ========================================

-- 创建统计查询视图（便于监控）
CREATE OR REPLACE VIEW v_database_stats AS
SELECT 
    'users' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week
FROM users
UNION ALL
SELECT 
    'tasks',
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')
FROM tasks
UNION ALL
SELECT 
    'submissions',
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')
FROM submissions
UNION ALL
SELECT 
    'transactions',
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')
FROM transactions;

-- ========================================
-- 第七部分：重新载入 Schema Cache
-- ========================================

NOTIFY pgrst, 'reload schema';

-- ========================================
-- 完成提示
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '资料库优化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已完成：';
    RAISE NOTICE '1. 栏位检查和修复';
    RAISE NOTICE '2. 索引优化';
    RAISE NOTICE '3. 查询性能分析';
    RAISE NOTICE '4. 资料完整性检查';
    RAISE NOTICE '5. 清理重复资料';
    RAISE NOTICE '6. Schema Cache 重新载入';
    RAISE NOTICE '========================================';
END $$;
