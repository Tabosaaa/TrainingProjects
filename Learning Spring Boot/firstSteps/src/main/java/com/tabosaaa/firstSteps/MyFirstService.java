package com.tabosaaa.firstSteps;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MyFirstService {

    private final MyFirstClass myfirstClass;

    public MyFirstService(MyFirstClass myfirstClass) {
        this.myfirstClass = myfirstClass;
    }

    public String tellAStory() {
        return "the dependency is saying: " + myfirstClass.sayHello();
    }
}
