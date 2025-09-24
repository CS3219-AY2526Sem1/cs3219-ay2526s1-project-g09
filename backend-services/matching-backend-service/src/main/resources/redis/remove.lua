local poolKey = KEYS[1]
local userId = ARGV[1]
local prefKeyPrefix = ARGV[2]

-- Remove from matchmaking pool
local removed = redis.call("ZREM", poolKey, userId)

-- Delete cached preferences
redis.call("DEL", prefKeyPrefix .. userId)

-- Return whether removal happened
return removed
