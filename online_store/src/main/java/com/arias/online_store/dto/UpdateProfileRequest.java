package com.arias.online_store.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    @NotBlank(message = "Имя не может быть пустым")
    private String name;

    @Pattern(regexp = "^7\\d{10}$", message = "Некорректный номер телефона")
    private String phone;

    @NotBlank(message = "Адрес не может быть пустым")
    private String address;
}
