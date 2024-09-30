package com.firstSteps.firstSteps.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HelloConfiguration {

    @Bean
    public SDKAWS sdkAWS() {
        return new SDKAWS();
    }
}
