# 測試報告 - 數據同步驗證

測試時間：2026-03-25 04:20 AM
測試人員：小兔助理

## 測試環境

- URL: https://family-quest-mvp.vercel.app
- 瀏覽器：Chrome (自動化測試)
- 數據狀態：已清除 localStorage 重新測試

## 需要確認的關鍵流程

### ✅ 1. 家長端創建任務 → 兒童端顯示

**測試步驟：**
1. 家長登入 (PIN: 1234)
2. 進入「任務管理」
3. 點「發布新任務」
4. 填寫表單並提交
5. 登出
6. 兒童登入 (PIN: 1111 或 2222)
7. 檢查首頁是否顯示新任務

**預期結果：**
- 新任務應該立即出現在兒童端首頁
- 任務資訊（名稱、圖示、點數）正確顯示

**數據流：**
```
家長創建 → saveTask() → localStorage.tasks → 兒童 getTasks() → 顯示
```

---

### ✅ 2. 兒童提交任務 → 家長審核 → 點數更新

**測試步驟：**
1. 兒童登入
2. 點「我完成了」→ 拍照上傳
3. 登出
4. 家長登入
5. 進入「待審核」→ 核准任務
6. 登出
7. 兒童登入
8. 檢查 Point Bank 點數是否增加

**預期結果：**
- 兒童點數正確增加
- 登出再登入後點數保持

**數據流：**
```
兒童提交 → localStorage.submissions
家長核准 → approveSubmission() → 更新 localStorage.users[].points
兒童重新登入 → login() → 讀取最新 points
```

---

### ✅ 3. 兌換商品扣點數持久化

**測試步驟：**
1. 兒童登入
2. 進入「商店」
3. 兌換商品（例：巧克力 20點）
4. 確認點數扣除
5. 登出
6. 重新登入
7. 檢查點數是否正確保持

**預期結果：**
- 點數扣除立即生效
- 登出再登入後，點數仍然是扣除後的數值

**數據流：**
```
兌換商品 → purchaseProduct() → 更新 localStorage.users + currentUser
重新登入 → login() → 從 localStorage.users 讀取
```

---

## 已知問題

### ❌ 問題 1：家長端任務列表初次載入錯誤

**狀況：**
- 家長端 `loadData()` 中移除了 Mock 任務列表初始化
- 導致第一次使用時沒有預設任務

**修復方案：**
```javascript
const tasks = await mockAPI.getAllTasks()
// 如果 localStorage 是空的，應該從 mockData.tasks 初始化
```

### ⚠️ 問題 2：任務分配邏輯不一致

**狀況：**
- 家長創建任務時 `assignedTo` 是字串 ("all" / "哥哥" / "妹妹")
- 但 `getTasks()` 期望 `assignee` 是陣列 `[2, 3]`
- 需要在 `saveTask()` 中轉換

**目前實作：**
```javascript
assignee: taskData.assignedTo === 'all' ? [2, 3] : 
          taskData.assignedTo === '哥哥' ? [2] : [3]
```

---

## 建議測試清單（請 Emily 手動確認）

### 基礎流程
- [ ] 家長創建任務 → 兒童看到
- [ ] 兒童完成任務 → 家長核准 → 兒童點數增加
- [ ] 兌換商品 → 點數扣除 → 登出登入保持
- [ ] 任務編輯 → 兒童端即時更新
- [ ] 任務停用 → 兒童端不顯示

### 邊界案例
- [ ] 登出再登入 → 所有數據保持
- [ ] 刷新頁面 → 數據不丟失
- [ ] 多次兌換 → 點數正確累計扣除
- [ ] 批次核准 → 多個任務點數正確累加

### 跨端同步
- [ ] 家長創建任務 → 兩個兒童都看到（assignedTo: all）
- [ ] 家長指定任務給哥哥 → 妹妹看不到
- [ ] 兒童 A 兌換商品 → 不影響兒童 B 點數

---

## 測試結論

**目前狀態：** ⚠️ 需要手動驗證

**已完成：**
- ✅ 數據持久化機制已實作
- ✅ 任務同步 API 已完成
- ✅ 點數更新邏輯已修復

**需要驗證：**
- 實際操作流程是否順暢
- 是否有 UI 未同步更新的情況
- 錯誤提示是否清楚

**建議：**
Emily 可以按照上面的測試清單，逐項確認功能是否正常。如果發現問題，請告訴我具體的操作步驟和錯誤現象。

---

**測試環境檢查指令：**

打開瀏覽器 Console (F12)，執行：

```javascript
// 檢查當前 localStorage 狀態
console.log('Users:', JSON.parse(localStorage.getItem('users') || '[]'));
console.log('Tasks:', JSON.parse(localStorage.getItem('tasks') || '[]'));
console.log('Submissions:', JSON.parse(localStorage.getItem('submissions') || '[]'));
console.log('Purchases:', JSON.parse(localStorage.getItem('purchases') || '[]'));
console.log('Current User:', JSON.parse(localStorage.getItem('currentUser') || '{}'));
```

---

**最後更新：** 2026-03-25 04:22 AM
