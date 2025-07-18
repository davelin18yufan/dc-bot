## Init Flow
1. 第一階段：編譯 (Build) + 註冊指令到 Discord API
    - npm run build 這個步驟，就是把您在 src 資料夾裡寫的所有 .ts (TypeScript) 檔案，全部轉換成瀏覽器或 Node.js看得懂的 .js(JavaScript) 檔案，並存放到 dist 資料夾中。
2. 執行 (Execution)
    - `node --enable-source-maps dist/start-bot.js`
3. 程式內部啟動流程 (`start-bot.ts`)
    a. `start()`　
    b. 初始化
    c. 設定事件處理器 (Event Handlers)
    d. 建立機器人實例 (Bot Instance)
    e. 處理指令註冊 (Command Registration)
    f. 啟動
    g. 錯誤處理

>　npm run start -> npm -> tsc (編譯 src 到 dist) -> Node.js -> 執行 dist/start-bot.js -> 程式碼 -> 建立 Client -> 載入指令 ->　設定事件處理器 -> 登入 Discord -> 開始監聽事件 -> 機器人上線！

## Event Flow

1. `Bot` (調度員) 監聽來自 Discord 的原始事件。
2. 當事件發生，`Bot` 根據事件類型，將事件物件傳遞給對應的 `EventHandler` (專家)。
3. `EventHandler` (例如 CommandHandler) 開始它的標準化處理流程。
4. 在流程中，`EventHandler` 需要一些額外的上下文資料，於是它呼叫 `EventDataService` (後勤支援)。
5. `EventDataService` 從資料庫或其他地方取得所需資料，打包成 EventData 物件後回傳。
6. 同時，在整個流程的任何地方，如果需要記錄資訊或錯誤，都會呼叫 `Logger` (記錄員) 來完成。
7. 最後，`EventHandler` 執行完所有前置作業後，呼叫具體的 command.execute() 方法，完成業務邏輯。
> 這個架構將事件的監聽與分派、具體事件的處理流程、業務邏輯、資料準備和日誌記錄等不同關注點清晰地分離開來，使得整個專案結構非常有條理、易於理解和擴充。