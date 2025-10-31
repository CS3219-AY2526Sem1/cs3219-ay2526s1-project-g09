-- Redis Lua script for atomic saving of match details and user id to match id mapping
-- KEYS[1] = match key prefix (e.g., "match:")
-- KEYS[2] = pool key prefix (e.g., "matched_pool:")
-- ARGV[1] = matchId
-- ARGV[2] = user1Id
-- ARGV[3] = user2Id
-- ARGV[4] = serialized MatchAcceptanceStatus JSON
-- ARGV[5] = TTL in seconds
local matchKey = KEYS[1] .. ARGV[1]
local user1Key = KEYS[2] .. ARGV[2]
local user2Key = KEYS[2] .. ARGV[3]

-- Save the match details
redis.call("SET", matchKey, ARGV[4], "EX", ARGV[5])

-- Save both user → matchId mappings
redis.call("SET", user1Key, ARGV[1], "EX", ARGV[5])
redis.call("SET", user2Key, ARGV[1], "EX", ARGV[5])

return "OK"
