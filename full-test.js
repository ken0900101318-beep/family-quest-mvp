import { mockAPI } from './src/lib/supabase.js'

async function fullTest() {
  console.log('\n========== 完整流程測試 ==========\n')
  
  try {
    console.log('1️⃣ 測試 getPendingSubmissions...')
    const pending = await mockAPI.getPendingSubmissions()
    
    console.log(`   ✅ 載入 ${pending.length} 筆`)
    
    if (pending.length > 0) {
      console.log('\n📋 第一筆原始資料:')
      console.log(JSON.stringify(pending[0], null, 2))
      
      console.log('\n🔄 ParentHub 轉換邏輯:')
      const formatted = {
        id: pending[0].id,
        childId: pending[0].userId,
        childName: pending[0].userName,
        title: pending[0].taskTitle,
        points: pending[0].points,
        description: '',
        status: 'submitted',
        submittedAt: new Date(pending[0].timestamp).toLocaleString('zh-TW'),
        type: 'taskSubmit',
        photo: pending[0].photo,
        taskId: pending[0].taskId
      }
      console.log(JSON.stringify(formatted, null, 2))
      
      console.log('\n✅ 前端應該顯示:')
      console.log(`   任務: ${formatted.title}`)
      console.log(`   兒童: ${formatted.childName}`)
      console.log(`   時間: ${formatted.submittedAt}`)
      console.log(`   點數: ${formatted.points}`)
    } else {
      console.log('\n⚠️  沒有待審核項目')
    }
    
  } catch (error) {
    console.error('\n❌ 測試失敗:', error.message)
    console.error(error)
  }
}

fullTest()
