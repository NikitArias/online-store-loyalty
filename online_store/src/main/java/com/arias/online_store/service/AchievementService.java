package com.arias.online_store.service;

import com.arias.online_store.dto.AchievementDTO;
import com.arias.online_store.dto.AchievementWithBonusDTO;
import com.arias.online_store.entity.*;
import com.arias.online_store.repository.AchievementRepository;
import com.arias.online_store.repository.OrderRepository;
import com.arias.online_store.repository.ReviewRepository;
import com.arias.online_store.repository.UserAchievementRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;

    public AchievementService(AchievementRepository achievementRepository,
                              UserAchievementRepository userAchievementRepository, OrderRepository orderRepository, ReviewRepository reviewRepository) {
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
    }

    public void checkAndUnlockAchievement(Integer userId, String conditionCode, boolean shouldHave) {
        Optional<Achievement> achievementOpt = achievementRepository.findByConditionCode(conditionCode);
        if (achievementOpt.isEmpty()) return;

        Achievement achievement = achievementOpt.get();
        boolean alreadyUnlocked = userAchievementRepository.existsByUserIdAndAchievementId(userId, achievement.getId());

        if (shouldHave && !alreadyUnlocked) {
            UserAchievement userAchievement = new UserAchievement();
            userAchievement.setUserId(userId);
            userAchievement.setAchievementId(achievement.getId());
            userAchievement.setEarnedAt(LocalDateTime.now());

            userAchievementRepository.save(userAchievement);
        } else if (!shouldHave && alreadyUnlocked) {
            userAchievementRepository.deleteByUserIdAndAchievementId(userId, achievement.getId());
        }
    }

    public void checkAndUnlockAchievement(Integer userId, String conditionCode) {
        checkAndUnlockAchievement(userId, conditionCode, true);
    }

    public List<AchievementDTO> getAllAchievementsAsDTO() {
        return achievementRepository.findAll().stream()
                .map(a -> new AchievementDTO(a.getId(), a.getTitle(), a.getDescription(),
                        a.getReward()))
                .collect(Collectors.toList());
    }

    public List<AchievementWithBonusDTO> getUserAchievementsWithBonusInfo(Integer userId) {
        return userAchievementRepository.findByUserId(userId).stream()
                .map(ua -> new AchievementWithBonusDTO(ua.getAchievementId(),
                        ua.getAchievement().getTitle(), ua.isBonusUsed()))
                .collect(Collectors.toList());
    }

    public void evaluateDeliveredOrderAchievements(Integer userId) {
        List<Order> deliveredOrders = orderRepository.findByUserIdAndStatus(userId, OrderStatus.DELIVERED);

        if (deliveredOrders.isEmpty()) return;

        // Ачивка за первый заказ
        checkAndUnlockAchievement(userId, "first_order");

        // Количество заказов
        int deliveredCount = deliveredOrders.size();
        if (deliveredCount >= 3) checkAndUnlockAchievement(userId, "order_count_3");
        if (deliveredCount >= 5) checkAndUnlockAchievement(userId, "order_count_5");

        // Уникальные товары
        Set<Integer> uniqueProductIds = deliveredOrders.stream()
                .flatMap(order -> order.getOrderItems().stream())
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toSet());
        if (uniqueProductIds.size() >= 5) checkAndUnlockAchievement(userId, "unique_products_5");

        // Серия заказов по месяцам
        Set<YearMonth> monthsWithOrders = deliveredOrders.stream()
                .map(order -> YearMonth.from(order.getUpdatedAt()))
                .collect(Collectors.toSet());

        YearMonth currentMonth = YearMonth.now();
        long streak = 0;
        for (int i = 0; i < 3; i++) {
            if (monthsWithOrders.contains(currentMonth.minusMonths(i))) {
                streak++;
            } else break;
        }

        if (streak >= 3) checkAndUnlockAchievement(userId, "monthly_order_streak_3");

        checkAllAchievementsUnlocked(userId);
    }

    public void evaluateReviewAchievements(Integer userId) {
        int reviewCount = reviewRepository.countByUserId(userId);

        checkAndUnlockAchievement(userId, "first_review", reviewCount >= 1);
        checkAndUnlockAchievement(userId, "review_count_3", reviewCount >= 3);
    }

    private void checkAllAchievementsUnlocked(Integer userId) {
        Optional<Achievement> allAchievementOpt = achievementRepository.findByConditionCode("all_achievements");
        if (allAchievementOpt.isEmpty()) return;

        Achievement allAchievement = allAchievementOpt.get();
        boolean alreadyUnlocked = userAchievementRepository.existsByUserIdAndAchievementId(userId, allAchievement.getId());
        if (alreadyUnlocked) return;

        List<Achievement> allAchievements = achievementRepository.findAll();
        Set<Integer> otherAchievementIds = allAchievements.stream()
                .filter(a -> !a.getConditionCode().equals("all_achievements"))
                .map(Achievement::getId)
                .collect(Collectors.toSet());

        Set<Integer> userAchievementIds = userAchievementRepository.findByUserId(userId).stream()
                .map(UserAchievement::getAchievementId)
                .collect(Collectors.toSet());

        if (userAchievementIds.containsAll(otherAchievementIds)) {
            checkAndUnlockAchievement(userId, "all_achievements");
        }
    }

    public List<UserAchievement> getActiveBonuses(User user) {
        List<String> activeCodes = List.of("first_order", "order_count_3", "order_count_5");

        return userAchievementRepository.findByUserId(user.getId()).stream()
                .filter(ua -> {
                    Optional<Achievement> achievementOpt = achievementRepository.findById(ua.getAchievementId());
                    return achievementOpt.isPresent()
                            && activeCodes.contains(achievementOpt.get().getConditionCode())
                            && !ua.isBonusUsed();
                })
                .collect(Collectors.toList());
    }
}
