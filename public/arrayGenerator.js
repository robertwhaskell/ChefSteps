var shuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var generateArray = function (size, dupeNum) {
    var dupeDiff = Math.floor(size * dupeNum/100)
    if (dupeDiff == size) dupeDiff--;
    var emailArray = [];
    for (var i = 0; i < size - dupeDiff; i++) {
        emailArray.push(Math.random() + '@email.com');
    }
    for (var i = 0; i < dupeDiff; i++) {
        emailArray.push(emailArray[i]);
    }
    return shuffle(emailArray);
}

self.addEventListener("message", function(message) {
    var array = generateArray(message.data.size, message.data.dupeNum)
    postMessage(array);
}, false);
// }

// timedCount();