package com.iolabs.salescore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties
public class SalescoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(SalescoreApplication.class, args);
    }
}
