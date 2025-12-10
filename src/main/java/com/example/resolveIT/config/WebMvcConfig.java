package com.example.resolveIT.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    public WebMvcConfig() {
        System.out.println(">>> WebMvcConfig Loaded!");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // Automatically detect absolute path of your "uploads" folder
        String uploadPath = System.getProperty("user.dir") + "/uploads/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath);

        System.out.println("UPLOAD PATH = " + uploadPath);

    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
