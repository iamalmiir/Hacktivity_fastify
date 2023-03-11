export const exclude = (obj: any, keys: string[]) => {
  for (const key of keys) {
    delete obj[key]
  }
  return obj
}
