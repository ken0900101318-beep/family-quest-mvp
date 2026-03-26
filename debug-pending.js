import { mockAPI } from './src/lib/supabase.js'

async function debug() {
  console.log('🔍 檢查待審核資料結構...\n')
  
  const pending = await mockAPI.getPendingSubmissions()
  
  console.log(`共 ${pending.length} 筆待審核`)
  
  if (pending[0]) {
    console.log('\n第一筆原始資料:')
    console.log(JSON.stringify(pending[0], null, 2))
    
    console.log('\n轉換後資料:')
    const formatted = {
      id: pending[0].id,
      childId: pending[0].userId,
      childName: pending[0].userName,
      title: pending[0].taskTitle,
      points: pending[0].points,
      status: 'submitted',
      submittedAt: new Date(pending[0].timestamp).toLocaleString('zh-TW'),
      type: 'taskSubmit',
      photo: pending[0].photo,
      taskId: pending[0].taskId
    }
    console.log(JSON.stringify(formatted, null, 2))
  }
}

debug()
