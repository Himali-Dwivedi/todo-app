module.exports.getDate = getDate;

function getDate() {
  const today = new Date();

  var options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };

  /*
    toLocaleDateString() is used to format date with the specicied options
*/
  var day = today.toLocaleDateString("en-US", options);
  return day;
}
