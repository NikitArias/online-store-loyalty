package com.arias.online_store.entity;

import lombok.*;

import java.io.Serializable;

@EqualsAndHashCode
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAchievementId implements Serializable {
    private Integer userId;
    private Integer achievementId;
}
