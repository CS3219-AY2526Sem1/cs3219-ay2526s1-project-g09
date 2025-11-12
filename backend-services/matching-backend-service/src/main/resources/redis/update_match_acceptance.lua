-- Redis Lua script for atomic updating of match details
-- KEYS[1] = match key prefix in Redis
-- ARGV[1] = matchId
-- ARGV[2] = userId
-- ARGV[3] = newStatus ("CONNECTED", "ACCEPTED", "REJECTED")
local prefix = KEYS[1]
local matchId = ARGV[1]
local userId = ARGV[2]
local newStatus = ARGV[3]

local matchKey = prefix .. matchId
local timestampKey = matchKey .. ":timestamp"

local data = redis.call('GET', matchKey)
if not data then
    return nil
end

local tsValue = redis.call("GET", timestampKey)
if not tsValue then
    return data -- return original JSON if timestamp missing
end

local age = redis.call("TIME")[1] - tonumber(tsValue)

-- Decode JSON to check current connection state
local status = cjson.decode(data)
local alreadyConnected = false

if status.matchDetails.user1Id == userId and status.user1Accepted == "CONNECTED" then
    alreadyConnected = true
elseif status.matchDetails.user2Id == userId and status.user2Accepted == "CONNECTED" then
    alreadyConnected = true
end

-- If match is older than 10s and user is not already CONNECTED then mark as EXPIRED
if age > 10 and not alreadyConnected then
    if status.matchDetails.user1Id == userId then
        status.user1Accepted = "EXPIRED"
    elseif status.matchDetails.user2Id == userId then
        status.user2Accepted = "EXPIRED"
    end

    local expiredJson = cjson.encode(status)
    redis.call("SET", matchKey, expiredJson)
    return expiredJson
end

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
