export const CONFIG = {
  keys: process.env.SESSION_KEY,
  maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false,
  secure: true,
}
