# Family Quest MVP - SQL 檔案說明

## 📁 檔案清單

### 1. supabase-schema.sql
**用途：** 完整資料庫結構定義  
**包含：**
- 所有表格結構（users, tasks, submissions, products, purchases, wishes）
- 約束條件（CHECK, FOREIGN KEY）
- 索引
- RLS 政策

**何時使用：** 
- 初次建立資料庫
- 完全重建資料庫

**執行：**
```sql
-- 在 Supabase SQL Editor 中執行整個檔案
```

---

### 2. supabase-init-quick.sql
**用途：** 快速初始化測試資料  
**包含：**
- 測試家庭
- 測試用戶（媽媽、哥哥、妹妹）
- 測試任務（3個）
- 測試商品（3個）
- 測試提交記錄（3筆）

**何時使用：** 
- 快速建立測試環境
- Demo 展示

---

### 3. rebuild-database.sql
**用途：** 修正資料庫結構問題  
**包含：**
- 修正 tasks.target_user_ids 欄位
- 修正 submissions 欄位名稱

**何時使用：** 
- 修復欄位不匹配問題
- 遷移舊資料庫

---

### 4. CLEAN_DATABASE.sql
**用途：** 清空並重置測試資料  
**包含：**
- 刪除所有 submissions 和 tasks
- 插入 3 個乾淨的測試任務
- 插入 3 筆測試提交記錄

**何時使用：** 
- 清理重複測試資料
- 重置開發環境

---

### 5. FINAL_FIX.sql
**用途：** 最終清理腳本  
**包含：**
- 清空所有測試資料
- 重新插入標準測試資料

**何時使用：** 
- 解決資料混亂問題
- 重置為標準狀態

---

### 6. clean-test-tasks.sql
**用途：** 清除特定重複任務  
**包含：**
- 刪除「試一下」任務
- 清理孤立提交記錄

---

### 7. fix-tasks.sql
**用途：** 修復任務相關問題  
**包含：**
- 特定任務修復邏輯

---

### 8. ALL_SQL_FILES.sql
**用途：** 所有 SQL 檔案的彙總  
**包含：** 上述所有檔案內容

---

## 🚀 快速開始指南

### 情境 1：全新資料庫
```sql
-- 1. 執行結構定義
執行 supabase-schema.sql

-- 2. 插入測試資料
執行 supabase-init-quick.sql
```

### 情境 2：重置測試資料
```sql
-- 執行清理腳本
執行 CLEAN_DATABASE.sql
```

### 情境 3：修復結構問題
```sql
-- 執行重建腳本
執行 rebuild-database.sql
```

---

## ⚠️ 注意事項

1. **執行順序很重要**
   - 先執行結構定義（schema）
   - 再執行資料插入（init）

2. **清理腳本會刪除資料**
   - CLEAN_DATABASE.sql 會清空所有任務和提交
   - FINAL_FIX.sql 會完全重置
   - 使用前請確認

3. **測試資料 ID**
   - 家庭 ID: `00000000-0000-0000-0000-000000000001`
   - 媽媽: `00000000-0000-0000-0000-000000000011`
   - 哥哥: `00000000-0000-0000-0000-000000000012`
   - 妹妹: `00000000-0000-0000-0000-000000000013`

4. **資料庫約束**
   - tasks.type 只允許: `daily`, `extra`, `challenge`, `longterm`
   - users.pin 必須唯一
   - 所有 UUID 必須有效

---

## 📊 測試資料說明

### 用戶
- 👩 媽媽 - PIN: 1234 (家長)
- 👦 哥哥 - PIN: 1111 (兒童, 1250點)
- 👧 妹妹 - PIN: 2222 (兒童, 850點)

### 任務
1. 🛏️ 勇者床鋪堡壘 - 5點 (每日)
2. 📚 知識圖書館 - 10點 (每日)
3. 🌈 彩虹牙刷挑戰 - 50點 (挑戰)

### 商品
1. 🎮 遊戲時間 30分 - 100點
2. 🎬 電影票 - 250點
3. 🍦 冰淇淋券 - 60點

---

## 🔗 相關連結

- **Supabase 專案：** https://supabase.com/dashboard/project/mnaqdossobzodcyafruy
- **線上網站：** https://family-quest-mvp.vercel.app
- **GitHub：** https://github.com/ken0900101318-beep/family-quest-mvp

---

**最後更新：** 2026-03-28  
**工程師：** 小兔 🐰
