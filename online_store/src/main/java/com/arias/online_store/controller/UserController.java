package com.arias.online_store.controller;

import com.arias.online_store.dto.AchievementWithBonusDTO;
import com.arias.online_store.dto.ChangePasswordRequest;
import com.arias.online_store.dto.UpdateProfileRequest;
import com.arias.online_store.entity.User;
import com.arias.online_store.service.AchievementService;
import com.arias.online_store.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;
    private final AchievementService achievementService;

    @Autowired
    public UserController(UserService userService, AchievementService achievementService) {
        this.userService = userService;
        this.achievementService = achievementService;
    }

    @GetMapping("/email")
    public ResponseEntity<String> getProfile(Authentication authentication) {
        return ResponseEntity.ok("Ваша почта: " + authentication.getName());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Integer id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userService.getUserByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            userService.updateUserProfile(user.getId(), request.getName(), request.getPhone(), request.getAddress());
            return ResponseEntity.ok("Профиль обновлен");
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Пользователь не найден");
    }

    @PutMapping("/password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        String email = authentication.getName();
        userService.changePassword(email, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok("Пароль изменен");
    }

    @GetMapping("/achievements")
    public ResponseEntity<List<AchievementWithBonusDTO>> getUserAchievements(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userService.getUserByEmail(email);

        if (userOpt.isPresent()) {
            Integer userId = userOpt.get().getId();
            List<AchievementWithBonusDTO> achievements = achievementService.getUserAchievementsWithBonusInfo(userId);
            return ResponseEntity.ok(achievements);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
