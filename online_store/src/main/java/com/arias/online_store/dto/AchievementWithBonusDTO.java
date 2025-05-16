package com.arias.online_store.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AchievementWithBonusDTO {
    private int id;
    private String title;
    private boolean bonusUsed;

    public AchievementWithBonusDTO(Integer id, String title, boolean bonusUsed) {
        this.id = id;
        this.title = title;
        this.bonusUsed = bonusUsed;
    }
}
