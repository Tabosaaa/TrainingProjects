package com.tabosaaa.firstSteps;


import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

public class MyFirstClass {

    private String myVar;

    public MyFirstClass(String myVar) {
        this.myVar = myVar;
    }

    public String sayHello() {
        return "Hello from my firs Class ==> myVar = " + myVar;
    }
}