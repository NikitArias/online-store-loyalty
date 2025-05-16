package com.arias.online_store.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank(message = "Укажите имя")
    private String name;

    @Email(message = "Некорректный email")
    @NotBlank(message = "Email не может быть пустым")
    private String email;

    @NotBlank(message = "Пароль не может быть пустым")
    @Size(min = 6, message = "Пароль должен содержать минимум 6 символов")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*[0-9]).{6,}$",
            message = "Пароль должен содержать хотя бы одну букву и одну цифру")
    private String password;

    @Pattern(regexp = "^7\\d{10}$", message = "Некорректный номер телефона")
    @NotBlank(message = "Укажите номер телефона")
    private String phone;

    @NotBlank(message = "Укажите адрес")
    private String address;
}
