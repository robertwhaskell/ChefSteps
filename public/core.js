var app = angular.module('app', []);

app.controller('mainController', function($scope, arrayProcessor, testSuite){

    //check to see if we can use web workers are available.
    var useWorkers = false;
    if (typeof(Worker) !== "undefined") useWorkers = true;

    $scope.arraySize = 100000;
    $scope.duplicatePercentage = 50;
    $scope.progressText = 'No Array Generated';
    
    $scope.getEmailArray = function () {
        $scope.arraySorted = false;
        $scope.generatingArray = true;
        $scope.progressText = 'Generating array...';
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
                $scope.progressText = 'Array available.';
                console.log('Generated email array:');
                console.log($scope.emailArray);
                $scope.$apply();
                w.terminate();
                w = undefined;
            };
        } else {
            //if there's no web workers available, we'll fall back on
            //the traditional service structure.
            $scope.emailArray = arrayProcessor.generateArray($scope.arraySize, $scope.duplicatePercentage);
            $scope.generatingArray = false;
            $scope.progressText = 'Array available.';
            console.log('Generated email array:');
            console.log($scope.emailArray);
        }
    }

    $scope.removeDuplicateEmails = function (fast) {
        $scope.progressText = 'Removing duplicates...';
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
                $scope.emailArray = message.data.array;
                $scope.removalTime = message.data.timer;
                $scope.arraySorted = true;
                $scope.removingDupes = false;
                $scope.progressText = $scope.emailArray ? 'Duplicates Removed.' : 'Process timed out';
                console.log('Array with duplicates stripped:');
                console.log($scope.emailArray);
                $scope.$apply();
                w.terminate();
                w = undefined;
            };
        } else { 
            $scope.emailArray = arrayProcessor.removeDuplicates($scope.emailArray, fast);
            $scope.removalTime = arrayProcessor.timer;
            $scope.arraySorted = true;
            $scope.removingDupes = false;
            $scope.progressText = $scope.emailArray ? 'Duplicates Removed.' : 'Process timed out';
            console.log('Array with duplicates stripped:');
            console.log($scope.emailArray);
        }

    }

})

app.service('arrayProcessor', function(){


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
        if (size == 0) return [];
        var dupeDiff = Math.floor(size * dupeNum/100)
        if (dupeDiff == size) dupeDiff--;
        var emailArray = [];
        var emailHash = {};
        for (var i = 0; i < size - dupeDiff; i++) {
            var email = Math.random() + '@email.com';
            while (emailHash[email]) {
                email = Math.random() + '@email.com';
            }
            emailArray.push(Math.random() + '@email.com');
            emailHash[email] = 0;
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
});

app.service('testSuite', function(arrayProcessor){
    var failArray = []
    var testPass = true;
    //tests for array generation

    //Easy test: If I want an array with no duplicates, of size 5,
    //I should recieve an array who's length == 5, and that contains
    //no duplicates.
    var easyArray = arrayProcessor.generateArray(5, 0);
    if (easyArray.length == 5) {
        for (var i = 0; i < easyArray.length; i++){
            for (var j = i + 1; j < easyArray.length; j++) {
                if (easyArray[i] == easyArray[j]) {
                    testPass = false;
                }
            }
        }
    } else {
        testPass = false;
    }

    if (!testPass) failArray.push('easyArray test failed');

    //slightly more complicated: same test, much larger array.
    testPass = true;
    var lessEasyArray = arrayProcessor.generateArray(2000, 0);
    if (lessEasyArray.length == 2000) {
        for (var i = 0; i < lessEasyArray.length; i++){
            for (var j = i + 1; j < lessEasyArray.length; j++) {
                if (lessEasyArray[i] == lessEasyArray[j]) {
                    testPass = false;
                }
            }
        }
    } else {
        testPass = false;
    }

    if (!testPass) failArray.push('lessEasyArray test failed');

    //if I want an array of length 4 with 50% duplications, I 
    //should get back and array of length 4, with two unique values,
    //and two duplicates
    testPass = true;
    var evenDuplicatArray = arrayProcessor.generateArray(4, 50);
    var duplicateCounter = 0;
    if (evenDuplicatArray.length == 4) {
        for (var i = 0; i < evenDuplicatArray.length; i++){
            for (var j = i + 1; j < evenDuplicatArray.length; j++) {
                if (evenDuplicatArray[i] == evenDuplicatArray[j]) {
                    duplicateCounter++;
                }
            }
        }
    } else {
        testPass = false;
    }

    if (duplicateCounter != 2) {
        testPass = false;
    }

    if (!testPass) failArray.push('evenDuplicateArray test failed');

    //if I want an array of length 5 with 50% duplications, I 
    //should get back and array of length 5, with three unique values,
    //and two duplicates
    testPass = true;
    var oddDuplicatArray = arrayProcessor.generateArray(4, 50);
    duplicateCounter = 0;
    if (oddDuplicatArray.length == 4) {
        for (var i = 0; i < oddDuplicatArray.length; i++){
            for (var j = i + 1; j < oddDuplicatArray.length; j++) {
                if (oddDuplicatArray[i] == oddDuplicatArray[j]) {
                    duplicateCounter++;
                }
            }
        }
    } else {
        testPass = false;
    }

    if (duplicateCounter != 2) {
        testPass = false;
    }

    if (!testPass) failArray.push('oddDuplicatArray test failed');

    //if I pass want an array of length 0, I should be returned an
    //empty array
    testPass = true;
    var emptyArray = arrayProcessor.generateArray(0, 50);
    if (emptyArray.length) failArray.push('emptyArray test failed');


    //tests for duplication removal;

    //testing for fast removal: 

    //if I pass in an array with no duplicates, I should get an
    //array with the same elements, in the same order, back
    testPass = true;
    var easyDupeRemoveArray = arrayProcessor.generateArray(4, 0);
    var otherArray = arrayProcessor.removeDuplicates(easyDupeRemoveArray, true);
    if (easyDupeRemoveArray.length == otherArray.length) {
        for (var i = 0; i < easyDupeRemoveArray; i++) {
            if (easyDupeRemoveArray[i] != otherArray[i]) {
                testPass = false;
                break;
            }
        }
    } else {
        testPass = false;
    }

    if (!testPass) failArray.push('easyDupeRemoveArray test failed');

    //if I pass in an empty array, I should get an empty array back
    var emptyDupeRemoveArray = arrayProcessor.removeDuplicates([], true);
    if (emptyDupeRemoveArray.length != 0) {
        failArray.push('emptyDupeRemoveArray test failed');
    }

    //if I pass in an array with length five and 50% duplicates, I should 
    //get back an array of length 3, which contains all of the unique emails 
    //from the previous array, in order;
    testPass = true;
    var initialArray = arrayProcessor.generateArray(3, 0);
    var basicDupeRemoveArray = initialArray.slice();
    for (var i = 0; i < 2; i++) {
        basicDupeRemoveArray.push(initialArray[i]);
    }
    var basicDupeRemoveArray = arrayProcessor.removeDuplicates(basicDupeRemoveArray, true);
    if (basicDupeRemoveArray.length == initialArray.length) {
        for (var i = 0; i < basicDupeRemoveArray.length; i++) {
            if (basicDupeRemoveArray[i] != initialArray[i]) {
                testPass = false;
                break;
            }
        }
    } else {
        testPass = false;
    }
    if (!testPass) failArray.push('basicDupeRemoveArray test failed');

    //testing for slow removal: 

    //if I pass in an array with no duplicates, I should get the 
    //same array back;
    var easyDupeRemoveArraySlow = arrayProcessor.generateArray(4, 0);
    var otherArray = arrayProcessor.removeDuplicates(easyDupeRemoveArraySlow, false);
    if (easyDupeRemoveArraySlow != otherArray) failArray.push('easyDupeRemoveArraySlow test failed');

    //if I pass in an empty array, I should get the same array back;
    var emptyDupeRemoveArraySlow = arrayProcessor.generateArray(0, 0);
    var otherArray = arrayProcessor.removeDuplicates(emptyDupeRemoveArraySlow, false);
    if (emptyDupeRemoveArraySlow != otherArray) failArray.push('emptyDupeRemoveArraySlow test failed');

    //if I pass in an array with length five and 50% duplicates, I should 
    //get back an array of length 3, which contains all of the unique emails 
    //from the previous array, in order;
    var initialArray = arrayProcessor.generateArray(3, 0);
    var basicDupeRemoveArraySlow = initialArray;
    for (var i = 0; i < 2; i++) {
        basicDupeRemoveArraySlow.push(initialArray[i]);
    }
    var basicDupeRemoveArraySlow = arrayProcessor.removeDuplicates(basicDupeRemoveArraySlow, false);
    if (basicDupeRemoveArraySlow != initialArray) failArray.push('basicDupeRemoveArraySlow test failed');

    if (failArray.length) {
        console.log('tests failed: ' + failArray.join(', '));
    } else {
        console.log('all tests passed!')
    }

})
