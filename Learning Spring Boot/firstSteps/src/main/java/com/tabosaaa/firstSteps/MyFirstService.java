package com.tabosaaa.firstSteps;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class MyFirstService {

    private MyFirstClass myfirstClass;

    public MyFirstService(MyFirstClass myfirstClass) {
        this.myfirstClass = myfirstClass;
    }

    public void injectDependencies(
            @Qualifier("bean1") MyFirstClass myfirstClass) {
        this.myfirstClass = myfirstClass;
    }

    public String tellAStory() {
        return "the dependency is saying: " + myfirstClass.sayHello();
    }
}
