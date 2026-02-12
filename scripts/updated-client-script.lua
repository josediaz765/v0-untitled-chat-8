-- Updated Client Script with Audio-Only Support and Fixed YouTube Fetching
-- Place this script in StarterPlayerScripts

local Players = game:GetService("Players")
local StarterGui = game:GetService("StarterGui")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local HttpService = game:GetService("HttpService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Wait for the RemoteEvent
local globalMessageEvent = ReplicatedStorage:WaitForChild("GlobalMessageEvent")

-- Video folder setup
local videoFolder = "YouTubePlay/Videos"
local canWrite = writefile and getcustomasset and isfolder and makefolder

if canWrite then
    if not isfolder("YouTubePlay") then makefolder("YouTubePlay") end
    if not isfolder(videoFolder) then makefolder(videoFolder) end
end

-- Create GUI for displaying messages
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "GlobalMessageGUI"
screenGui.Parent = playerGui

local messageFrame = Instance.new("Frame")
messageFrame.Name = "MessageFrame"
messageFrame.Size = UDim2.new(0.8, 0, 0.1, 0)
messageFrame.Position = UDim2.new(0.1, 0, 0.05, 0)
messageFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
messageFrame.BackgroundTransparency = 0.3
messageFrame.BorderSizePixel = 0
messageFrame.Visible = false
messageFrame.Parent = screenGui

-- Add corner radius
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

-- Function to display global message
local function displayGlobalMessage(message)
    messageLabel.Text = "[GLOBAL] " .. message
    messageFrame.Visible = true
    
    -- Animate in
    local tweenIn = TweenService:Create(
        messageFrame,
        TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        {Position = UDim2.new(0.1, 0, 0.05, 0)}
    )
    
    tweenIn:Play()
    
    -- Auto hide after 5 seconds
    wait(5)
    
    local tweenOut = TweenService:Create(
        messageFrame,
        TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.In),
        {Position = UDim2.new(0.1, 0, -0.15, 0)}
    )
    
    tweenOut:Play()
    tweenOut.Completed:Connect(function()
        messageFrame.Visible = false
        messageFrame.Position = UDim2.new(0.1, 0, 0.05, 0)
    end)
    
    -- Also send to chat
    StarterGui:SetCore("ChatMakeSystemMessage", {
        Text = "[GLOBAL] " .. message;
        Color = Color3.fromRGB(255, 215, 0);
        Font = Enum.Font.GothamBold;
        FontSize = Enum.FontSize.Size18;
    })
end

-- YouTube video functions
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

local function createYouTubeGUI(audioOnly)
    local videoGui = Instance.new("ScreenGui", playerGui)
    videoGui.Name = audioOnly and "YouTubeAudioGui" or "YouTubeGui"
    videoGui.ResetOnSpawn = false
    videoGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    
    local mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0.6, 0, 0.5, 0)
    mainFrame.Position = UDim2.new(0.2, 0, 0.05, 0)
    mainFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    mainFrame.Visible = not audioOnly -- Hide frame for audio-only mode
    mainFrame.Parent = videoGui
    
    -- Only add drag functionality for visible frames
    if not audioOnly then
        local dragToggle, dragInput, dragStart, startPos
        mainFrame.InputBegan:Connect(function(input)
            if input.UserInputType == Enum.UserInputType.MouseButton1 or input.Touch then
                dragToggle = true
                dragStart = input.Position
                startPos = mainFrame.Position
                input.Changed:Connect(function()
                    if input.UserInputState == Enum.UserInputState.End then
                        dragToggle = false
                    end
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
    
    local videoFrame = Instance.new("VideoFrame")
    videoFrame.Size = UDim2.new(1, 0, 1, 0)
    videoFrame.Position = UDim2.new(0, 0, 0, 0)
    videoFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    videoFrame.Visible = true
    videoFrame.Parent = mainFrame
    
    local thumbnailOverlay = nil
    local closeButton = nil
    local creditLabel = nil
    
    -- Only create visual elements for non-audio-only mode
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
            videoGui:Destroy()
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
    
    local safetyLabel = Instance.new("TextLabel")
    safetyLabel.AnchorPoint = Vector2.new(1, 1)
    safetyLabel.Position = UDim2.new(1, -10, 1, -50)
    safetyLabel.Size = UDim2.new(0.5, 0, 0.04, 0)
    safetyLabel.Text = audioOnly and "Playing audio from Verbal Hub admins - it is safe" or "This video was requested by Verbal Hub admins - it is safe"
    safetyLabel.BackgroundTransparency = 1
    safetyLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
    safetyLabel.TextTransparency = 0
    safetyLabel.TextScaled = true
    safetyLabel.Parent = videoGui
    
    -- Fade out safety label after 10 seconds
    spawn(function()
        wait(10)
        local fadeInfo = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
        local fadeTween = TweenService:Create(safetyLabel, fadeInfo, {TextTransparency = 1})
        fadeTween:Play()
    end)
    
    local statusLabel = Instance.new("TextLabel")
    statusLabel.AnchorPoint = Vector2.new(1, 1)
    statusLabel.Position = UDim2.new(1, -10, 1, -10)
    statusLabel.Size = UDim2.new(0.4, 0, 0.04, 0)
    statusLabel.Text = ""
    statusLabel.BackgroundTransparency = 1
    statusLabel.TextColor3 = Color3.new(1, 1, 1)
    statusLabel.TextTransparency = 0
    statusLabel.TextScaled = true
    statusLabel.Parent = videoGui
    
    return videoGui, videoFrame, statusLabel, thumbnailOverlay, mainFrame
end

local function updateStatus(statusLabel, text)
    statusLabel.Text = text
    -- Fade in effect when text changes
    statusLabel.TextTransparency = 1
    local fadeInInfo = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
    local fadeInTween = TweenService:Create(statusLabel, fadeInInfo, {TextTransparency = 0})
    fadeInTween:Play()
    
    -- Auto-fade out for audio-only mode
    if statusLabel.Parent.Name == "YouTubeAudioGui" then
        spawn(function()
            wait(3)
            local fadeOutInfo = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
            local fadeOutTween = TweenService:Create(statusLabel, fadeOutInfo, {TextTransparency = 1})
            fadeOutTween:Play()
        end)
    end
end

local function playYouTubeVideo(url, audioOnly)
    local videoId = url:match("youtu%.be/([%w-_]+)") or url:match("v=([%w-_]+)")
    if not videoId then
        print("Invalid YouTube URL")
        return
    end
    
    local gui, videoFrame, statusLabel, thumbnailOverlay, mainFrame = createYouTubeGUI(audioOnly)
    
    updateStatus(statusLabel, audioOnly and "Getting audio info..." or "Getting video info...")
    
    local infoUrl = "https://noembed.com/embed?url=https://youtu.be/" .. videoId
    local success, response = pcall(function()
        return HttpService:JSONDecode(game:HttpGet(infoUrl))
    end)
    
    if not (success and response and response.title) then
        updateStatus(statusLabel, "Failed to get video info")
        return
    end
    
    local cleanTitle = response.title:gsub("[^%w]", "_")
    local savePath = videoFolder .. "/" .. cleanTitle .. ".mp4"
    local thumbPath = videoFolder .. "/" .. cleanTitle .. "_thumb.jpg"
    local thumbnailUrl = "https://img.youtube.com/vi/" .. videoId .. "/hqdefault.jpg"
    
    -- Download thumbnail only for video mode (not audio-only)
    if not audioOnly and thumbnailOverlay and canWrite then
        updateStatus(statusLabel, "Downloading thumbnail...")
        local thumbSuccess, thumbData = pcall(function()
            return game:HttpGet(thumbnailUrl)
        end)
        if thumbSuccess then
            writefile(thumbPath, thumbData)
            thumbnailOverlay.Image = getcustomasset(thumbPath)
        end
    end
    
    updateStatus(statusLabel, audioOnly and "Fetching audio URL..." or "Fetching video URL...")
    local directUrl, err = getDirectVideoUrl(videoId)
    if not directUrl then
        updateStatus(statusLabel, "Error: " .. err)
        return
    end
    
    updateStatus(statusLabel, audioOnly and "Downloading audio..." or "Downloading video...")
    local videoSuccess, videoData = pcall(function()
        return game:HttpGet(directUrl)
    end)
    
    if videoSuccess and canWrite then
        writefile(savePath, videoData)
        local asset = getcustomasset(savePath)
        if asset then
            updateStatus(statusLabel, audioOnly and ("Playing audio: " .. response.title) or ("Playing: " .. response.title))
            wait(0.5)
            videoFrame.Video = asset
            
            -- For video mode, clear thumbnail and show frame
            if not audioOnly and thumbnailOverlay and mainFrame then
                thumbnailOverlay.Image = ""
                mainFrame.Visible = true
            end
            
            videoFrame:Play()
            
            -- For audio-only mode, auto-hide status after playing
            if audioOnly then
                spawn(function()
                    wait(5)
                    local fadeInfo = TweenInfo.new(2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
                    local fadeTween = TweenService:Create(statusLabel, fadeInfo, {TextTransparency = 1})
                    fadeTween:Play()
                    local fadeTween2 = TweenService:Create(gui:FindFirstChild("TextLabel"), fadeInfo, {TextTransparency = 1})
                    if fadeTween2 then fadeTween2:Play() end
                end)
            end
        else
            updateStatus(statusLabel, audioOnly and "Failed to load audio asset" or "Failed to load video asset")
        end
    else
        updateStatus(statusLabel, audioOnly and "Audio download failed" or "Video download failed")
    end
end

-- Listen for global messages
globalMessageEvent.OnClientEvent:Connect(function(message)
    if message:sub(1, 8) == "YOUTUBE:" then
        local url = message:sub(9)
        playYouTubeVideo(url, false) -- Full video mode
    elseif message:sub(1, 14) == "YOUTUBE_AUDIO:" then
        local url = message:sub(15)
        playYouTubeVideo(url, true) -- Audio-only mode
    else
        displayGlobalMessage(message)
    end
end)

print("[GLOBAL API] Client script loaded - ready to receive messages and videos!")
