package com.firstSteps.firstSteps.controller;

import com.firstSteps.firstSteps.service.HelloWorldService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.firstSteps.firstSteps.domain.user;

@RestController
@RequestMapping("/hello")
public class HelloWorldController {

    @Autowired
    private HelloWorldService helloWorldService;


    @GetMapping
    public String hello() {
        return helloWorldService.hello("LUCAS");
    }

    @PostMapping("/id")
    public  String helloPost(@PathVariable("id") String id, @ResponseBody user body) {
        return "Hello" + body.getName();
    }

}
