package com.arias.online_store.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_achievements")
@IdClass(UserAchievementId.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserAchievement {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @Id
    @Column(name = "achievement_id")
    private Integer achievementId;

    @Column(name = "earned_at")
    private LocalDateTime earnedAt;

    @Column(name = "bonus_used", nullable = false)
    private boolean bonusUsed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "achievement_id", insertable = false, updatable = false)
    private Achievement achievement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}
