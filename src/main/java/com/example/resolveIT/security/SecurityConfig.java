package com.example.resolveIT.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }
    

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (for APIs)
            .csrf(csrf -> csrf.disable())

            // Set permissions
            .authorizeHttpRequests(auth -> auth
                // Allow static frontend files
                .requestMatchers("/", "/index.html", "/assets/**", "/favicon.ico").permitAll()
                // Allow authentication endpoints
                .requestMatchers(
                    "/api/auth/**",
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/anonymous"
                ).permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/officer/**").hasRole("ADMIN")
                .requestMatchers("/uploads/**").permitAll()
                // Everything else requires authentication
                .anyRequest().authenticated()
            )

            // Use stateless sessions
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Disable form login and HTTP basic
            .formLogin(form -> form.disable())
            .httpBasic(httpBasic -> httpBasic.disable());

        // Add JWT filter before UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
