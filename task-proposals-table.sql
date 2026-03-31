-- ============================================
-- 建立「任務提案」資料表
-- ============================================

CREATE TABLE IF NOT EXISTS public.task_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_name VARCHAR(100) NOT NULL,
    task_description TEXT,
    proposed_points INTEGER NOT NULL DEFAULT 10,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason TEXT,
    approved_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_task_proposals_user_id ON public.task_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_task_proposals_status ON public.task_proposals(status);
CREATE INDEX IF NOT EXISTS idx_task_proposals_created_at ON public.task_proposals(created_at DESC);

-- 停用 RLS（暫時，之後可以設定策略）
ALTER TABLE public.task_proposals DISABLE ROW LEVEL SECURITY;

-- 重新載入
NOTIFY pgrst, 'reload schema';
