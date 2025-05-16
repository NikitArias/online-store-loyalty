package com.arias.online_store.controller;

import com.arias.online_store.config.JwtUtil;
import com.arias.online_store.dto.LoginRequest;
import com.arias.online_store.dto.RegisterRequest;
import com.arias.online_store.entity.Admin;
import com.arias.online_store.entity.User;
import com.arias.online_store.repository.AdminRepository;
import com.arias.online_store.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AdminRepository adminRepository;

    public AuthController(UserService userService, AuthenticationManager authenticationManager,
                          PasswordEncoder passwordEncoder, JwtUtil jwtUtil, AdminRepository adminRepository) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.adminRepository = adminRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userService.getUserByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email уже используется");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());

        userService.registerUser(user);
        return ResponseEntity.ok("Регистрация успешна");
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            Optional<User> userOpt = userService.getUserByEmail(userDetails.getUsername());
            Optional<Admin> adminOpt = adminRepository.findByEmail(userDetails.getUsername());

            if (userOpt.isPresent() && userOpt.get().isBlocked()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Аккаунт заблокирован"));
            }

            String role = userOpt.isPresent() ? "USER" : "ADMIN";
            Integer id = userOpt.map(User::getId).orElseGet(() -> adminOpt.get().getId());

            String token = jwtUtil.generateToken(userDetails.getUsername(), role);

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("id", String.valueOf(id));
            response.put("role", role);
            if (role.equals("USER")) response.put("name", userOpt.get().getName());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Неверный логин или пароль"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request, HttpServletResponse response) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            jwtUtil.revokeToken(token);
        }

        SecurityContextHolder.clearContext();

       HttpSession session = request.getSession(false);
       if (session != null) {
           session.invalidate();
       }

       Cookie cookie = new Cookie("JSESSIONID", null);
       cookie.setHttpOnly(true);
       cookie.setSecure(true);
       cookie.setPath("/");
       cookie.setMaxAge(0);
       response.addCookie(cookie);

       return ResponseEntity.ok("Вы вышли из системы");
    }
}
