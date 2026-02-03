package com.qms.security;

import com.qms.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtUtil jwtUtil;
  private final CustomUserDetailsService userDetailsService;

  public JwtAuthenticationFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
    this.jwtUtil = jwtUtil;
    this.userDetailsService = userDetailsService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
    String authHeader = request.getHeader("Authorization");
    System.out.println("JWT Filter " + request.getMethod() + " " + request.getRequestURI() + " Auth: " + authHeader);
    String token = null;
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      String qp = request.getParameter("token");
      if (qp != null && !qp.isEmpty()) token = qp;
      if (token == null) {
        jakarta.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies != null) {
          for (jakarta.servlet.http.Cookie c : cookies) {
            if ("qms_token".equals(c.getName()) && c.getValue() != null && !c.getValue().isEmpty()) {
              token = c.getValue();
              break;
            }
          }
        }
      }
    }
    if (token == null) {
      System.out.println("JWT Filter: no token found (header/query/cookie)");
    } else {
      System.out.println("JWT Filter: token found, length=" + token.length());
    }
    if (token != null) {
      Claims claims = jwtUtil.parse(token);
      if (claims != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        String username = claims.getSubject();
        try {
          UserDetails userDetails = userDetailsService.loadUserByUsername(username);
          UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
          authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
          SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
          System.out.println("JWT Filter: user not found from token: " + username);
        }
      } else {
        System.out.println("Invalid Token or Claims is null");
      }
    }
    filterChain.doFilter(request, response);
  }
}

