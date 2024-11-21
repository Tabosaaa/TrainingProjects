package com.tabosaaa.firstSteps;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfig {

    @Bean()
    public MyFirstClass myFirstBean() {
        return new MyFirstClass("First Bean");
    }

    @Bean()
    public MyFirstClass mySecondBean() {
        return new MyFirstClass("First Bean");
    }
}
