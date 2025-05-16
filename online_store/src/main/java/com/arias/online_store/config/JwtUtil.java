package com.arias.online_store.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Component
public class JwtUtil {
    private static final String SECRET = "b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAAGAAAABAZChy4jr\n" +
            "j5InA1S1MSsHJeAAAAGAAAAAEAAAAzAAAAC3NzaC1lZDI1NTE5AAAAIFC1AliA3Q/1qn6v\n" +
            "qeuG7rgEHJ+22xCeyFDx+lmd2AJKAAAAoPmEBPZguUAdAfoxhm+7PWxRtzWyeBz0V/Crcd\n" +
            "lwvoEWoBF3XMMaiCNFyGnwTws2yFSTpJAvNzTistUWnqJYY04KW1Cka64JOCPIMwl0i521\n" +
            "HsGGm9llvkyvf/y0lA67viy9WPNcPIzn8W3+oXW/wxIIOq4VH1KUg8SXdqyJQUI86tqu6O\n" +
            "0cAfI3zhFN+htD1nxPphrr2XchnP6gU/n2Na0=";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    private final Set<String> revokedTokens = new HashSet<>();

    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10))
                .signWith(SECRET_KEY)
                .compact();
    }

    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public boolean validateToken(String token, String userEmail) {
        return userEmail.equals(extractEmail(token)) && !isTokenExpired(token) && !revokedTokens.contains(token);
    }

    public void revokeToken(String token) {
        revokedTokens.add(token);
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }
}
