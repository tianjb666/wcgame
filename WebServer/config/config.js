
gameHttpAddress = process.env.GAME_SERVER || "http://gameserver:13009"

mongo = {
  host: process.env.MONGO_HOST || "mongodb",
  port: process.env.MONGO_PORT  || 27017,
  database: process.env.MONGO_DB || "game",
  user: process.env.MONGO_USER ||  "root",
  password: process.env.MONGO_PASSWORD || "123456"
} 

redis=  {
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || ""
}

module.exports = {mongo , redis , gameHttpAddress}