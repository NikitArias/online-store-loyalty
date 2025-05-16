package com.arias.online_store.service;

import com.arias.online_store.entity.*;
import com.arias.online_store.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final AchievementService achievementService;
    private final UserAchievementRepository userAchievementRepository;
    private final AchievementRepository achievementRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository, ProductRepository productRepository, ReviewRepository reviewRepository, AchievementService achievementService, UserAchievementRepository userAchievementRepository, AchievementRepository achievementRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.reviewRepository = reviewRepository;
        this.achievementService = achievementService;
        this.userAchievementRepository = userAchievementRepository;
        this.achievementRepository = achievementRepository;
    }

    public List<Order> getOrdersByUser(User user) {
        List<Order> orders = orderRepository.findByUserId(user.getId());

        List<Review> userReviews = reviewRepository.findByUser(user);

        Map<Integer, Review> reviewMap = userReviews.stream()
                .collect(Collectors.toMap(r -> r.getProduct().getId(), r -> r));

        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                Review review = reviewMap.get(item.getProduct().getId());
                if (review != null) {
                    item.getProduct().setReview(review);
                }
            }
        }
        return orders;
    }

    public Optional<Order> getProcessingOrderByUser(User user) {
        return orderRepository.findFirstByUserIdAndStatus(user.getId(), OrderStatus.PROCESSING);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Integer id) {
        return orderRepository.findById(id).orElse(null);
    }

    public Order createOrder(Order order) {
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.PROCESSING);

        for (OrderItem item : order.getOrderItems()) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Продукт не найден"));
            item.setProduct(product);
            item.setPrice(product.getPrice());
            item.setOrder(order);
        }
        return orderRepository.save(order);
    }

    public Order updateOrderStatus(Integer orderId, OrderStatus newStatus) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);

        if (optionalOrder.isEmpty()) {
            throw new IllegalStateException("Заказ не найден");
        }

        Order order = optionalOrder.get();
        OrderStatus oldStatus = order.getStatus();

        if (!isValidStatusChange(order.getStatus(), newStatus)) {
            throw new IllegalStateException("Неверный переход статуса");
        }

        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);

        if (oldStatus != OrderStatus.DELIVERED && newStatus == OrderStatus.DELIVERED) {
            achievementService.evaluateDeliveredOrderAchievements(order.getUser().getId());
        }
        return updatedOrder;
    }

    private boolean isValidStatusChange(OrderStatus current, OrderStatus next) {
        return (current == OrderStatus.PROCESSING && (next == OrderStatus.SENT || next == OrderStatus.CANCELLED)) ||
                (current == OrderStatus.SENT && (next == OrderStatus.DELIVERED || next == OrderStatus.CANCELLED));
    }

    @Transactional
    public Order markOrderAsSent(User user) {
        Order order = orderRepository.findFirstByUserIdAndStatus(user.getId(), OrderStatus.PROCESSING)
                .orElseThrow(() -> new IllegalStateException("У пользователя нет активного заказа"));

        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new IllegalStateException("Недостаточно товаров на складе для: " + product.getName());
            }
        }

        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
        }

        recalculateFinalPrice(order);
        order.setStatus(OrderStatus.SENT);
        order.setUpdatedAt(LocalDateTime.now());

        LocalDateTime registrationTime = user.getCreatedAt();
        if (registrationTime != null && Duration.between(registrationTime, order.getUpdatedAt()).toMinutes() <= 60) {
            achievementService.checkAndUnlockAchievement(user.getId(), "fast_order_after_signup");

            Achievement achievement = achievementRepository.findByConditionCode("fast_order_after_signup")
                    .orElseThrow(() -> new IllegalStateException("Достижение fast_order_after_signup не найдено"));

            UserAchievement bonus = userAchievementRepository.findByUserIdAndAchievementId(user.getId(), achievement.getId())
                    .orElseThrow(() -> new IllegalStateException("Достижение не присвоено пользователю"));

            if (!bonus.isBonusUsed()) {
                BigDecimal discount = order.getFinalPrice().multiply(BigDecimal.valueOf(0.05));
                order.setFinalPrice(order.getFinalPrice().subtract(discount));
            }

            bonus.setBonusUsed(true);
            userAchievementRepository.save(bonus);
        }

        List<UserAchievement> activeBonuses = userAchievementRepository.findByUserIdAndBonusUsedFalse(user.getId());
        for (UserAchievement bonus : activeBonuses) {
            Achievement achievement = bonus.getAchievement();
            if (achievement != null) {
                String code = achievement.getConditionCode();
                if (code.equals("first_order") || code.equals("order_count_3") || code.equals("order_count_5")) {
                    bonus.setBonusUsed(true);
                }
            }
        }

        userAchievementRepository.saveAll(activeBonuses);
        return orderRepository.save(order);
    }

    public boolean deleteOrder(User user, Integer orderId) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);

         if (optionalOrder.isEmpty()) {
             throw new IllegalStateException("Заказ не найден");
         }

         Order order = optionalOrder.get();

         if (!order.getUser().getId().equals(user.getId())) {
             throw new IllegalStateException("Это не ваш заказ");
         }

        if (order.getStatus() != OrderStatus.PROCESSING && order.getStatus() != OrderStatus.CANCELLED) {
            throw new IllegalStateException("Удалять можно только отмененные или необработанные заказы");
        }

        orderRepository.deleteById(order.getId());
        return true;
    }

    public Order addItemToOrder(User user, Integer productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Товар не найден"));

        Order order = getOrCreateActiveOrder(user);

        OrderItem existingItem = order.getOrderItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst().orElse(null);

        int newQuantity = (existingItem != null ? existingItem.getQuantity() : 0) + quantity;

        if (product.getStockQuantity() < newQuantity) {
            throw new IllegalArgumentException("На складе недостаточно товара. В наличии: " + product.getStockQuantity());
        }

        if (existingItem != null && order.getStatus() == OrderStatus.PROCESSING) {
            existingItem.setQuantity(newQuantity);
            existingItem.setPrice(product.getPrice().multiply(BigDecimal.valueOf(newQuantity)));
        } else {
            OrderItem newItem = new OrderItem();
            newItem.setOrder(order);
            newItem.setProduct(product);
            newItem.setQuantity(quantity);
            newItem.setPrice(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
            order.getOrderItems().add(newItem);
        }

        recalculateFinalPrice(order);

        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    private BigDecimal getDiscountMultiplier(List<UserAchievement> bonuses) {
        Map<String, BigDecimal> discountMap = Map.of(
                "first_order", BigDecimal.valueOf(0.95),
                "order_count_3", BigDecimal.valueOf(0.90),
                "order_count_5", BigDecimal.valueOf(0.85)
        );

        return bonuses.stream()
                .map(bonus -> discountMap.getOrDefault(bonus.getAchievement().getConditionCode(), BigDecimal.ONE))
                .min(Comparator.naturalOrder())
                .orElse(BigDecimal.ONE);
    }

    public Order updateItemQuantity(User user, Integer productId, int quantity) {
        Order order = getOrCreateActiveOrder(user);

        OrderItem item = order.getOrderItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst().orElse(null);

        if (item == null) {
            throw new IllegalArgumentException("Товар не найден в заказе");
        }

        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new IllegalStateException("Нельзя изменить отправленный/отмененный заказ");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Товар не найден"));

        if (quantity > product.getStockQuantity()) {
            throw new IllegalArgumentException("На складе недостаточно товара. В наличии: " + product.getStockQuantity());
        }

        if (quantity > 0) {
            item.setQuantity(quantity);
            item.setPrice(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
        } else {
            order.getOrderItems().remove(item);
        }

        if (order.getOrderItems().isEmpty()) {
            order.setStatus(OrderStatus.CANCELLED);
        }

        recalculateFinalPrice(order);

        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    public Order removeItemFromOrder(User user, Integer productId) {
        Order order = getOrCreateActiveOrder(user);

        if (order == null || order.getOrderItems().stream()
                .noneMatch(i -> i.getProduct().getId().equals(productId))) {
            throw new IllegalStateException("Ошибка: у пользователя нет активного заказа или товар отсутствует в заказе");
        }

        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new IllegalStateException("Нельзя изменить отправленный/отмененный заказ");
        }

        order.getOrderItems().removeIf(item -> item.getProduct().getId().equals(productId));

        if (order.getOrderItems().isEmpty()) {
            orderRepository.delete(order);
            return null;
        } else {
            recalculateFinalPrice(order);

            order.setUpdatedAt(LocalDateTime.now());
            return orderRepository.save(order);
        }
    }

    public Order decreaseItemQuantity(User user, Integer productId) {
        Order order = getOrCreateActiveOrder(user);

        if (order == null || order.getOrderItems().stream()
                .noneMatch(i -> i.getProduct().getId().equals(productId))) {
            throw new IllegalStateException("Ошибка: у пользователя нет активного заказа или товар отсутствует в заказе");
        }

        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new IllegalStateException("Нельзя изменить отправленный/отмененный заказ");
        }

        OrderItem item = order.getOrderItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst().orElse(null);

        if (item != null) {
            if (item.getQuantity() > 1) {
                item.setQuantity(item.getQuantity() - 1);
                item.setPrice(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            } else {
                order.getOrderItems().remove(item);
            }

            if (order.getOrderItems().isEmpty()) {
                orderRepository.delete(order);
                return null;
            } else {
                recalculateFinalPrice(order);

                order.setUpdatedAt(LocalDateTime.now());
                return orderRepository.save(order);
            }
        }
        return order;
    }

    public Order cancelOrder(User user, Integer orderId) {
        Order order = orderRepository.findByIdAndUserIdAndStatusIn(orderId, user.getId(),
                        List.of(OrderStatus.PROCESSING, OrderStatus.SENT))
                .orElseThrow(() -> new IllegalStateException("Активный заказ не найден"));

        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Нельзя отменить доставленный или уже отмененный заказ");
        }

        if (order.getStatus() == OrderStatus.SENT) {
            for (OrderItem item : order.getOrderItems()) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    public Order getOrCreateActiveOrder(User user) {
        return orderRepository.findFirstByUserIdAndStatus(user.getId(), OrderStatus.PROCESSING)
                .orElseGet(() -> {
                    Order newOrder = new Order();
                    newOrder.setUser(user);
                    newOrder.setStatus(OrderStatus.PROCESSING);
                    newOrder.setCreatedAt(LocalDateTime.now());
                    newOrder.setUpdatedAt(LocalDateTime.now());
                    newOrder.setOrderItems(new ArrayList<>());
                    return orderRepository.save(newOrder);
                });
    }

    public boolean deleteOrderByAdmin(Integer orderId) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);

        if (optionalOrder.isEmpty()) {
            throw new IllegalStateException("Заказ не найден");
        }

        Order order = optionalOrder.get();

        if (order.getStatus() != OrderStatus.PROCESSING && order.getStatus() != OrderStatus.CANCELLED) {
            throw new IllegalStateException("Удалять можно только отмененные или необработанные заказы");
        }

        orderRepository.deleteById(order.getId());
        return true;
    }

    private void recalculateFinalPrice(Order order) {
        List<UserAchievement> activeBonuses = achievementService.getActiveBonuses(order.getUser());
        BigDecimal discount = getDiscountMultiplier(activeBonuses);

        BigDecimal finalPrice = order.getOrderItems().stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(discount)
                .setScale(2, RoundingMode.HALF_UP);

        order.setFinalPrice(finalPrice);
    }
}
