package com.arias.online_store.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {
    private String oldPassword;

    @NotBlank(message = "Пароль не может быть пустым")
    private String newPassword;
}
