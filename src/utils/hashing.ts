import bcrypt from 'bcryptjs'

// Salt rounds
const salt = 13

// Hash password
export const hashPassword = async (password: string) => {
  const hashedPassword = await bcrypt.hash(password, salt)
  return hashedPassword
}

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  const isMatch = await bcrypt.compare(password, hashedPassword)
  return isMatch
}
