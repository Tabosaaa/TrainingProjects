package com.example.first_spring_app.controller;


import com.example.first_spring_app.domain.User;
import com.example.first_spring_app.service.HelloWorldService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/hello")
public class HelloWorldController {

    @Autowired
    private HelloWorldService helloWorldService;


    @GetMapping
    public String helloWorld() {
        return helloWorldService.helloWorld("Lucas");
    }

    @PostMapping("")
    public String helloWorldPost(@RequestBody User body) {
        return "Hello World "+ body.getName() + " " + body.getEmail();
    }
}
