export const convertDate = (date: Date, months: Record<number, string>, short = true) => {
  const dayNum = `0${date.getDate()}`.slice(-2)
  const month = short ? months[date.getMonth()].substring(0, 3) : months[date.getMonth()]
  const year = date.getFullYear()
  return `${dayNum} ${month}, ${year}`
}
