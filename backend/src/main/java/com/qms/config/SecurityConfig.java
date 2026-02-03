package com.qms.config;

import com.qms.security.JwtAuthenticationEntryPoint;
import com.qms.security.JwtAuthenticationFilter;
import com.qms.security.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.core.env.Environment;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  private final JwtAuthenticationEntryPoint entryPoint;
  private final JwtAuthenticationFilter jwtFilter;
  private final CustomUserDetailsService userDetailsService;
  private final Environment env;

  public SecurityConfig(JwtAuthenticationEntryPoint entryPoint, JwtAuthenticationFilter jwtFilter, CustomUserDetailsService userDetailsService, Environment env) {
    this.entryPoint = entryPoint;
    this.jwtFilter = jwtFilter;
    this.userDetailsService = userDetailsService;
    this.env = env;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .exceptionHandling(e -> e.authenticationEntryPoint(entryPoint))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> {
          boolean isLocal = java.util.Arrays.asList(env.getActiveProfiles()).contains("local");
          if (isLocal) {
            auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().permitAll();
          } else {
            auth.requestMatchers("/auth/**").permitAll()
                .requestMatchers("/export/**").permitAll()
                .requestMatchers("/files/**").permitAll()
                .requestMatchers("/conformance/**").permitAll()
                .requestMatchers("/gateway/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().authenticated();
          }
        });
    http.headers(h -> h.frameOptions(f -> f.disable()));
    http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.addAllowedOriginPattern("*");
    configuration.addAllowedHeader("*");
    configuration.addAllowedMethod("*");
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
    return configuration.getAuthenticationManager();
  }
}

