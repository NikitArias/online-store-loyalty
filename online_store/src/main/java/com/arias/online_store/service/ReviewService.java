package com.arias.online_store.service;

import com.arias.online_store.entity.*;
import com.arias.online_store.repository.OrderRepository;
import com.arias.online_store.repository.ProductRepository;
import com.arias.online_store.repository.ReviewRepository;
import com.arias.online_store.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final AchievementService achievementService;

    @Autowired
    public ReviewService(ReviewRepository reviewRepository, OrderRepository orderRepository, UserRepository userRepository, ProductRepository productRepository, AchievementService achievementService) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.achievementService = achievementService;
    }

    public List<Review> getReviewsByProduct(Integer productId) {
        return reviewRepository.findByProductId(productId);
    }

    public List<Review> getReviewsByUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));
        return reviewRepository.findByUser(user);
    }

    public Review addReview(Integer userId, Integer productId, int rating, String comment) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Товар не найден"));

        ReviewId reviewId = new ReviewId(userId, productId);
        if (reviewRepository.existsById(reviewId)) {
            throw new IllegalArgumentException("Вы уже оставили отзыв на этот товар");
        }

        boolean hasPurchased = orderRepository.findByUserAndStatus(user, OrderStatus.DELIVERED).stream()
                .flatMap(order -> order.getItems().stream())
                .map(OrderItem::getProduct)
                .anyMatch(p -> p.getId().equals(productId));

        if (!hasPurchased) {
            throw new IllegalArgumentException("Вы можете оставить отзыв только на купленный товар");
        }

        Review review = new Review();
        review.setId(reviewId);
        review.setUser(user);
        review.setProduct(product);
        review.setRating(rating);
        review.setComment(comment);

        Review saved = reviewRepository.save(review);
        achievementService.evaluateReviewAchievements(userId);
        return saved;
    }

    public void deleteReview(Integer userId, Integer productId) {
        ReviewId reviewId = new ReviewId(userId, productId);
        if (!reviewRepository.existsById(reviewId)) {
            throw new EntityNotFoundException("Отзыв не найден");
        }
        reviewRepository.deleteById(reviewId);
        achievementService.evaluateReviewAchievements(userId);
    }
}
