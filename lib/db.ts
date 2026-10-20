import mongoose from "mongoose"

const g = globalThis as unknown as {
  _mongoose?: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

const cache = (g._mongoose ??= { conn: null, promise: null })

export async function connectDB() {
  if (cache.conn) {
    return cache.conn
  }

  let uri = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim()
  if (!uri) {
    throw new Error("MONGODB_URI is not set in .env.local")
  }

  // Handle trailing '?' if present without query params
  if (uri.endsWith("?")) {
    uri += "retryWrites=true&w=majority"
  }

  cache.promise ??= mongoose.connect(uri, {
    bufferCommands: false,
  })

  try {
    cache.conn = await cache.promise
  } catch (error) {
    cache.promise = null
    throw error
  }

  return cache.conn
}
