var angularApp = angular.module('angularApp', []);

angularApp.controller('mainController', function($scope, arrayProcessor){

    //check to see if we can use web workers for the heavy 
    //computational lifting
    var useWorkers = false;
    if (typeof(Worker) !== "undefined") useWorkers = true;

    $scope.arraySize = 100000;
    $scope.duplicatePercentage = 50;
    
    $scope.getEmailArray = function () {
        $scope.arraySorted = false;
        $scope.generatingArray = true;

        /*
        Since we might conveivably have to with array lengths in the
        hundreds of thousands, I thought it might be a good time to take
        advantage of web workers. If they're available, they'll handle
        all the heavy computational lifting.
        */
        if (useWorkers) {
            if(typeof(worker) == "undefined") {
                w = new Worker("arrayGenerator.js");
            }      
            var data = {    
                size: $scope.arraySize,
                dupeNum: $scope.duplicatePercentage
            }
            w.postMessage(data)
            w.onmessage = function(message) {
                $scope.emailArray = message.data;
                $scope.generatingArray = false;
                $scope.$apply();
                w.terminate();
                w = undefined;
            };
        } else {
            //if there's no web workers available, we'll fall back on
            //the traditional service structure.
            $scope.emailArray = arrayProcessor.generateArray($scope.arraySize, $scope.duplicatePercentage);
            $scope.generatingArray = false;
        }
    }

    $scope.removeDuplicateEmails = function (fast) {
        $scope.removingDupes = true;
        if (useWorkers) {
            if(typeof(worker) == "undefined") {
                w = new Worker("arrayProcessor.js");
            }      
            var data = {    
                array: $scope.emailArray,
                fast: fast
            }
            w.postMessage(data)
            w.onmessage = function(message) {
                console.log(message);
                $scope.emailArray = message.data.array;
                $scope.removalTime = message.data.timer;
                $scope.arraySorted = true;
                $scope.removingDupes = false;
                $scope.$apply();
                w.terminate();
                w = undefined;
            };
        } else { 
            $scope.emailArray = arrayProcessor.removeDuplicates($scope.emailArray, fast);
            $scope.removalTime = arrayProcessor.timer;
            $scope.arraySorted = true;
            $scope.removingDupes = false;
        }

    }

})

angularApp.service('arrayProcessor', function(){


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

    this.generateArray = function (size, dupeNum) {
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

    this.removeDuplicates = function (array, fastRemove) {
        var start = new Date().getTime();
        
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
            array.forEach(function(item){
                for (var i = 0; i < array.length; i++) {
                    if (new Date().getTime() - start > 5000) {

                        return;
                    }
                    var item = array[i];
                    var itemCounter = 1;
                    for (var j = i + 1; j < array.length; j++) {
                        if (array[j] == item) {
                            itemCounter ++;
                            if (itemCounter > 1) {
                                array.splice(j, 1);
                            }
                        }
                    }
                }
            })
        }

        var end = new Date().getTime();
        this.timer = end - start;
        returnArray = returnArray ? returnArray : array;
        return returnArray;
    }
})