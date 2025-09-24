-- Redis Lua script for atomic matchmaking
-- KEYS[1] = poolKey (matchmaking:pool)
-- ARGV[1] = requestJson (serialized UserPreference)
-- ARGV[2] = userPrefKeyPrefix (userpref:)

local poolKey = KEYS[1]
local requestJson = ARGV[1]
local userPrefKeyPrefix = ARGV[2] or "userpref:"

-- Validate input
if not poolKey or not requestJson then
    return nil
end

-- Parse request JSON with error handling
local req
local success, err = pcall(function()
    req = cjson.decode(requestJson)
end)

if not success or not req or not req.userId then
    redis.log(redis.LOG_WARNING, "Failed to decode request JSON or missing userId: " .. (err or "unknown error"))
    return nil
end

-- Helper: convert array -> set (Lua table with true values)
local function toSet(arr)
    if not arr or type(arr) ~= "table" then
        return {}
    end
    local s = {}
    for _, v in ipairs(arr) do
        if v then
            s[v] = true
        end
    end
    return s
end

-- Helper: check if arrays have overlap
local function hasOverlap(arr1, arr2)
    if not arr1 or not arr2 or type(arr1) ~= "table" or type(arr2) ~= "table" then
        return false
    end
    
    local set1 = toSet(arr1)
    for _, v in ipairs(arr2) do
        if set1[v] then
            return true
        end
    end
    return false
end

-- Convert request arrays to sets for faster lookup
local reqTopics = toSet(req.topics)
local reqDiffs = toSet(req.difficulties)

-- Get all candidate userIds in pool
local candidates = redis.call("ZRANGE", poolKey, 0, -1)

for _, candidateId in ipairs(candidates) do
    -- Skip self
    if candidateId ~= req.userId then
        -- Fetch candidate's full preferences from cache
        local candidateJson = redis.call("GET", userPrefKeyPrefix .. candidateId)
        
        if candidateJson then
            -- Parse candidate JSON with error handling
            local candidate
            local parseSuccess, parseErr = pcall(function()
                candidate = cjson.decode(candidateJson)
            end)
            
            if parseSuccess and candidate then
                -- Check time overlap (ensure both have valid time ranges)
                local timeOverlap = true
                if req.minTime and req.maxTime and candidate.minTime and candidate.maxTime then
                    timeOverlap = (candidate.minTime <= req.maxTime and req.minTime <= candidate.maxTime)
                end
                
                -- Check difficulty overlap
                local diffOverlap = hasOverlap(candidate.difficulties, req.difficulties)
                
                -- Check topic overlap
                local topicOverlap = hasOverlap(candidate.topics, req.topics)
                
                -- If all conditions match
                if timeOverlap and diffOverlap and topicOverlap then
                    -- Match found → remove from pool and return candidate
                    redis.call("ZREM", poolKey, candidateId)
                    redis.call("DEL", userPrefKeyPrefix .. candidateId)
                    redis.log(redis.LOG_NOTICE, "Match found: " .. req.userId .. " matched with " .. candidateId)
                    return candidateJson
                end
            else
                -- Log parsing error and clean up invalid entry
                redis.log(redis.LOG_WARNING, "Failed to parse candidate JSON for " .. candidateId .. ", removing from pool")
                redis.call("ZREM", poolKey, candidateId)
                redis.call("DEL", userPrefKeyPrefix .. candidateId)
            end
        else
            -- Candidate preferences not found, remove stale entry from pool
            redis.call("ZREM", poolKey, candidateId)
        end
    end
end

-- No match found → add user to pool and cache preferences
local currentTime = redis.call("TIME")[1]
redis.call("ZADD", poolKey, currentTime, req.userId)
redis.call("SET", userPrefKeyPrefix .. req.userId, requestJson)

redis.log(redis.LOG_NOTICE, "No match found for " .. req.userId .. ", added to pool")
return nil