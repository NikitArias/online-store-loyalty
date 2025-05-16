package com.arias.online_store.repository;

import com.arias.online_store.entity.UserAchievement;
import com.arias.online_store.entity.UserAchievementId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UserAchievementId> {
    List<UserAchievement> findByUserId(Integer userId);
    boolean existsByUserIdAndAchievementId(Integer userId, Integer achievementId);

    void deleteByUserIdAndAchievementId(Integer userId, Integer achievementId);

    Optional<UserAchievement> findByUserIdAndAchievementId(Integer userId, Integer achievementId);

    List<UserAchievement> findByUserIdAndBonusUsedFalse(Integer userId);
}
