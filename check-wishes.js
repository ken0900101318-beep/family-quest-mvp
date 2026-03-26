import { mockAPI } from './src/lib/supabase.js'

async function check() {
  console.log('檢查 wishes 表結構...\n')
  
  const wishes = await mockAPI.getWishes()
  
  if (wishes && wishes[0]) {
    console.log('Wishes 欄位：')
    console.log(Object.keys(wishes[0]))
    console.log('\n範例資料：')
    console.log(JSON.stringify(wishes[0], null, 2))
  } else {
    console.log('沒有許願資料')
  }
}

check()
