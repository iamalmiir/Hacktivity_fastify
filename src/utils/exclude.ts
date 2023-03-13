export const exclude = (obj: any, keys: string[]) => {
  for (const key of keys) {
    delete obj[key]
  }
  return obj
}

// Exclude keys from an array of objects
export const excludeArray = (arr: any[], keys: string[]) => {
  return arr.map((obj) => exclude(obj, keys))
}
