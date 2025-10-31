-- Redis Lua script for atomic matchmaking with requestId check
-- KEYS[1] = poolKey (matchmaking:pool)
-- ARGV[1] = requestJson (serialized UserPreference with requestId)
-- ARGV[2] = userPrefKeyPrefix (userpref:)
-- 
-- Example requestJson (ARGV[1]):
-- {
--   "requestId": "req123",
--   "userPreference": {
--     "userId": "userA",
--     "topics": {
--       "OOP": ["Easy", "Medium"],
--       "Python": ["Hard"]
--     }
--   }
-- }
--
-- Example response (when a match is found):
-- {
--   "matched": {
--     "userPreference": {
--       "userId": "userB",
--       "topics": {
--         "OOP": ["Medium"],
--         "Python": ["Hard"]
--       }
--     },
--     "requestId": "req456"
--   },
--   "selfRequestId": "req123",
--   "oldRequestDeleted": false,
--   "oldRequestId": null
-- }
--
-- Example response (no match found):
-- {
--   "matched": null,
--   "selfRequestId": "req123",
--   "oldRequestDeleted": false,
--   "oldRequestId": null
-- }
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

    if existingId ~= requestId then
        redis.call("ZREM", poolKey, userId)
        redis.call("DEL", userPrefKeyPrefix .. userId)
        oldRequestDeleted = true
        oldRequestId = existingId
        redis.log(redis.LOG_NOTICE, "Removed old request for user " .. userId .. " with requestId " .. existingId)
    end
end

-- Helper function: convert array to set
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

-- Helper function: check topic + difficulty overlap
local function hasTopicDifficultyOverlap(reqTopics, candidateTopics)
    for topic, reqDiffs in pairs(reqTopics) do
        local candDiffs = candidateTopics[topic]
        if candDiffs then
            local reqSet = toSet(reqDiffs)
            for _, diff in ipairs(candDiffs) do
                if reqSet[diff] then
                    return true
                end
            end
        end
    end
    return false
end

-- Parse request topics (map)
local reqTopics = req.topics -- table: topic -> array of difficulties

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
                local candidateTopics = candidate.topics -- table: topic -> array of difficulties

                -- Check topic + difficulty overlap
                local matchFound = hasTopicDifficultyOverlap(reqTopics, candidateTopics)

                if matchFound then
                    redis.call("ZREM", poolKey, candidateId)
                    redis.call("DEL", userPrefKeyPrefix .. candidateId)
                    redis.log(redis.LOG_NOTICE, "Match found: " .. userId .. " with " .. candidateId)

                    return cjson.encode({
                        matched = {
                            userPreference = candidate,
                            requestId = candidateWrapper.requestId
                        },
                        selfRequestId = requestId,
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
