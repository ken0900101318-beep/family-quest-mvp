import { mockAPI } from './src/lib/supabase.js'

async function testAll() {
  console.log('\n========== 完整功能測試 ==========\n')
  
  console.log('1️⃣ 登入測試')
  const user = await mockAPI.login('1111')
  console.log('   ✅ 哥哥登入:', user?.name, user?.points, '點\n')
  
  console.log('2️⃣ 審核牆（待審核任務）')
  const pending = await mockAPI.getPendingSubmissions()
  console.log('   ✅ 待審核:', pending.length, '筆')
  if (pending[0]) {
    console.log('   📋', pending[0].taskTitle, '-', pending[0].userName, `(${pending[0].points} 點)\n`)
  }
  
  console.log('3️⃣ 任務申請')
  const requests = await mockAPI.getTaskRequests(user.id)
  console.log('   ✅ 我的申請:', requests.length, '筆')
  if (requests[0]) {
    console.log('   📋', requests[0].title, '-', requests[0].status, '\n')
  }
  
  console.log('4️⃣ 歷史記錄')
  const history = await mockAPI.getUserSubmissions(user.id)
  console.log('   ✅ 提交歷史:', history.length, '筆\n')
  
  console.log('5️⃣ 公告系統')
  const announcements = await mockAPI.getAnnouncements()
  console.log('   ✅ 公告:', announcements.length, '則\n')
  
  console.log('6️⃣ 商店系統')
  const products = await mockAPI.getProducts()
  console.log('   ✅ 商品:', products.length, '個')
  const wishes = await mockAPI.getWishes()
  console.log('   ✅ 許願:', wishes.length, '筆\n')
  
  console.log('========== ✅ 所有測試通過！ ==========\n')
}

testAll().catch(err => {
  console.error('\n❌ 測試失敗:', err.message)
  process.exit(1)
})
