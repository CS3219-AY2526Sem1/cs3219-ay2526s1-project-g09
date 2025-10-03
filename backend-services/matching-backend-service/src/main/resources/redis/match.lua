-- Redis Lua script for atomic matchmaking with requestId check
-- KEYS[1] = poolKey (matchmaking:pool)
-- ARGV[1] = requestJson (serialized UserPreference with requestId)
-- ARGV[2] = userPrefKeyPrefix (userpref:)
local poolKey = KEYS[1]
local requestJson = ARGV[1]
local userPrefKeyPrefix = ARGV[2] or "userpref:"

if not poolKey or not requestJson then
    return nil
end

-- Parse request JSON
local reqWrapper
local success, err = pcall(function()
    reqWrapper = cjson.decode(requestJson)
end)
if not success or not reqWrapper or not reqWrapper.userPreference or not reqWrapper.requestId then
    redis.log(redis.LOG_WARNING, "Failed to decode request JSON or missing fields: " .. (err or "unknown"))
    return nil
end

local req = reqWrapper.userPreference
local requestId = reqWrapper.requestId
req.requestId = requestId -- attach requestId back to req for convenience
local userId = req.userId

local oldRequestDeleted = false
local oldRequestId = nil

-- Check if old request exists
local existingJson = redis.call("GET", userPrefKeyPrefix .. userId)
if existingJson then
    local existingWrapper = cjson.decode(existingJson)
    local existingId = existingWrapper.requestId
    local existing = existingWrapper.userPreference

    if existingId ~= requestId then
        redis.call("ZREM", poolKey, userId)
        redis.call("DEL", userPrefKeyPrefix .. userId)
        oldRequestDeleted = true
        oldRequestId = existingId
        redis.log(redis.LOG_NOTICE, "Removed old request for user " .. userId .. " with requestId " .. existingId)
    end
end

-- Helper functions
local function toSet(arr)
    local s = {}
    if arr and type(arr) == "table" then
        for _, v in ipairs(arr) do
            if v then
                s[v] = true
            end
        end
    end
    return s
end

local function hasOverlap(arr1, arr2)
    local set1 = toSet(arr1)
    if arr2 and type(arr2) == "table" then
        for _, v in ipairs(arr2) do
            if set1[v] then
                return true
            end
        end
    end
    return false
end

-- Convert request arrays to sets
local reqTopics = toSet(req.topics)
local reqDiffs = toSet(req.difficulties)

-- Check for a match
local candidates = redis.call("ZRANGE", poolKey, 0, -1)
for _, candidateId in ipairs(candidates) do
    if candidateId ~= userId then
        local candidateJson = redis.call("GET", userPrefKeyPrefix .. candidateId)
        if candidateJson then
            local candidateWrapper
            local parseSuccess, parseErr = pcall(function()
                candidateWrapper = cjson.decode(candidateJson)
            end)
            if parseSuccess and candidateWrapper then
                local candidate = candidateWrapper.userPreference
                local timeOverlap = true
                if req.minTime and req.maxTime and candidate.minTime and candidate.maxTime then
                    timeOverlap = (candidate.minTime <= req.maxTime and req.minTime <= candidate.maxTime)
                end
                local diffOverlap = hasOverlap(candidate.difficulties, req.difficulties)
                local topicOverlap = hasOverlap(candidate.topics, req.topics)

                if timeOverlap and diffOverlap and topicOverlap then
                    redis.call("ZREM", poolKey, candidateId)
                    redis.call("DEL", userPrefKeyPrefix .. candidateId)
                    redis.log(redis.LOG_NOTICE, "Match found: " .. userId .. " with " .. candidateId)

                    return cjson.encode({
                        matched = {
                            userPreference = candidate,
                            requestId = candidateWrapper.requestId
                        },
                        selfRequestId = requestId, -- the current request's ID
                        oldRequestDeleted = oldRequestDeleted,
                        oldRequestId = oldRequestId
                    })
                end
            else
                redis.log(redis.LOG_WARNING, "Failed to parse candidate JSON for " .. candidateId)
                redis.call("ZREM", poolKey, candidateId)
                redis.call("DEL", userPrefKeyPrefix .. candidateId)
            end
        else
            redis.call("ZREM", poolKey, candidateId)
        end
    end
end

-- No match found, add user to pool
local currentTime = redis.call("TIME")[1]
redis.call("ZADD", poolKey, currentTime, userId)
redis.call("SET", userPrefKeyPrefix .. userId, requestJson)
redis.log(redis.LOG_NOTICE, "No match found for " .. userId .. ", added to pool")

return cjson.encode({
    matched = nil,
    selfRequestId = requestId,
    oldRequestDeleted = oldRequestDeleted,
    oldRequestId = oldRequestId
})
