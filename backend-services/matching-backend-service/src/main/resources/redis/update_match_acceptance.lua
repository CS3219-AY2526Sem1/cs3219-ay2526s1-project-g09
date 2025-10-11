-- Redis Lua script for atomic updating of match details
-- KEYS[1] = match key prefix in Redis
-- ARGV[1] = matchId
-- ARGV[2] = userId
-- ARGV[3] = newStatus ("ACCEPTED" or "REJECTED")
-- ARGV[4] = publishChannel (empty string if no publish)
local prefix = KEYS[1]
local matchId = ARGV[1]
local userId = ARGV[2]
local newStatus = ARGV[3]
local publishChannel = ARGV[4]

local matchKey = prefix .. matchId
local data = redis.call('GET', matchKey)
if not data then
    return nil
end

local status = cjson.decode(data)

if status.matchDetails.user1Id == userId then
    status.user1Accepted = newStatus
elseif status.matchDetails.user2Id == userId then
    status.user2Accepted = newStatus
else
    return nil -- user not part of match
end

local json = cjson.encode(status)

redis.call('SET', matchKey, json) -- Updates data

return json
