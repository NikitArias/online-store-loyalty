package com.arias.online_store.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRequest {
    @NotNull
    private Integer userId;

    @NotNull
    private Integer productId;

    @Min(1)
    @Max(5)
    private int rating;

    private String comment;
}
