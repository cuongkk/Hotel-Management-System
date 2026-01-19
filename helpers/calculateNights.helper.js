module.exports.calculateNights = (checkIn, checkOut = new Date()) => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  inDate.setHours(0, 0, 0, 0);
  outDate.setHours(0, 0, 0, 0);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffTime = outDate - inDate;
  return Math.max(1, Math.ceil(diffTime / MS_PER_DAY));
}
