var removeDuplicates = function (array, fastRemove, start) {
    
    //first, does the user want a fast search, or a slower,
    //but less memory intesive search?
    if (fastRemove) {
        /*
        Fast search it is! In short: go through the array
        of emails and check each one against a hashtable.
        if the table doesn't contain a key matching the 
        email, then we know we've found either a  unique 
        email, or the first of a series of duplicates.
        We shove the email into a new array, and move on 
        to the next. If an email matches a key in the hash,
        then we know we've found a duplicate, and ignore it.
        */
        var returnArray = [];
        var emailHash = {};
        array.forEach(function(item){
            if (!emailHash[item]) {
                emailHash[item] = 1;
                returnArray.push(item);
            }
        })
    } else {
        /*
        What's that? You don't care so much about speed, you
        say? Well, why not try this (very) slow-but-memory-light
        option? Here's how it works: We go through the array,
        and for each option, we look through the entire rest of
        the array for duplicates. If we find a duplicate, we
        splice it out.
        */
        for(var i = 0; i < array.length; i++){
            if (new Date().getTime() - start > 5000) {
                return false;
            }
            var itemCounter = 1;
            for (var j = array.length - 1; j > i; j--) {
                if (array[j] == array[i]) {
                    itemCounter ++;
                    if (itemCounter > 1) {
                        array.splice(j, 1);
                    }
                }
            }
        }
        array.forEach(function(item){

        })
    }

    returnArray = returnArray ? returnArray : array;
    return returnArray;
}

self.addEventListener("message", function(message) {
    var start = new Date().getTime();

    var array = removeDuplicates(message.data.array, message.data.fast, start);

    var end = new Date().getTime();
    var timer = end - start;

    postMessage({array: array, timer: timer});
}, false);