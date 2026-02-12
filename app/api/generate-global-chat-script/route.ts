import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, websiteUrl } = await request.json()

    if (!apiKey || !websiteUrl) {
      return NextResponse.json({ error: "API key and website URL are required" }, { status: 400 })
    }

    const script = `local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")

local CHAT_API_ENDPOINT = "${websiteUrl}/api/global-chat/get"
local SEND_API_ENDPOINT = "${websiteUrl}/api/global-chat/send"
local HISTORY_API_ENDPOINT = "${websiteUrl}/api/global-chat/history"
local PLAYERS_API_ENDPOINT = "${websiteUrl}/api/players"
local API_KEY = "${apiKey}"

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local lastMessageId = 0
local isInitialized = false

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
        warn("[GLOBAL CHAT] HTTP request function not available")
        return nil
    end
    local success, result = pcall(function()
        return HttpRequest_878(config)
    end)
    if success and result then
        return result
    else
        warn("[GLOBAL CHAT] Request failed:", result)
    end
    return nil
end

local function sendPlayerHeartbeat()
    local jobId = game.JobId
    local placeId = game.PlaceId
    local playerData = {
        apiKey = API_KEY,
        username = player.Name,
        displayName = player.DisplayName,
        userId = tostring(player.UserId),
        jobId = jobId,
        placeId = placeId,
        isActive = true
    }
    local success, result = pcall(function()
        return makeRequest({
            Url = PLAYERS_API_ENDPOINT,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json"
            },
            Body = HttpService:JSONEncode(playerData)
        })
    end)
    if not success then
        warn("[GLOBAL CHAT] Heartbeat failed:", result)
    end
end

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "GlobalChatMiniGui"
screenGui.Parent = playerGui
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

local chatWidth = 300
local chatHeight = 360

local chatFrame = Instance.new("Frame")
chatFrame.AnchorPoint = Vector2.new(1, 1)
chatFrame.Size = UDim2.new(0, chatWidth, 0, chatHeight)
chatFrame.Position = UDim2.new(1, -20, 1, -80)
chatFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
chatFrame.BorderSizePixel = 0
chatFrame.Parent = screenGui

local chatCorner = Instance.new("UICorner")
chatCorner.CornerRadius = UDim.new(0, 10)
chatCorner.Parent = chatFrame

local stroke = Instance.new("UIStroke")
stroke.Thickness = 1.25
stroke.Color = Color3.fromRGB(50, 50, 50)
stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
stroke.Parent = chatFrame

local titleLabel = Instance.new("TextLabel")
titleLabel.Size = UDim2.new(1, 0, 0, 24)
titleLabel.Position = UDim2.new(0, 0, 0, 0)
titleLabel.BackgroundTransparency = 1
titleLabel.Font = Enum.Font.GothamBold
titleLabel.TextSize = 16
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
titleLabel.Text = "  Global Chat"
titleLabel.Parent = chatFrame

local divider = Instance.new("Frame")
divider.Size = UDim2.new(1, -10, 0, 1)
divider.Position = UDim2.new(0, 5, 0, 24)
divider.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
divider.BorderSizePixel = 0
divider.Parent = chatFrame

-- Adjusted scroll frame to make room for input area at bottom
local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, -10, 1, -90)
scroll.Position = UDim2.new(0, 5, 0, 28)
scroll.BackgroundTransparency = 1
scroll.BorderSizePixel = 0
scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
scroll.ScrollBarThickness = 6
scroll.ScrollBarImageColor3 = Color3.fromRGB(100, 100, 100)
scroll.Parent = chatFrame

local chatList = Instance.new("UIListLayout")
chatList.SortOrder = Enum.SortOrder.LayoutOrder
chatList.Padding = UDim.new(0, 6)
chatList.Parent = scroll

chatList:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
    scroll.CanvasSize = UDim2.new(0, 0, 0, chatList.AbsoluteContentSize.Y + 6)
    local y = scroll.CanvasSize.Y.Offset - scroll.AbsoluteSize.Y
    if y < 0 then
        y = 0
    end
    scroll.CanvasPosition = Vector2.new(0, y)
end)

-- Added input area container
local inputContainer = Instance.new("Frame")
inputContainer.Size = UDim2.new(1, -10, 0, 52)
inputContainer.Position = UDim2.new(0, 5, 1, -57)
inputContainer.BackgroundTransparency = 1
inputContainer.Parent = chatFrame

-- Added text input box
local inputBox = Instance.new("TextBox")
inputBox.Size = UDim2.new(1, -65, 0, 36)
inputBox.Position = UDim2.new(0, 0, 0, 8)
inputBox.BackgroundColor3 = Color3.fromRGB(24, 24, 24)
inputBox.BorderSizePixel = 0
inputBox.Font = Enum.Font.Gotham
inputBox.TextSize = 14
inputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
inputBox.PlaceholderText = "Type a message..."
inputBox.PlaceholderColor3 = Color3.fromRGB(120, 120, 120)
inputBox.Text = ""
inputBox.TextXAlignment = Enum.TextXAlignment.Left
inputBox.ClearTextOnFocus = false
inputBox.Parent = inputContainer

local inputCorner = Instance.new("UICorner")
inputCorner.CornerRadius = UDim.new(0, 6)
inputCorner.Parent = inputBox

local inputPadding = Instance.new("UIPadding")
inputPadding.PaddingLeft = UDim.new(0, 10)
inputPadding.PaddingRight = UDim.new(0, 10)
inputPadding.Parent = inputBox

-- Added send button
local sendButton = Instance.new("TextButton")
sendButton.Size = UDim2.new(0, 55, 0, 36)
sendButton.Position = UDim2.new(1, -55, 0, 8)
sendButton.BackgroundColor3 = Color3.fromRGB(88, 101, 242)
sendButton.BorderSizePixel = 0
sendButton.Font = Enum.Font.GothamBold
sendButton.TextSize = 14
sendButton.TextColor3 = Color3.fromRGB(255, 255, 255)
sendButton.Text = "Send"
sendButton.Parent = inputContainer

local buttonCorner = Instance.new("UICorner")
buttonCorner.CornerRadius = UDim.new(0, 6)
buttonCorner.Parent = sendButton

local function getPlayerThumbnail(userId)
    local success, result = pcall(function()
        return Players:GetUserThumbnailAsync(userId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size100x100)
    end)
    return success and result or ""
end

local function addMessage(username, displayName, userId, message, thumbnailUrl)
    local msgFrame = Instance.new("Frame")
    msgFrame.Size = UDim2.new(1, 0, 0, 54)
    msgFrame.BackgroundColor3 = Color3.fromRGB(24, 24, 24)
    msgFrame.BorderSizePixel = 0
    msgFrame.Parent = scroll

    local msgCorner = Instance.new("UICorner")
    msgCorner.CornerRadius = UDim.new(0, 8)
    msgCorner.Parent = msgFrame

    local thumb = Instance.new("ImageLabel")
    thumb.Size = UDim2.new(0, 40, 0, 40)
    thumb.Position = UDim2.new(0, 6, 0, 7)
    thumb.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    thumb.Image = thumbnailUrl or ""
    thumb.Parent = msgFrame

    local thumbCorner = Instance.new("UICorner")
    thumbCorner.CornerRadius = UDim.new(1, 0)
    thumbCorner.Parent = thumb

    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, -56, 0, 20)
    nameLabel.Position = UDim2.new(0, 52, 0, 5)
    nameLabel.BackgroundTransparency = 1
    nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.TextSize = 13
    nameLabel.TextXAlignment = Enum.TextXAlignment.Left
    nameLabel.Text = displayName .. " (@" .. username .. ")"
    nameLabel.Parent = msgFrame

    local msgLabel = Instance.new("TextLabel")
    msgLabel.Size = UDim2.new(1, -56, 0, 22)
    msgLabel.Position = UDim2.new(0, 52, 0, 26)
    msgLabel.BackgroundTransparency = 1
    msgLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    msgLabel.Font = Enum.Font.Gotham
    msgLabel.TextSize = 13
    msgLabel.TextXAlignment = Enum.TextXAlignment.Left
    msgLabel.TextYAlignment = Enum.TextYAlignment.Top
    msgLabel.TextWrapped = true
    msgLabel.TextTruncate = Enum.TextTruncate.AtEnd
    msgLabel.Text = message
    msgLabel.Parent = msgFrame

    print("[GLOBAL CHAT]", displayName .. " (@" .. username .. "): " .. message)
    return msgFrame
end

local function sendMessage(message)
    if message == "" then
        return
    end
    local thumbnailUrl = getPlayerThumbnail(player.UserId)
    local bodyData = {
        apiKey = API_KEY,
        message = message,
        username = player.Name,
        displayName = player.DisplayName,
        userId = tostring(player.UserId),
        thumbnailUrl = thumbnailUrl
    }
    local body = HttpService:JSONEncode(bodyData)
    task.spawn(function()
        local result = makeRequest({
            Url = SEND_API_ENDPOINT,
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
                print("[GLOBAL CHAT] Sent:", message)
            else
                warn("[GLOBAL CHAT] Failed to send. Status:", code, "Response:", responseBody)
            end
        else
            warn("[GLOBAL CHAT] No response from server")
        end
    end)
end

-- Connected send button click event
sendButton.MouseButton1Click:Connect(function()
    local message = inputBox.Text
    if message and message ~= "" then
        sendMessage(message)
        inputBox.Text = ""
    end
end)

-- Connected enter key press to send message
inputBox.FocusLost:Connect(function(enterPressed)
    if enterPressed then
        local message = inputBox.Text
        if message and message ~= "" then
            sendMessage(message)
            inputBox.Text = ""
        end
    end
end)

_G.GlobalChatSend = sendMessage

local function loadChatHistory()
    if isInitialized then
        return
    end
    local result = makeRequest({
        Url = HISTORY_API_ENDPOINT .. "?apiKey=" .. HttpService:UrlEncode(API_KEY) .. "&limit=20",
        Method = "GET",
        Headers = {
            ["Content-Type"] = "application/json"
        }
    })
    if result then
        local code, body = normResponse(result)
        if code >= 200 and code < 300 then
            local decodeSuccess, data = pcall(function()
                return HttpService:JSONDecode(body)
            end)
            if decodeSuccess and data and data.success and data.messages then
                for _, msg in ipairs(data.messages) do
                    addMessage(msg.username, msg.display_name, msg.user_id, msg.message, msg.thumbnail_url)
                    if msg.id and msg.id > lastMessageId then
                        lastMessageId = msg.id
                    end
                end
            end
        end
    end
    isInitialized = true
end

local function checkNewMessages()
    local result = makeRequest({
        Url = CHAT_API_ENDPOINT .. "?apiKey=" .. HttpService:UrlEncode(API_KEY) .. "&lastId=" .. tostring(lastMessageId),
        Method = "GET",
        Headers = {
            ["Content-Type"] = "application/json"
        }
    })
    if result then
        local code, body = normResponse(result)
        if code >= 200 and code < 300 then
            local decodeSuccess, data = pcall(function()
                return HttpService:JSONDecode(body)
            end)
            if decodeSuccess and data and data.success and data.messages then
                for _, msg in ipairs(data.messages) do
                    if msg.id and msg.id > lastMessageId then
                        addMessage(msg.username, msg.display_name, msg.user_id, msg.message, msg.thumbnail_url)
                        lastMessageId = msg.id
                    end
                end
            end
        end
    end
end

task.spawn(loadChatHistory)

task.spawn(function()
    task.wait(3)
    while true do
        checkNewMessages()
        task.wait(2)
    end
end)

task.spawn(function()
    while true do
        sendPlayerHeartbeat()
        task.wait(5)
    end
end)

print("[GLOBAL CHAT] Minimal chat initialized.")
print("[GLOBAL CHAT] Use _G.GlobalChatSend(\\"your message\\") to send.")
print("[GLOBAL CHAT] Player:", player.Name)
print("[GLOBAL CHAT] API Key:", API_KEY:sub(1, 8) .. "...")
`

    return NextResponse.json({
      success: true,
      script: script,
    })
  } catch (error) {
    console.error("Error generating global chat script:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
