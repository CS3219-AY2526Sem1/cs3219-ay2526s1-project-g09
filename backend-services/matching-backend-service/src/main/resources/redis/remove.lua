-- Redis Lua script for atomic removal of a user's matchmaking entry.
-- KEYS[1] = poolKey
-- ARGV[1] = userId to remove
-- ARGV[2] = userPrefKeyPrefix
local poolKey = KEYS[1]
local userId = ARGV[1]
local prefKeyPrefix = ARGV[2]

-- Remove from matchmaking pool
local removed = redis.call("ZREM", poolKey, userId)

-- Fetch cached preference before deleting
local prefKey = prefKeyPrefix .. userId
local cachedPref = redis.call("GET", prefKey)

local requestId = nil
if cachedPref then
    local ok, pref = pcall(cjson.decode, cachedPref)
    if ok and pref and pref.requestId then
        requestId = pref.requestId
    end
end

-- Delete cached preferences
redis.call("DEL", prefKey)

-- Return JSON string
return cjson.encode({
    removed = removed > 0,
    userId = userId,
    requestId = requestId
})
