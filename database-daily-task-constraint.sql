-- ============================================
-- 每日任務限制 - 資料庫層級防護
-- ============================================

-- 方法1：建立 CHECK 約束（簡單但不夠靈活）
-- 註：PostgreSQL 的 CHECK 約束不支援子查詢，所以這個方法不可行

-- 方法2：建立 TRIGGER 函數（推薦）
-- 在插入 submission 之前檢查今日是否已有非 rejected 的記錄

CREATE OR REPLACE FUNCTION check_daily_task_limit()
RETURNS TRIGGER AS $$
DECLARE
    today_start TIMESTAMP;
    today_end TIMESTAMP;
    existing_count INTEGER;
BEGIN
    -- 取得今日起始和結束時間（UTC）
    today_start := DATE_TRUNC('day', NOW());
    today_end := today_start + INTERVAL '1 day';
    
    -- 檢查今日是否已有非 rejected 的提交
    SELECT COUNT(*)
    INTO existing_count
    FROM submissions
    WHERE user_id = NEW.user_id
        AND task_id = NEW.task_id
        AND status != 'rejected'
        AND created_at >= today_start
        AND created_at < today_end;
    
    -- 如果已有提交，阻止插入
    IF existing_count > 0 THEN
        RAISE EXCEPTION '今天已經提交過這個任務了，請等待審核或明天再來挑戰！';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
DROP TRIGGER IF EXISTS trigger_daily_task_limit ON submissions;
CREATE TRIGGER trigger_daily_task_limit
    BEFORE INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION check_daily_task_limit();

-- ============================================
-- 測試觸發器
-- ============================================

-- 測試1：第一次提交（應該成功）
-- INSERT INTO submissions (task_id, user_id, status)
-- VALUES ('task-id', 'user-id', 'pending');

-- 測試2：同一天第二次提交（應該失敗）
-- INSERT INTO submissions (task_id, user_id, status)
-- VALUES ('task-id', 'user-id', 'pending');
-- 預期錯誤：今天已經提交過這個任務了

-- 測試3：退回後重新提交（應該成功）
-- 1. 先把第一次提交改為 rejected
-- UPDATE submissions SET status = 'rejected' WHERE id = '...';
-- 2. 再次提交（應該成功）
-- INSERT INTO submissions (task_id, user_id, status)
-- VALUES ('task-id', 'user-id', 'pending');

-- ============================================
-- RLS 策略補充（選擇性）
-- ============================================

-- 如果需要在 RLS 層級也加入檢查，可以建立額外的策略
-- 但 TRIGGER 已經足夠防護資料完整性

-- ============================================
-- 清理（如果需要移除觸發器）
-- ============================================

-- DROP TRIGGER IF EXISTS trigger_daily_task_limit ON submissions;
-- DROP FUNCTION IF EXISTS check_daily_task_limit();

-- ============================================
-- 說明
-- ============================================

/*
這個觸發器提供了最強的防護：

1. 在資料庫層級執行（前端無法繞過）
2. 檢查今日是否已有非 rejected 的提交
3. 允許 rejected 後重新提交
4. 使用 UTC 時間（與 Supabase 一致）

優點：
- 即使前端失效，資料庫也能保證資料完整性
- 不需要額外的查詢，在插入時自動檢查
- 效能影響極小

缺點：
- 錯誤訊息只能在插入失敗時看到
- 前端需要處理這個錯誤並顯示友善訊息
*/
