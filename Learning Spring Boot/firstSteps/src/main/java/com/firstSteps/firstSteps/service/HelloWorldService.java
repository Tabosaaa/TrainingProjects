package com.firstSteps.firstSteps.service;

import org.springframework.stereotype.Service;

@Service
public class HelloWorldService {
    public String hello(String name) {
        return "Hello World " + name;
    }
}
