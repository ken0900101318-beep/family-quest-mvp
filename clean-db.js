// 直接清理資料庫
import { createClient } from '@supabase/supabase-js'

// 正確的配置（移除前綴）
const supabase = createClient(
  'https://mnaqdossobzodcyafruy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uYXFkb3Nzb2J6b2RjeWFmcnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyODc0MTEsImV4cCI6MjA1ODg2MzQxMX0.OXQ5n1fVDDPG3jgFOOC9E6paDMm5VvbCJJIaM6b_zNY'
)

console.log('🗑️  開始清理資料庫...\n')

try {
  // 1. 刪除所有 submissions
  console.log('1️⃣ 刪除所有提交記錄...')
  const { error: e1 } = await supabase
    .from('submissions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  
  if (e1) {
    console.error('❌ 錯誤:', e1.message)
    process.exit(1)
  }
  console.log('✅ submissions 已清空\n')
  
  // 2. 刪除所有 tasks
  console.log('2️⃣ 刪除所有任務...')
  const { error: e2 } = await supabase
    .from('tasks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  
  if (e2) {
    console.error('❌ 錯誤:', e2.message)
    process.exit(1)
  }
  console.log('✅ tasks 已清空\n')
  
  // 3. 插入 3 個測試任務
  console.log('3️⃣ 插入測試任務...')
  const tasks = [
    {
      id: '00000000-0000-0000-0000-000000000021',
      family_id: '00000000-0000-0000-0000-000000000001',
      title: '勇者床鋪堡壘',
      icon: '🛏️',
      points: 5,
      type: 'daily',
      target_user_ids: ['00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000013'],
      status: 'active',
      description: '整理床鋪，成為整潔小勇者'
    },
    {
      id: '00000000-0000-0000-0000-000000000022',
      family_id: '00000000-0000-0000-0000-000000000001',
      title: '知識圖書館',
      icon: '📚',
      points: 10,
      type: 'daily',
      target_user_ids: ['00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000013'],
      status: 'active',
      description: '每天閱讀30分鐘'
    },
    {
      id: '00000000-0000-0000-0000-000000000023',
      family_id: '00000000-0000-0000-0000-000000000001',
      title: '彩虹牙刷挑戰',
      icon: '🌈',
      points: 50,
      type: 'challenge',
      target_user_ids: ['00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000013'],
      status: 'active',
      description: '連續21天刷牙兩次'
    }
  ]
  
  const { error: e3 } = await supabase
    .from('tasks')
    .insert(tasks)
  
  if (e3) {
    console.error('❌ 錯誤:', e3.message)
    process.exit(1)
  }
  console.log('✅ 3 個任務已插入\n')
  
  // 4. 插入測試提交記錄
  console.log('4️⃣ 插入測試提交記錄...')
  const submissions = [
    {
      task_id: '00000000-0000-0000-0000-000000000021',
      user_id: '00000000-0000-0000-0000-000000000012',
      status: 'pending',
      points: 5
    },
    {
      task_id: '00000000-0000-0000-0000-000000000022',
      user_id: '00000000-0000-0000-0000-000000000013',
      status: 'pending',
      points: 10
    },
    {
      task_id: '00000000-0000-0000-0000-000000000023',
      user_id: '00000000-0000-0000-0000-000000000012',
      status: 'pending',
      points: 50
    }
  ]
  
  const { error: e4 } = await supabase
    .from('submissions')
    .insert(submissions)
  
  if (e4) {
    console.error('❌ 錯誤:', e4.message)
    process.exit(1)
  }
  console.log('✅ 3 筆提交記錄已插入\n')
  
  // 5. 驗證
  console.log('📊 驗證結果...')
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('title, icon, points, type')
    .eq('family_id', '00000000-0000-0000-0000-000000000001')
  
  console.log('任務列表:')
  allTasks?.forEach((t, i) => {
    console.log(`  ${i+1}. ${t.icon} ${t.title} - ${t.points}點 (${t.type})`)
  })
  
  console.log('\n🎉 清理完成！資料庫現在只有 3 個乾淨的任務！')
  
} catch (error) {
  console.error('❌ 發生錯誤:', error.message)
  process.exit(1)
}
