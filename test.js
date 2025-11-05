/*
This file will serve as the main testing file for the project.
*/

const { exp } = require("three/tsl");

//Imports

//Global variables
testCount = 0;
failedTests = "";


function main(){
//initialize
finalResult = "";

//Call tests

//Concatonate final result
concat(finalResult, "Tests Complete \n Tests Conducted: \n");
concat(finalResult, testCount);
concat(finalResult, "Failed Tests: \n", failedTests);

//print final result
console.log(finalResult);

}

function testResults(testFunc){
    //initialize
    testCount += 1;
    testName = testFunc.name;

    if (testFunc != null){
        result, expectedResult = testFunct();
        if (result  == expectedResult){
            console.log(testName, ": Passed")
            return 1
        }
        if (result != expectedResult){
            console.log(testName, ": Failed")
            concat(failedTests, testName , "\n");
            return -1
        }
    }
    if (testFunc == null) {
        console.log("An error occurred with params");
        return -2;
    }
}