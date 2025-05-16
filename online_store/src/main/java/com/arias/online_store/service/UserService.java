package com.arias.online_store.service;

import com.arias.online_store.entity.User;
import com.arias.online_store.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
@Getter
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void registerUser(User user) {
        userRepository.save(user);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> getUserById(Integer Id) {
        return userRepository.findById(Id);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> updateUserProfile(Integer userId, String name, String phone, String address) {
        return userRepository.findById(userId).map(user -> {
            if (name != null && !name.trim().isEmpty()) {
                user.setName(name);
            }
            if (phone != null && !phone.trim().isEmpty()) {
                user.setPhone(phone);
            }
            if (address != null && !address.trim().isEmpty()) {
                user.setAddress(address);
            }
            userRepository.save(user);
            return user;
        });
    }

    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Пользователь не найден"));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Старый пароль неверный");
        }

        if (newPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Новый пароль должен содержать минимум 6 символов");
        }
        if (!newPassword.matches("^(?=.*[A-Za-z])(?=.*[0-9]).{6,}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Новый пароль должен содержать хотя бы одну букву и одну цифру");
        }
        if (oldPassword.equals(newPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Старый и новый пароли не могут совпадать");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void toggleUserBlock(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        user.setBlocked(!user.isBlocked());
        userRepository.save(user);
    }
}
