import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, websiteUrl, showStatusMessages = true } = await request.json()

    if (!apiKey || !websiteUrl) {
      return NextResponse.json({ error: "API key and website URL are required" }, { status: 400 })
    }

    const script = `local HttpService = game:GetService("HttpService")
local StarterGui = game:GetService("StarterGui")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local SoundService = game:GetService("SoundService")
local RunService = game:GetService("RunService")

local API_ENDPOINT = "${websiteUrl}/api/get-messages"
local PLAYER_ENDPOINT = "${websiteUrl}/api/players"
local API_KEY = "${apiKey}"
local SHOW_STATUS_MESSAGES = ${showStatusMessages}
local processedMessages = {}
local player = Players.LocalPlayer
local lastCheckTime = tick()
local lastPlayerUpdate = 0
local scriptExecutionCount = 0
local lastMessageId = 0
local canWrite = writefile and readfile and isfolder and makefolder and getcustomasset

local HttpRequest_878 = (syn and syn.request) or (http and http.request) or http_request or (request) or ((flux and flux.request))

local function normResponse(res)
    local c = 0
    local b = ""
    if res then
        c = res.StatusCode or res.Status or res.status or 0
        b = res.Body or res.body or ""
        if type(b) ~= "string" then
            b = tostring(b)
        end
    end
    return tonumber(c) or 0, b
end

local function makeRequest(config)
    if not HttpRequest_878 then
        warn("[PLAYER API] HTTP request function not available")
        return nil
    end
    
    local success, result = pcall(function()
        return HttpRequest_878(config)
    end)
    
    if success and result then
        return result
    else
        warn("[PLAYER API] Request failed:", result)
    end
    return nil
end

local function getServerInfo()
    local jobId = game.JobId
    local placeId = game.PlaceId
    return jobId, placeId
end

local function updatePlayerData(isExecution)
    local currentTime = tick()
    local heartbeatInterval = 2
    
    if not isExecution and (currentTime - lastPlayerUpdate < heartbeatInterval) then 
        return 
    end
    
    lastPlayerUpdate = currentTime
    local jobId, placeId = getServerInfo()
    
    local playerData = {
        apiKey = API_KEY,
        username = player.Name,
        displayName = player.DisplayName,
        userId = player.UserId,
        jobId = jobId,
        placeId = tostring(placeId),
        totalExecutions = scriptExecutionCount,
        isActive = true
    }
    
    local body = HttpService:JSONEncode(playerData)
    
    -- Ensure POST request is sent correctly
    local success = false
    local maxRetries = 3
    local retryCount = 0
    
    while not success and retryCount < maxRetries do
        local result = makeRequest({
            Url = PLAYER_ENDPOINT,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json",
                ["Content-Length"] = tostring(#body)
            },
            Body = body
        })
        
        if result then
            local code, responseBody = normResponse(result)
            if code >= 200 and code < 300 then
                success = true
                if SHOW_STATUS_MESSAGES and isExecution then
                    warn("[PLAYER API] ✅ Player data sent successfully")
                end
            else
                retryCount = retryCount + 1
                if retryCount < maxRetries then
                    task.wait(0.5)
                end
            end
        else
            retryCount = retryCount + 1
            if retryCount < maxRetries then
                task.wait(0.5)
            end
        end
    end
    
    if not success and SHOW_STATUS_MESSAGES then
        warn("[PLAYER API] ⚠️ Failed to send player data after retries")
    end
end

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "GlobalMessageGui"
screenGui.Parent = player:WaitForChild("PlayerGui")
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

local messageCount = 0

local function executeScript(scriptContent)
    scriptExecutionCount = scriptExecutionCount + 1
    updatePlayerData(true)
    
    local success, result = pcall(function()
        local func, err = loadstring(scriptContent)
        if func then
            pcall(func)
        else
            if SHOW_STATUS_MESSAGES then
                warn("❌ Script error:", err)
            end
        end
    end)
    
    if not success and SHOW_STATUS_MESSAGES then
        warn("[SCRIPT EXECUTOR] Execution failed:", tostring(result))
    end
end

local function displayMessage(message)
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxassetid://6176997734"
    sound.Volume = 0.5
    sound.Parent = SoundService
    sound:Play()
    
    sound.Ended:Connect(function()
        sound:Destroy()
    end)
    
    local messageFrame = Instance.new("Frame")
    messageFrame.Size = UDim2.new(0.4, 0, 0.08, 0)
    messageFrame.Position = UDim2.new(0.3, 0, -0.1, 0)
    messageFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
    messageFrame.BackgroundTransparency = 0.1
    messageFrame.BorderSizePixel = 0
    messageFrame.Parent = screenGui
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = messageFrame
    
    local messageLabel = Instance.new("TextLabel")
    messageLabel.Size = UDim2.new(1, -20, 1, -10)
    messageLabel.Position = UDim2.new(0, 10, 0, 5)
    messageLabel.BackgroundTransparency = 1
    messageLabel.Text = "🌍 " .. message
    messageLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    messageLabel.TextScaled = true
    messageLabel.Font = Enum.Font.GothamBold
    messageLabel.Parent = messageFrame
    
    local targetY = 0.05 + (messageCount * 0.1)
    messageCount = messageCount + 1
    
    local slideIn = TweenService:Create(messageFrame, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        Position = UDim2.new(0.3, 0, targetY, 0)
    })
    slideIn:Play()
    
    pcall(function()
        StarterGui:SetCore("ChatMakeSystemMessage", {
            Text = "[GLOBAL] " .. message,
            Color = Color3.fromRGB(255, 255, 255),
            Font = Enum.Font.GothamBold,
            FontSize = Enum.FontSize.Size18
        })
    end)
    
    task.wait(4)
    
    local slideOut = TweenService:Create(messageFrame, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.In), {
        Position = UDim2.new(0.3, 0, -0.1, 0)
    })
    slideOut:Play()
    slideOut.Completed:Connect(function()
        messageFrame:Destroy()
        messageCount = messageCount - 1
    end)
end

local function playYouTubeVideo(url, audioOnly)
    local Players = game:GetService("Players")
    local HttpService = game:GetService("HttpService")
    local UserInputService = game:GetService("UserInputService")
    local TweenService = game:GetService("TweenService")
    local player = Players.LocalPlayer
    local videoFolder = "YouTubePlay/Videos"
    
    local canWrite = writefile and getcustomasset and isfolder and makefolder
    if canWrite then
        if not isfolder("YouTubePlay") then makefolder("YouTubePlay") end
        if not isfolder(videoFolder) then makefolder(videoFolder) end
    end
    
    local screenGui = Instance.new("ScreenGui", player:WaitForChild("PlayerGui"))
    screenGui.Name = audioOnly and "YouTubeAudioGui" or "YouTubeGui"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    
    local mainFrame, videoFrame, thumbnailOverlay, closeButton, statusLabel, creditLabel
    
    mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0.6, 0, 0.5, 0)
    mainFrame.Position = UDim2.new(0.2, 0, 0.05, 0)
    mainFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    mainFrame.Visible = not audioOnly
    mainFrame.Parent = screenGui
    
    if not audioOnly then
        local dragToggle, dragInput, dragStart, startPos
        mainFrame.InputBegan:Connect(function(input)
            if input.UserInputType == Enum.UserInputType.MouseButton1 or input.Touch then
                dragToggle = true
                dragStart = input.Position
                startPos = mainFrame.Position
                input.Changed:Connect(function()
                    if input.UserInputState == Enum.UserInputState.End then dragToggle = false end
                end)
            end
        end)
        mainFrame.InputChanged:Connect(function(input)
            if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
                dragInput = input
            end
        end)
        UserInputService.InputChanged:Connect(function(input)
            if input == dragInput and dragToggle then
                local delta = input.Position - dragStart
                mainFrame.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
            end
        end)
    end
    
    videoFrame = Instance.new("VideoFrame")
    videoFrame.Size = UDim2.new(1, 0, 1, 0)
    videoFrame.Position = UDim2.new(0, 0, 0, 0)
    videoFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    videoFrame.Visible = true
    videoFrame.Parent = mainFrame
    
    if not audioOnly then
        thumbnailOverlay = Instance.new("ImageLabel")
        thumbnailOverlay.Size = UDim2.new(1, 0, 1, 0)
        thumbnailOverlay.Position = UDim2.new(0, 0, 0, 0)
        thumbnailOverlay.BackgroundTransparency = 1
        thumbnailOverlay.Image = ""
        thumbnailOverlay.Parent = videoFrame
        
        closeButton = Instance.new("TextButton")
        closeButton.Size = UDim2.new(0, 32, 0, 32)
        closeButton.Position = UDim2.new(1, -36, 0, 4)
        closeButton.Text = "✕"
        closeButton.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
        closeButton.TextColor3 = Color3.fromRGB(255, 255, 255)
        closeButton.TextScaled = true
        closeButton.ZIndex = 2
        closeButton.Parent = mainFrame
        closeButton.MouseButton1Click:Connect(function()
            screenGui:Destroy()
        end)
        
        creditLabel = Instance.new("TextLabel")
        creditLabel.Size = UDim2.new(1, 0, 0, 20)
        creditLabel.Position = UDim2.new(0, 0, 1, -20)
        creditLabel.Text = "Made by Verbal Hub using the API — ezzzz ontop (Admins don't show this)"
        creditLabel.TextColor3 = Color3.fromRGB(180, 180, 180)
        creditLabel.BackgroundTransparency = 1
        creditLabel.TextScaled = true
        creditLabel.Parent = mainFrame
    end
    
    local safetyLabel
    if SHOW_STATUS_MESSAGES then
        safetyLabel = Instance.new("TextLabel")
        safetyLabel.AnchorPoint = Vector2.new(1, 1)
        safetyLabel.Position = UDim2.new(1, -10, 1, -50)
        safetyLabel.Size = UDim2.new(0.5, 0, 0.04, 0)
        safetyLabel.Text = audioOnly and "Playing audio from Verbal Hub admins - it is safe" or "This video was requested by Verbal Hub admins - it is safe"
        safetyLabel.BackgroundTransparency = 1
        safetyLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
        safetyLabel.TextTransparency = 0
        safetyLabel.TextScaled = true
        safetyLabel.Parent = screenGui
        
        task.spawn(function()
            task.wait(10)
            local fadeInfo = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
            local fadeTween = TweenService:Create(safetyLabel, fadeInfo, {TextTransparency = 1})
            fadeTween:Play()
        end)
    end
    
    local statusLabel
    if SHOW_STATUS_MESSAGES then
        statusLabel = Instance.new("TextLabel")
        statusLabel.AnchorPoint = Vector2.new(1, 1)
        statusLabel.Position = UDim2.new(1, -10, 1, -10)
        statusLabel.Size = UDim2.new(0.4, 0, 0.04, 0)
        statusLabel.Text = ""
        statusLabel.BackgroundTransparency = 1
        statusLabel.TextColor3 = Color3.new(1, 1, 1)
        statusLabel.TextTransparency = 0
        statusLabel.TextScaled = true
        statusLabel.Parent = screenGui
    end
    
    local function getDirectVideoUrl(videoId)
        local command = "https://youtu.be/" .. videoId .. " -f best --get-url"
        local encodedCommand = HttpService:UrlEncode(command)
        local url = "https://ytdlp.online/stream?command=" .. encodedCommand
        local success, response = pcall(function()
            return game:HttpGet(url)
        end)
        if success then
            local directUrl = response:match('data:%s*(https://[^\n%s]+)')
            if directUrl then
                return directUrl
            end
        end
        return nil, "Failed to get direct video URL"
    end
    
    local function updateStatus(text)
        if SHOW_STATUS_MESSAGES and statusLabel then
            statusLabel.Text = text
            statusLabel.TextTransparency = 1
            local fadeInInfo = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
            local fadeInTween = TweenService:Create(statusLabel, fadeInInfo, {TextTransparency = 0})
            fadeInTween:Play()
        end
    end
    
    updateStatus(audioOnly and "Getting audio info..." or "Getting video info...")
    
    local videoId = url:match("youtu%.be/([%w-_]+)") or url:match("v=([%w-_]+)")
    if not videoId then
        updateStatus("Invalid URL")
        return
    end
    
    local infoUrl = "https://noembed.com/embed?url=https://youtu.be/" .. videoId
    local success, response = pcall(function()
        return HttpService:JSONDecode(game:HttpGet(infoUrl))
    end)
    
    if not (success and response and response.title) then
        updateStatus("Failed to get video info")
        return
    end
    
    local cleanTitle = response.title:gsub("[^%w]", "_")
    local savePath = videoFolder .. "/" .. cleanTitle .. ".mp4"
    local thumbPath = videoFolder .. "/" .. cleanTitle .. "_thumb.jpg"
    local thumbnailUrl = "https://img.youtube.com/vi/" .. videoId .. "/hqdefault.jpg"
    
    if not audioOnly and thumbnailOverlay and canWrite and SHOW_STATUS_MESSAGES then
        updateStatus("Downloading thumbnail...")
        local thumbSuccess, thumbData = pcall(function()
            return game:HttpGet(thumbnailUrl)
        end)
        if thumbSuccess then
            writefile(thumbPath, thumbData)
            thumbnailOverlay.Image = getcustomasset(thumbPath)
        end
    end
    
    updateStatus(audioOnly and "Fetching audio URL..." or "Fetching video URL...")
    local directUrl, err = getDirectVideoUrl(videoId)
    if not directUrl then
        updateStatus("Error: " .. err)
        return
    end
    
    updateStatus(audioOnly and "Downloading audio..." or "Downloading...")
    local videoSuccess, videoData = pcall(function()
        return game:HttpGet(directUrl)
    end)
    if videoSuccess and canWrite then
        writefile(savePath, videoData)
        local asset = getcustomasset(savePath)
        if asset then
            updateStatus(audioOnly and ("Playing audio: " .. response.title) or ("Playing: " .. response.title))
            task.wait(0.5)
            videoFrame.Video = asset
            
            if not audioOnly and thumbnailOverlay then
                thumbnailOverlay.Image = ""
                mainFrame.Visible = true
            end
            
            videoFrame:Play()
            
            if audioOnly and SHOW_STATUS_MESSAGES then
                task.spawn(function()
                    task.wait(5)
                    if statusLabel and safetyLabel then
                        local fadeInfo = TweenInfo.new(2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
                        local fadeTween = TweenService:Create(statusLabel, fadeInfo, {TextTransparency = 1})
                        fadeTween:Play()
                        local fadeTween2 = TweenService:Create(safetyLabel, fadeInfo, {TextTransparency = 1})
                        fadeTween2:Play()
                    end
                end)
            end
        else
            updateStatus(audioOnly and "Failed to load audio asset" or "Failed to load video asset")
        end
    else
        updateStatus(audioOnly and "Audio download failed" or "Video download failed")
    end
end

local function checkMessages()
    local success, result = pcall(function()
        return makeRequest({
            Url = API_ENDPOINT .. "?apiKey=" .. API_KEY .. "&lastId=" .. lastMessageId,
            Method = "GET",
            Headers = {
                ["Content-Type"] = "application/json"
            }
        })
    end)
    
    if success and result then
        local code, body = normResponse(result)
        
        if code >= 200 and code < 300 then
            local decodeSuccess, data = pcall(function()
                return HttpService:JSONDecode(body)
            end)
            
            if decodeSuccess and data and data.success and data.messages then
                for _, messageData in pairs(data.messages) do
                    if messageData.message and messageData.sent_at and messageData.id then
                        if messageData.id > lastMessageId then
                            lastMessageId = messageData.id
                            
                            if messageData.message:match("^YOUTUBE:") then
                                local url = messageData.message:match("^YOUTUBE:(.+)")
                                if url then
                                    task.spawn(playYouTubeVideo, url, false)
                                end
                            elseif messageData.message:match("^YOUTUBE_AUDIO:") then
                                local url = messageData.message:match("^YOUTUBE_AUDIO:(.+)")
                                if url then
                                    task.spawn(playYouTubeVideo, url, true)
                                end
                            elseif messageData.message:match("^EXECUTE_SCRIPT:") then
                                local scriptContent = messageData.message:match("^EXECUTE_SCRIPT:(.+)")
                                if scriptContent then
                                    task.spawn(executeScript, scriptContent)
                                end
                            else
                                task.spawn(displayMessage, messageData.message)
                            end
                        end
                    end
                end
            end
        end
    end
end

task.spawn(function()
    while true do
        updatePlayerData(false)
        task.wait(2)
    end
end)

task.spawn(function()
    while true do
        checkMessages()
        task.wait(2)
    end
end)

if SHOW_STATUS_MESSAGES then
    print("[GLOBAL API] ✅ Roblox Global Message API initialized!")
    print("[GLOBAL API] 👤 Player:", player.Name, "| 🔑 Key:", API_KEY:sub(1, 8) .. "...")
end
`

    return NextResponse.json({
      success: true,
      script: script,
    })
  } catch (error) {
    console.error("Error generating script:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
