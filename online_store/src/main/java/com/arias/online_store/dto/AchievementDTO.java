package com.arias.online_store.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AchievementDTO {
    private Integer id;
    private String title;
    private String description;
    private String reward;

    public AchievementDTO(Integer id, String title, String description, String reward) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.reward = reward;
    }
}
