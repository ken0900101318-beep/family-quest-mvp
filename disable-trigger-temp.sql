-- 暫時停用每日任務限制TRIGGER（測試用）
DROP TRIGGER IF EXISTS trigger_daily_task_limit ON submissions;

-- 如果要重新啟用，執行：
-- CREATE TRIGGER trigger_daily_task_limit
--     BEFORE INSERT ON submissions
--     FOR EACH ROW
--     EXECUTE FUNCTION check_daily_task_limit();
